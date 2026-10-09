# Data model: Administrar el sitio desde un solo lugar

Una migración nueva, `supabase/migrations/<ts>_admin_home.sql`. **Ningún dato nuevo de las
personas** (FR-070): una tabla con el día en que a una persona que administra ya se le mandó el
resumen, y funciones que leen lo que #11, #13, #59 y #71 ya guardan. Ninguna policy de tabla existente
cambia (research R1); se suma una policy de Storage (R10).

## Tabla nueva

### `public.admin_digest_sends`

| Columna | Tipo | Regla |
|---|---|---|
| `user_id` | `uuid` | `references auth.users (id) on delete cascade` |
| `day` | `date` | el día de Uruguay del envío (`public.uruguay_today()`) |
| | | `primary key (user_id, day)` |

RLS activada, sin policies, `revoke all` de `anon` y `authenticated`: nadie la lee desde una sesión.
Solo la escribe y la purga `claim_admin_digests()` (más de 7 días). No guarda nada de las colas.

## Funciones nuevas

Todas `security definer`, `set search_path = ''`, `revoke all ... from public, anon, authenticated`.
Las de lectura de quien administra se conceden a `authenticated` y preguntan `private.is_admin()`
adentro (que ya es falso para una cuenta suspendida, #13): cero filas, o `null`, para cualquier otra
sesión.

### `private.fold_name(p_text text) returns text` — `immutable`

`lower`, `translate` de `ÁÉÍÓÚÜÑáéíóúüñ` a `AEIOUUNaeiouun` (y las mismas con acento grave y
circunflejo, por si llegan pegadas), `btrim` y `regexp_replace('\s+', ' ', 'g')`. Sin grant: la usan
las funciones de abajo.

### `private.admin_queue_rows(p_admin uuid)` — interna

Devuelve una fila por pendiente de las tres colas: `queue text` (`identity`, `pets`, `reports`),
`since timestamptz`, `is_own boolean`, `pet_name text` (solo `pets`). Una sola definición de
«pendiente» (research R2), la usan las tres de abajo:

- `identity`: `identity_requests` con `expires_at > now()`; `since = sent_at`; propio si `user_id =
  p_admin`.
- `pets`: `pet_reviews r join pets p` con `r.pending_since is not null`, `p.taken_down_at is null` y
  `not private.is_suspended(p.owner_id)`; `since = r.pending_since`; propio si `p.owner_id = p_admin`.
- `reports`: `reports` con `resolved_at is null`; `since = created_at`; propio si `reported_id =
  p_admin`.

### `public.admin_queue_count(p_queue text)` → `table (others integer, oldest timestamptz, own jsonb)`

Para quien mira (`auth.uid()`), si administra: cuántos no propios, el `since` más viejo de esos (nulo
si 0), y `own` = arreglo de `{ since, pet_name }` de lo propio de esa cola, del más viejo al más
nuevo. `p_queue` fuera de los tres → `raise`. Para quien no administra: cero filas.

### `public.admin_pending_total()` → `integer`

`null` si quien mira no administra; si administra, la suma de los no propios de las tres colas. La
llama el menú en cada pantalla con sesión.

### `public.admin_recent_counts()` → `table (feedback integer, survey_answers integer)`

Para quien administra: `feedback` con `sent_on >= uruguay_today() - 6` y `survey_answers` con
`answered_on >= uruguay_today() - 6` (hoy y los 6 anteriores, FR-014). Cero filas para el resto.

### `public.admin_person_record(p_public_id text)` → `table (person jsonb, identity jsonb, reports jsonb, suspensions jsonb, pets jsonb)`

Cero filas si quien mira no administra o no hay perfil con ese id público. Si no (research R4):

- `person`: `public_id`, `display_name`, `avatar_path`, `department`, `locality`, `created_at`,
  `level` (`0` si no `public.identity_level_one(id, private.pending_ttl())`, si no
  `private.publisher_level(id)`), `is_self`, `suspension` (`null` o `{ id, reason, suspended_at,
  suspended_by_name }`, `suspended_by_name` nulo = una cuenta borrada).
- `identity`: `{ verified_on, open: null | { id, sent_at, is_own }, rejections: [{ rejected_on,
  reason }], expired_on }`; rechazos con `rejected_on > uruguay_today() - 30` (la ventana de #11, aunque
  la purga no haya corrido); `expired_on` solo si cae en esa misma ventana.
- `reports`: si `is_self`, `{ own_open: <n>, items: [] }`; si no, `{ own_open: 0, items: [{ reason,
  details, created_at, resolved_at, resolution }] }` sobre la persona, de lo más nuevo a lo más viejo,
  hasta 500. Nunca `reporter_id`, `resolved_by` ni `suspension_id`.
- `suspensions`: `[{ reason, suspended_at, suspended_by_name, lifted_at, lifted_by_name }]`, de lo más
  nuevo a lo más viejo, hasta 500.
- `pets`: `[{ code, name, state, pending_review, takedown_reason, published_at }]` de la persona, de lo
  más nuevo a lo más viejo, hasta 500; `state = private.pet_state(status, expires_at, taken_down_at)`;
  `pending_review` con la misma regla de la cola `pets`, también la de la dueña suspendida: lo que
  no está en Publicaciones por revisar no se dice «por revisar» en la ficha.

### `public.admin_search_people(p_query text, p_limit integer)` → `table (public_id text, display_name text, avatar_path text, department text, locality text, is_suspended boolean)`

Cero filas si quien mira no administra, o si `fold_name(p_query)` sin espacios tiene menos de 3
caracteres. Si no: perfiles con `strpos(fold_name(display_name), fold_name(p_query)) > 0`, ordenados
por `strpos(...) = 1` descendente, `fold_name(display_name)`, `created_at`; hasta
`least(greatest(p_limit, 1), 50) + 1` filas (la de más dice que hay más). Incluye la propia cuenta y
las suspendidas.

### `public.claim_admin_digests()` → `table (user_id uuid, identity_count integer, identity_oldest timestamptz, pets_count integer, pets_oldest timestamptz, reports_count integer, reports_oldest timestamptz)`

Solo `service_role`. Borra `admin_digest_sends` de más de 7 días. Para cada fila de `admins` que no
está suspendida y no tiene envío para `uruguay_today()`, cuenta las tres colas con
`private.admin_queue_rows(user_id)` sin lo propio; si la suma es mayor que cero, inserta `(user_id,
uruguay_today())` `on conflict do nothing` y devuelve la fila solo si la insertó (research R8). Todo en
una sentencia: si algo falla, nada queda reclamado.

### `public.admin_digest_tick()` → `void`

`security invoker`, como `pet_lifecycle_tick`: lee `app_url` y `cron_secret` de Vault y hace
`net.http_post` a `/api/cron/resumen`. Sin los dos secretos no llama. `cron.schedule('admin-digest',
'0 11 * * *', ...)` (08:00 de Uruguay, UTC−3 todo el año).

## Funciones que cambian

### `public.pet_review_queue(p_limit integer)`

Suma `publisher_public_id text` al retorno para el enlace a la ficha (research R5). Cambia el tipo:
`drop function` y `create function` con el mismo cuerpo más la columna, y los mismos `revoke`/`grant`.

## Storage

### Policy `avatars_select_admin` en `storage.objects`

`for select to authenticated using (bucket_id = 'avatars' and (select private.is_admin()))`
(research R10). Sola, se suma a las que ya hay; ninguna se borra.

## Estados y reglas que salen de la base a la aplicación

| Dato | Lo decide | Dónde |
|---|---|---|
| Qué es un pendiente, cuándo entró, si es propio | base | `private.admin_queue_rows` |
| Plazo, atraso, orden, cómo se dice una espera | aplicación | `lib/admin/queues.ts` (puro) |
| Qué muestra la ficha y qué nunca | base | `admin_person_record` |
| Qué encuentra la búsqueda y en qué orden | base | `admin_search_people` |
| A quién y una vez por día el resumen | base | `claim_admin_digests` + `admin_digest_sends` |
| Qué dice el resumen | aplicación | `lib/admin/digest.ts` (puro) |
| El número del menú, «99+» | base + aplicación | `admin_pending_total` + `lib/admin/badge.ts` |

## Tipos

`pnpm db:types` regenera `src/lib/supabase/types.ts`. Tipos de dominio en `src/lib/admin/types.ts`:
`QueueKey = 'identity' | 'pets' | 'reports'`, `QueueCount`, `QueueStanding`, `OwnPending`,
`PersonRecord` (con `RecordIdentity`, `RecordReport`, `RecordSuspension`, `RecordPet`),
`PersonResult`, `DigestClaim`, `AdminOrigin`, `RecordOrigin`.
