# Data Model: avisos de animales nuevos (#265)

Una migración forward-only, `supabase/migrations/20261102120000_pet_alerts.sql`. Después,
`pnpm db:types`.

## Columnas nuevas

### `public.pets.first_listed_at timestamptz null`

La primera vez que el animal se vio en el listado (research R1). Solo para animales sueltos
(`litter_id is null`); en las crías queda nula. Nunca cambia una vez puesta.
Backfill: `published_at` en todas las filas sueltas existentes.
Índice parcial `pets_first_listed_pending_idx on (id) where first_listed_at is null and litter_id is null`.

### `public.litters.first_listed_at timestamptz null`

Lo mismo para la camada. Backfill: `published_at`. Índice parcial análogo.

## Tablas nuevas

### `public.pet_alerts`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk default `gen_random_uuid()` | |
| `user_id` | `uuid not null` → `auth.users(id) on delete cascade` | la dueña |
| `species` | `text[] not null default '{}'` | cada uno en `('dog','cat')`; ordenado, sin repetidos |
| `sexes` | `text[] not null default '{}'` | `('male','female')` |
| `sizes` | `text[] not null default '{}'` | `('small','medium','large')` |
| `age_bands` | `text[] not null default '{}'` | `('puppy','young','adult','senior')` |
| `departments` | `text[] not null default '{}'` | códigos de departamento; a lo sumo 1 |
| `neutered_only` | `boolean not null default false` | |
| `created_at` | `timestamptz not null default now()` | |
| `covered_until` | `timestamptz not null default now()` | research R2; al crear, igual a `created_at` |

- `check`: cada arreglo con valores del vocabulario (`<@`), `cardinality(departments) <= 1`,
  `covered_until >= created_at`. Los valores del vocabulario se comparan con `lib/pets/options.ts` y
  `lib/zones/departments.ts` en una prueba de base, como los de `pets`.
- Índice único `pet_alerts_same_filters_uq on (user_id, species, sexes, sizes, age_bands,
  departments, neutered_only)`: dos avisos iguales no entran (los arreglos llegan normalizados por
  `create_pet_alert`).
- Índice `pet_alerts_user_created_idx on (user_id, created_at, id)`: «Mis avisos» y el orden de las
  partes.
- RLS: habilitada. `pet_alerts_select_own` (`for select to authenticated using (user_id = (select
  auth.uid()))`), `pet_alerts_delete_own` (`for delete`, igual). Sin `insert`/`update`. `revoke all`
  de `anon`; `authenticated` solo `select, delete`.
- `comment on table`: qué guarda, quién lo ve (solo la dueña) y que no lo cuenta Administrar.

### `public.pet_alert_sends`

`(user_id uuid not null → auth.users on delete cascade, day date not null, primary key (user_id,
day))`. El reclamo del correo del día (research R2). RLS habilitada, sin políticas, `revoke all` de
`anon` y `authenticated`. La corrida borra los de más de 7 días.

### `public.pet_alert_unsubscribe_links`

`(token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'), user_id uuid not null →
auth.users on delete cascade, created_at timestamptz not null default now())`. Índices por
`user_id` y por `created_at`. RLS habilitada, sin políticas, `revoke all` de `anon` y
`authenticated`. La corrida borra los de más de 180 días (research R6).

## Funciones

| Función | Seguridad | Quién | Qué hace |
|---|---|---|---|
| `private.age_band_range(text) returns int4range` | immutable | interna | el rango en meses de cada tramo, el de `AGE_BANDS` |
| `private.stamp_first_listed() returns void` | definer | interna, `pg_cron` | marca `first_listed_at = now()` en lo que hoy se ve en el listado y no tiene marca (R1) |
| `public.create_pet_alert(p_species text[], p_sexes text[], p_sizes text[], p_age_bands text[], p_departments text[], p_neutered_only boolean) returns text` | definer, `auth.uid()` | `authenticated` | normaliza, bloquea por cuenta, marca apariciones, devuelve `created` · `duplicate` · `limit`; sin sesión, excepción `not_signed_in` (R9) |
| `public.claim_pet_alert_mail() returns table (user_id uuid, alert_id uuid, alert_created_at timestamptz, species text[], sexes text[], sizes text[], age_bands text[], departments text[], neutered_only boolean, kind text, code text, name text, item_species text, sex text, age_value smallint, age_unit text, age_as_of date, department text, locality text, young_count integer, cover_id uuid, first_listed_at timestamptz, run_at timestamptz)` | definer | `service_role` | borra envíos de más de 7 días y enlaces de más de 180; marca apariciones; reclama a cada persona con avisos que no recibió el de hoy; a las suspendidas y a las que no tienen nada les avanza `covered_until` a `run_at` y no las devuelve; devuelve, de las demás, una fila por aviso y coincidencia (R2, R3) |
| `public.mark_pet_alerts_mailed(p_user uuid, p_run_at timestamptz) returns void` | definer | `service_role` | `covered_until = greatest(covered_until, p_run_at)` en todos los avisos de esa persona creados hasta `p_run_at` |
| `public.create_pet_alert_unsubscribe_link(p_user uuid, p_token_hash text) returns void` | definer | `service_role` | guarda el hash del enlace de un correo |
| `public.pet_alert_unsubscribe_link_exists(p_token_hash text) returns boolean` | definer | `service_role` | la pantalla, antes de montar la hoja (R7) |
| `public.unsubscribe_pet_alerts(p_token_hash text) returns table (outcome text, deleted integer)` | definer | `service_role` | `done` con cuántos avisos borró (0 si ya no tenía), o `unknown` |

- `pg_cron`: `cron.alter_job` del trabajo `pet-lifecycle` para que su comando sea `select
  private.stamp_first_listed(); select public.pet_lifecycle_tick(); select
  private.task_ran('pet-lifecycle')`. El trabajo `admin-digest` no cambia: su ruta suma los avisos.
- `revoke all … from public, anon, authenticated` en cada una y `grant execute` solo a quien dice la
  tabla.

## Estados y transiciones

- **Aviso**: no existe → existe (crear) → no existe (borrar, «Dejar de recibir», borrar la cuenta).
  `covered_until` solo crece.
- **Primera aparición**: nula → puesta (una sola vez).
- **Día de una persona**: sin reclamar → reclamado (`pet_alert_sends`) → con correo aceptado
  (`mark_pet_alerts_mailed`) o sin correo (falla: `covered_until` queda).

## Tipos de TypeScript (dominio)

- `AlertFilters` = `ListingFilters` normalizado (`lib/alerts/types.ts`).
- `PetAlert` = `{ id, filters: AlertFilters, createdAt }` («Mis avisos»).
- `AlertMatch` = `{ kind: 'pet' | 'litter', code, name, species, sex | youngCount, age, zone,
  coverId, firstListedAt }`.
- `AlertMailPart` = `{ alertId, filters, items: AlertMatch[] }` (a lo sumo 6).
- `CreateAlertOutcome` = `'created' | 'duplicate' | 'limit'`.
