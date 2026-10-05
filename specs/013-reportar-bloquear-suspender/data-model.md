# Data model: Reportar, bloquear y suspender

Una migración: `supabase/migrations/<ts>_moderation.sql`. Forward-only. Todas las tablas con RLS
encendida y `revoke all` para `anon` y `authenticated`; las que tienen policy reciben además
`grant select` a `authenticated` (el patrón de `identity_request_images`), y las policies nombran
`to authenticated`. Las escrituras y lo ajeno salen por funciones `security definer` con
`set search_path = ''`.

## Tablas nuevas

### `public.account_suspensions`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk | `gen_random_uuid()` |
| `user_id` | `uuid` not null | → `auth.users` `on delete cascade` |
| `reason` | `text` not null | `char_length(btrim(reason)) between 1 and 1000` |
| `suspended_by` | `uuid` | → `auth.users` `on delete set null` |
| `suspended_at` | `timestamptz` not null | `now()` |
| `lifted_by` | `uuid` | → `auth.users` `on delete set null` |
| `lifted_at` | `timestamptz` | `(lifted_at is null) or (lifted_at >= suspended_at)` |

Índices: único parcial `(user_id) where lifted_at is null` (una vigente); `(user_id,
suspended_at desc)` para el historial. `grant select` a `authenticated` y policy `select to
authenticated using ((select private.is_admin()) and user_id <> (select auth.uid()))`.

### `public.reports`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk | |
| `reporter_id` | `uuid` | → `auth.users` `on delete set null` (FR-041) |
| `reported_id` | `uuid` not null | → `auth.users` `on delete cascade` |
| `reason` | `text` not null | `in ('scam','animal_abuse','sells_animals','impersonation','harassment','other')` |
| `details` | `text` | `null` o `char_length between 1 and 1000`; not null y no vacío si `reason = 'other'` |
| `created_at` | `timestamptz` not null | `now()` |
| `resolved_at` | `timestamptz` | |
| `resolved_by` | `uuid` | → `auth.users` `on delete set null` |
| `resolution` | `text` | `in ('dismissed','suspended')`; `(resolved_at is null) = (resolution is null)` |
| `suspension_id` | `uuid` | → `account_suspensions` `on delete set null`; solo con `suspended` |

Checks: `reporter_id <> reported_id`. Índices: único parcial `(reporter_id, reported_id, reason)
where resolved_at is null` (FR-004); `(created_at) where resolved_at is null` (la cola);
`(reported_id, created_at desc)` (historial). `grant select` a `authenticated` y policy `select to
authenticated using ((select private.is_admin()) and reported_id <> (select auth.uid()))`.

### `public.blocks`

| Columna | Tipo | Regla |
|---|---|---|
| `blocker_id` | `uuid` | → `auth.users` `on delete cascade` |
| `blocked_id` | `uuid` | → `auth.users` `on delete cascade` |
| `created_at` | `timestamptz` not null | `now()` |

pk `(blocker_id, blocked_id)`; check distintos; índice `(blocked_id)`. `grant select` a
`authenticated` y policy `select to authenticated using (blocker_id = (select auth.uid()) or
(select private.is_admin()))` (FR-040; ninguna pantalla de esta historia lo usa).

### `public.withheld_numbers`

| Columna | Tipo | Regla |
|---|---|---|
| `number_hash` | `text` pk | `~ '^[0-9a-f]{64}$'` (HMAC-SHA-256 en hex del número normalizado, con la clave de Vault `withheld_number_key`) |
| `until` | `timestamptz` not null | |

Sin policies: nadie lo lee desde el cliente, tampoco quien administra (FR-028). Sin columnas que
unan a una cuenta.

## Funciones nuevas

| Función | Para | Qué |
|---|---|---|
| `private.is_suspended(uuid)` | interna | Hay una suspensión sin levantar. |
| `private.withheld_lifetime()` | interna | `interval '12 months'`, paridad con `lib/moderation/rules.ts`. |
| `private.number_hash(text)` | interna | `encode(extensions.hmac(n, <clave de Vault>, 'sha256'), 'hex')`. La migración crea el secreto `withheld_number_key` si no existe. |
| `private.number_withheld(text)` | interna | El número es el verificado de una suspendida o está en `withheld_numbers` con `until > now()`. |
| `public.my_account_standing()` | `authenticated` | `suspended`, `reason`, `since` de `auth.uid()`; cero filas si no hay. |
| `public.create_report(uuid, text, text, text)` | `service_role` | R5. |
| `public.report_queue()` | `authenticated` + `is_admin()` | R5. |
| `public.count_open_reports()` | `authenticated` + `is_admin()` | Sin los propios. |
| `public.close_report(uuid)` | `authenticated` + `is_admin()` | Cerrar sin medidas (R5). |
| `public.suspend_account(text, text, uuid)` | `authenticated` + `is_admin()` | R6. Devuelve `outcome`, si retiró un pedido de identidad, los reportes que cerró con su `created_at`, y la cuenta para el correo. |
| `public.reactivate_account(uuid)` | `authenticated` + `is_admin()` | R6 y R3. |
| `public.suspended_accounts()` | `authenticated` + `is_admin()` | Vigentes, de la más reciente a la más vieja, con quién suspendió (o null). |
| `public.block_person(uuid, text)` · `unblock_person(uuid, text)` · `my_blocks(uuid)` | `service_role` | R7. |
| `public.blocked_profile(uuid, text)` | `service_role` | El nombre de una persona bloqueada por quien mira, esté o no suspendida. |
| `public.purge_withheld_numbers()` | `pg_cron` diario | R8. |
| `private.retain_suspended_number()` | trigger `before delete` en `auth.users` | R8. Nunca bloquea el borrado. |

## Funciones que cambian

`private.has_level_two` · `private.pet_is_listed` · `private.is_admin` · `public.public_profile`
· `public.my_vouches` · `public.vouch_standing` (tipo de retorno: se borra y se recrea) ·
`public.give_vouch` (`unavailable`) · `public.listed_pets` · `public.pet_by_code` (`blocked`, y
cero filas con dueña suspendida) · `public.pet_review_queue` · `public.count_pet_reviews` ·
`public.claim_pet_reminders` · `public.claim_pet_expiries` · `public.renew_by_link` ·
`public.renewal_link_view` (cero filas con dueña suspendida) ·
`public.check_phone_code` (tipo de retorno: `withheld`) · `public.claim_phone_number` (`withheld`).
Cada una se recrea entera con sus `revoke`/`grant` de siempre. Policies que cambian: `avatars_own`
(Storage) y `profiles_update_own` suman `not private.is_suspended((select auth.uid()))` en su
`with check`.

## Estados y transiciones

- Reporte: `sin resolver` → `dismissed` | `suspended`. No vuelve atrás.
- Suspensión: `vigente` → `levantada`. Una nueva suspensión es otra fila.
- Bloqueo: existe / no existe.
- Número retenido: existe con `until` → se borra al vencer.

## Borrado de una cuenta (FR-041)

`auth.admin.deleteUser` → antes, el trigger guarda el número retenido si estaba suspendida → la
cascada borra sus bloqueos (las dos columnas), los reportes sobre ella y sus suspensiones; los
reportes que hizo quedan con `reporter_id = null`; las suspensiones o cierres que hizo como quien
administra quedan con `suspended_by`/`lifted_by`/`resolved_by = null`.
