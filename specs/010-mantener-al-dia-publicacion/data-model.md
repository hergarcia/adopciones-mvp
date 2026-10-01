# Data Model: Mantener al día cada publicación

Una migración forward-only: `supabase/migrations/<ts>_pet_lifecycle.sql`. Después,
`pnpm exec supabase db reset` y `pnpm db:types`.

## Cambios en tablas

### `public.pets` (cambia)

| Columna | Tipo | Regla |
|---|---|---|
| `status` | `text` | El check se ensancha a `('available','in_process','paused','adopted')`. |
| `status_changed_at` | `timestamptz not null default now()` | Cada cambio de estado, renovar, reanudar, volver a publicar o baja. |
| `expires_at` | `timestamptz default now() + 30 días` | Constraint `pets_expiry_matches_status`: no nulo si y solo si `status in ('available','in_process')`. El valor por defecto hace el backfill y da el mismo plazo a una fila escrita sin `publish_pet`. |
| `reminder_sent_at` | `timestamptz` | El recordatorio del vencimiento actual; `null` al renovar, reanudar o volver a publicar. |
| `expiry_counted_at` | `timestamptz` | El evento `pet_expired` de este vencimiento ya se midió; mismas vueltas a `null`. |
| `taken_down_at` | `timestamptz` | Dada de baja. Nunca vuelve a `null` desde el sitio. |
| `takedown_reason` | `text` | `('photos_not_the_animal','sale_or_money','not_dog_or_cat','contact_or_address','other')`; constraint: no nulo si y solo si `taken_down_at` no es nulo. |
| `takedown_note` | `text` | 1–300 caracteres (`btrim`), no nulo si y solo si `takedown_reason = 'other'`. |

Índices: `pets_listing_idx` se recrea `on (published_at desc, code desc) where status in
('available','in_process') and taken_down_at is null`; `pets_reminder_due_idx on (expires_at) where
reminder_sent_at is null and taken_down_at is null`; `pets_expiry_count_idx on (expires_at) where
expiry_counted_at is null and taken_down_at is null`.

Las policies de `pets` no cambian: la dueña lee las suyas (`pets_select_own`), y con eso ve
`takedown_reason` y `takedown_note`. Nadie escribe desde el cliente.

### `public.pet_reviews` (nueva)

| Columna | Tipo | Regla |
|---|---|---|
| `pet_id` | `uuid primary key references pets(id) on delete cascade` | Una por publicación; se borra con ella (FR-030). |
| `pending_kind` | `text` | `('new','edited')` o `null`. |
| `pending_since` | `timestamptz` | Constraint: nulo si y solo si `pending_kind` es nulo. |
| `resolved_at` | `timestamptz` | La última resolución. |
| `resolved_by` | `uuid references auth.users(id) on delete set null` | Solo lo ven quienes administran. |
| `outcome` | `text` | `('reviewed','taken_down')` o `null`. |

Índice `pet_reviews_pending_idx on (pending_since) where pending_since is not null`.
RLS: `pet_reviews_select_admin` `for select to authenticated using ((select private.is_admin()))`.
`revoke all` a `anon` y `authenticated`, `grant select` a `authenticated`.

Disparador `pets_review_on_insert` (`after insert on pets`): inserta `(pet_id, 'new', now())`.

### `public.pet_renewal_links` (nueva)

| Columna | Tipo | Regla |
|---|---|---|
| `token_hash` | `text primary key` | SHA-256 en hex del token (64 caracteres, check de formato). |
| `pet_id` | `uuid not null references pets(id) on delete cascade` | El enlace muere con el animal (FR-019). |
| `created_at` | `timestamptz not null default now()` | |
| `expires_at` | `timestamptz not null` | `created_at + 30 días`. |

RLS encendida, sin policies, `revoke all` a `anon` y `authenticated`. Una tarea diaria
(`pg_cron`, `pet-renewal-links-purge`) borra los vencidos hace más de un día.

## Funciones

Todas `set search_path = ''`. Las de escritura, `security definer` y solo `service_role`; las
públicas de lectura, `security definer` con `grant execute` explícito.

