# Data model: Verificación de identidad con revisión manual

Una migración forward-only, creada con `pnpm exec supabase migration new identity_verification`.
Después, `pnpm db:types`. Antes de escribirla se carga `supabase:supabase-postgres-best-practices`.

Regla general: RLS en todas las tablas; `revoke all … from anon, authenticated` y después solo los
`grant select` que nombra cada tabla. **Ninguna tabla tiene permiso de escritura desde el cliente**:
todo pasa por las funciones de abajo, con la clave de servicio (FR-033). Cada tabla y cada columna
que no se explica sola lleva su `comment on` con el porqué, como en la historia #10.

## `private` (esquema nuevo, no expuesto por la API)

- `private.is_admin() returns boolean` — `language sql`, `stable`, `security definer`,
  `set search_path = ''`: `select exists (select 1 from public.admins where user_id = (select auth.uid()))`.
  `revoke execute … from public, anon`; `grant usage on schema private to authenticated`;
  `grant execute … to authenticated` (la evaluación de las policies lo necesita). La API no lo
  expone porque `private` no está en los esquemas publicados.

## `public.admins`

| Columna | Tipo | Regla |
|---|---|---|
| `user_id` | `uuid` PK, `references auth.users (id) on delete cascade` | Quien administra (FR-013a). |
| `created_at` | `timestamptz not null default now()` | Cuándo se designó. |

- Policy `admins_select_own` (`to authenticated using ((select auth.uid()) = user_id)`): la
  aplicación pregunta si la sesión administra. Nadie ve la lista de quienes administran.
- Sin escritura desde el cliente. El equipo inserta desde la consola; el seed designa a Lucía.

## `public.identity_requests`

Solo pedidos **en revisión**. Cerrarse es borrarse (plan §1).

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | La cola lo usa en la dirección. |
| `user_id` | `uuid not null unique`, `references auth.users (id) on delete cascade` | Uno abierto por cuenta (FR-009): `unique` alcanza porque los cerrados no quedan acá. |
| `sent_at` | `timestamptz not null default now()` | Desde cuándo espera; las horas de revisión del evento. |
| `expires_at` | `timestamptz not null` | `sent_at + ttl` (7 días) al insertar; las policies y las lecturas comparan con esto (FR-028). |
| `origin` | `text not null`, `check (origin in ('profile'))` | Desde dónde llegó (FR-035). La historia de la publicación suma su valor. |

- Índice en `expires_at` (la tarea y la cola ordenan y filtran por ahí) y en `sent_at`.
- Policies de `select`: `identity_requests_select_own` (la dueña, sin filtro de tiempo: la lectura
  decide si venció) y `identity_requests_select_admin` (`private.is_admin() and expires_at > now()`,
  incluido el propio, que la cola muestra marcado como propio, FR-020).

## `public.identity_request_images`

| Columna | Tipo | Regla |
|---|---|---|
| `request_id` | `uuid not null references identity_requests (id) on delete cascade` | Borrar el pedido borra las imágenes en la misma transacción (FR-012, FR-018, FR-028). |
| `kind` | `text not null`, `check (kind in ('front', 'selfie'))` | Frente de la cédula o selfie. |
| `data` | `bytea not null`, `check (octet_length(data) <= 460800)` | El WebP procesado (plan §3). El techo es el mismo del schema, como red. |
| PK | `(request_id, kind)` | Exactamente dos por pedido: la función inserta las dos o ninguna. |

- Policy de `select` única, `identity_request_images_select_reviewer`: `private.is_admin()` y
  existe el pedido con `expires_at > now()` y `user_id <> (select auth.uid())` (FR-019, FR-020,
  FR-029). **La dueña no tiene policy**: no vuelve a ver sus imágenes (FR-011).

## `public.identity_verifications`

| Columna | Tipo | Regla |
|---|---|---|
| `user_id` | `uuid` PK, `references auth.users (id) on delete cascade` | Una por cuenta, para siempre (FR-009). |
| `verified_on` | `date not null` | Día de Uruguay de la aprobación (FR-031). |

- Policy `identity_verifications_select_own`. Que otras personas vean el distintivo es de la #12.

## `public.identity_rejections`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `bigint generated always as identity` PK | |
| `user_id` | `uuid not null references auth.users (id) on delete cascade` | |
| `rejected_on` | `date not null` | Día de Uruguay (FR-031). |
| `reason` | `text not null`, `check (reason in ('unreadable', 'mismatch', 'expired_document', 'suspected_fraud'))` | Los cuatro motivos (FR-016), claves en inglés (docs/06). |

- Índice `(user_id, rejected_on desc)`.
- Se borran a los 30 días (`expire_identity_requests`). Las lecturas y el tope igual filtran por
  `rejected_on > hoy − 30`, por si la tarea no corrió.
- Policies: `identity_rejections_select_own`; `identity_rejections_select_admin_reviewing`
  (`private.is_admin()` y la cuenta tiene un pedido vigente, FR-014).