| Función | Para qué |
|---|---|
| `private.pet_lifetime()` · `private.pet_reminder_lead()` | 30 y 7 días; paridad con `lib/pets/rules.ts` (R3). |
| `private.pet_state(status, expires_at, taken_down_at)` | El estado derivado (R1), `stable` (usa `now()`). |
| `private.pet_is_shown(pets)` | A la vista o adoptada: estado en `available` `in_process` `adopted` y publicador con nivel 1. |
| `private.publisher_level(owner)` | La escalera 1–3 que hoy está dentro de `pet_by_code` (R9). |
| `public.change_pet_status(p_owner, p_pet, p_action, p_pending_ttl)` → `outcome`, `code`, `name`, `sex`, `from_state`, `state`, `expires_at`, `published_at` | R2. El nombre y el sexo, para el aviso corto que arma la acción. Acciones: `mark_in_process` `mark_available` `pause` `resume` `mark_adopted` `renew` `republish`. |
| `public.delete_pet(p_owner, p_pet)` → `outcome`, `photo_ids uuid[]` | Borra la fila (cascada: fotos, revisión, enlaces). La acción borra antes los objetos de Storage (contracts). |
| `public.pet_photo_ids(p_owner, p_pet)` → `uuid[]` | Las fotos a borrar de Storage antes de `delete_pet`. |
| `public.claim_pet_reminders(p_limit)` | R4.1: marca y devuelve `pet_id`, `owner_id`, `name`, `sex`, `expires_at`. La portada del correo no viaja acá: la ruta de la foto la lee por el token con `renewal_link_view`. |
| `public.create_pet_renewal_link(p_pet, p_token_hash)` | R5. Vence a `now() + private.pet_renewal_link_lifetime()` (30 días, paridad con `RENEWAL_LINK_DAYS`). |
| `public.claim_pet_expiries(p_limit)` | R4.3: marca y devuelve `status`, `published_at`. |
| `public.pet_lifecycle_tick()` | R4: si hay trabajo, `net.http_post` a `/api/cron/publicaciones` con `app_url` y `cron_secret` de Vault. `pg_cron` cada 5 minutos. |
| `public.renew_by_link(p_token_hash, p_pending_ttl)` → `outcome`, `pet_name`, `sex`, `expires_at` | R5. |
| `public.renewal_link_view(p_token_hash)` | Lo que muestra la pantalla de resultado: nombre, sexo, estado derivado, `expires_at`; nada si el enlace no sirve. Y la carpeta de la portada para la foto del correo. |
| `public.pet_review_queue(p_limit)` | R8. Solo con `is_admin()`; si no, ninguna fila. Con `total` y `others` (las que no son de quien mira); `publisher_level` nulo si quien publica no tiene nivel 1. |
| `public.count_pet_reviews()` | Las pendientes que no son propias, para Mi perfil. |
| `public.resolve_pet_review(p_admin, p_pet, p_known_since, p_outcome, p_reason, p_note)` → `decision`, `owner_id`, `pet_name`, `pet_id`, `kind`, `pending_since` | R8. Una baja: `taken_down_at = now()`, motivo. Los enlaces de renovación quedan: `renew_by_link` dice que fue dada de baja (US3-AS5). |
| `public.listed_pets(...)` | Cambia: R9; suma `status`. |
| `public.pet_by_code(p_code)` | Cambia: R9; suma `state`, `sex` ya está, `takedown_reason`, `takedown_note` (solo dueña). |
| `public.pet_share_card(p_code)` | Cambia: R9; suma `status`. |
| `private.pet_photo_object_listed` · `private.avatar_object_listed` | Cambian: «a la vista o adoptada». |
| `private.pet_photo_object_in_review(name)` · `private.avatar_object_in_review(name)` | Nuevas, para las policies de quien administra (R8): las fotos de una publicación que espera y la foto de su publicador. |

`publish_pet` (cambia): inserta `expires_at = now() + pet_lifetime()`. `save_pet` (cambia):
rechaza una dada de baja con `taken_down`, y si la revisión está resuelta la vuelve a pendiente
`edited` con `pending_since = now()`.

## Transiciones (la tabla de `change_pet_status`)

| Estado derivado | `mark_in_process` | `mark_available` | `pause` | `resume` | `mark_adopted` | `renew` | `republish` |
|---|---|---|---|---|---|---|---|
| `available` | → in_process | already | → paused | changed | → adopted | +30 d | changed |
| `in_process` | already | → available | → paused | changed | → adopted | +30 d | changed |
| `paused` | changed | changed | already | → available +30 d ¹ | → adopted | changed | changed |
| `adopted` | changed | changed | changed | changed | already | changed | → available +30 d, publicada hoy ¹ |
| `expired` | changed | changed | changed | changed | → adopted | changed | → available +30 d, publicada hoy ¹ |
| `taken_down` | taken_down | taken_down | taken_down | taken_down | taken_down | taken_down | taken_down |

¹ y `renew`: exigen nivel 1 (`needs_verification` si no). `delete_pet` vale en todos.
`already` no cambia nada y la pantalla muestra el estado. `actionsFor(state)` en TypeScript
devuelve exactamente las celdas con «→» o «+30 d»; el test de paridad lo comprueba.

## Reglas en TypeScript (única fuente)

`lib/pets/rules.ts`: `PET_LIFETIME_DAYS = 30`, `PET_REMINDER_DAYS = 7`,
`RENEWAL_LINK_DAYS = 30`, `TAKEDOWN_NOTE_MAX = 300`, `PET_REVIEW_PAGE = 20`.

## Tipos de dominio (`lib/pets/types.ts`)

- `PetState = 'available' | 'in_process' | 'paused' | 'adopted' | 'expired' | 'taken_down'`.
- `PetStatusAction`, `TakedownReason`.
- `PetSummary` suma `state`, `expiresAt: Date | null`, `takedown: { reason, note } | null`.
- `PublicPet` suma `state` (el estado derivado entero: su publicador la ve en cualquier estado y el
  aviso depende de cuál) y `takedown`; `PublicPetResult` suma las variantes
  `{ visibility: 'paused' | 'expired' }` sin datos.
- `ListedCardView` suma `stamp` (`{ state, label }`, ya traducido): `PetCard` no traduce.
- `PetInReview` (en `lib/pets/review-types.ts`, para no chocar con el componente `PetReviewItem`):
  lo que devuelve la cola, con `pendingKind`, `pendingSince` (el texto de la base, que vuelve igual
  al resolver), `isOwn`, `state`; `PetReviewQueue` suma `waiting` (las que no son propias).