## `public.identity_expirations`

| Columna | Tipo | Regla |
|---|---|---|
| `user_id` | `uuid` PK, `references auth.users (id) on delete cascade` | El último vencimiento de la cuenta. |
| `expired_on` | `date not null` | Día de Uruguay (FR-031). |
| `notice_pending` | `boolean not null default true` | El correo de vencimiento todavía no se intentó (plan §10). |

- Se borra al enviar un pedido nuevo (`submit_identity_request`) y a los 30 días.
- Policy `identity_expirations_select_own`.

## `public.identity_resolutions`

| Columna | Tipo | Regla |
|---|---|---|
| `request_id` | `uuid` PK | El id del pedido ya borrado: no nombra a nadie por sí solo. Lo usa `reviewState` para decir "ya fue resuelto" (FR-021). |
| `user_id` | `uuid not null references auth.users (id) on delete cascade` | Se borra con la cuenta de la persona (FR-034). |
| `resolved_by` | `uuid references auth.users (id) on delete set null` | Nulo = "una cuenta borrada" (FR-034a). |

- Sin día ni resultado, a propósito: el día y el resultado ya están en `identity_verifications` o,
  30 días, en `identity_rejections` (spec §Assumptions, #37).
- Policy `identity_resolutions_select_admin` (`private.is_admin()`). La persona no la lee (FR-032).
- Índice en `user_id` y en `resolved_by` (las FK).

## `public.profiles` (policy nueva)

- `profiles_select_under_review`: `to authenticated using (private.is_admin() and exists (select 1
  from public.identity_requests r where r.user_id = profiles.user_id and r.expires_at > now()))`.
  Las demás policies de `profiles` no cambian.

## Funciones

Todas `language plpgsql`, `security invoker`, `set search_path = ''`, sin `execute` para `anon` ni
`authenticated` (solo la clave de servicio). "Hoy" es `(now() at time zone 'America/Montevideo')::date`.

| Función | Devuelve | Reglas |
|---|---|---|
| `submit_identity_request(p_user_id uuid, p_origin text, p_front text, p_selfie text, p_ttl interval, p_window_days int, p_cap int)` | `decision text` (`sent`, `no_phone`, `already_open`, `already_verified`, `capped`), `request_id uuid`, `retry_on date` | Candado de la cuenta. Nivel 1 = fila de `phones` con `verified_number` y sin `pending_number` vigente (igual que `phoneStatus`). Tope: rechazos con `rejected_on > hoy − p_window_days` ≥ `p_cap` → `retry_on` = el más viejo de los últimos `p_cap` + `p_window_days`. Inserta pedido + 2 imágenes (`decode(p_front, 'base64')`); borra `identity_expirations` de la cuenta. |
| `withdraw_identity_request(p_user_id uuid)` | `decision` (`withdrawn`, `not_open`, `expired`), `sent_at`, `origin` | Candado de la cuenta, `for update`. Vencido: no borra (lo hace la tarea) y devuelve `expired`. |
| `resolve_identity_request(p_request_id uuid, p_admin uuid, p_outcome text, p_reason text, p_window_days int)` | `decision` (`approved`, `rejected`, `gone`, `expired`, `not_admin`, `own_request`), `user_id`, `sent_at`, `origin`, `resolved_on date`, `rejections_in_window int` | `not_admin` si `p_admin` no está en `admins`. `for update` del pedido: sin fila → `gone`; dueño = admin → `own_request`; vencido → `expired`. `p_outcome = 'reject'` exige `p_reason` válido (`check` + `raise`). Borra el pedido, inserta verificación o rechazo, inserta resolución. El candado es el de la cuenta dueña, el mismo del retiro. |
| `expire_identity_requests()` | `expired_count int` | Borra pedidos con `expires_at <= now()` e inserta/actualiza `identity_expirations` (`notice_pending = true`); borra rechazos y vencimientos de más de 30 días; pone `notice_pending = false` en los de más de 24 horas. |
| `identity_expiry_mail_tick()` | `void` | Si hay `notice_pending` y existen los secretos `app_url` y `cron_secret` en Vault, `net.http_post` a `app_url || '/api/cron/identidad'` con el secreto en un encabezado. |

## Tareas programadas

```
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('identity-expire', '*/5 * * * *', 'select public.expire_identity_requests()');
select cron.schedule('identity-expiry-mail', '*/5 * * * *', 'select public.identity_expiry_mail_tick()');
```

## Transiciones del pedido

```
(nada) ──submit──▶ en revisión ──approve──▶ identity_verifications (+ resolución)
                        │        ──reject───▶ identity_rejections 30 d (+ resolución)
                        │        ──withdraw─▶ (nada)
                        │        ──7 días───▶ identity_expirations 30 d (o hasta el próximo submit)
                        └── borrar cuenta ─▶ (nada)
```
