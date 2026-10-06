# Data model — Solicitar la adopción de un animal con el cuestionario

Una migración forward-only: `supabase/migrations/<timestamp>_applications.sql`. Después,
`pnpm db:types`.

## Tablas

### `public.applications` (nueva)

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` pk default `gen_random_uuid()` | |
| `applicant_id` | `uuid not null references auth.users (id) on delete cascade` | Borrar la cuenta de quien solicitó borra sus solicitudes (FR-082). |
| `pet_id` | `uuid references public.pets (id) on delete set null` | Nulo cuando el animal se borró; la solicitud queda cerrada (FR-082). |
| `publisher_id` | `uuid references auth.users (id) on delete set null` | El dueño del animal al enviar; lo usan los triggers de bloqueo y suspensión y la bandeja de la historia siguiente. |
| `attempt_id` | `uuid not null` | Idempotencia del envío (R2). |
| `answers` | `jsonb not null` | `check (private.application_answers_shape(answers))`: objeto con claves conocidas y valores texto (la validación completa, con la castración del animal, la hace `submit_application`, R4). |
| `pet_name` | `text not null` | El nombre al enviar; se actualiza al cerrarse (R3). |
| `status` | `text not null default 'sent'` | `check (status in ('sent', 'withdrawn', 'closed'))`. |
| `close_reason` | `text` | `check ((status = 'closed') = (close_reason is not null))` y `close_reason in ('adopted', 'unpublished', 'not_receiving', 'you_blocked', 'suspended')`. |
| `sent_at` | `timestamptz not null default now()` | |
| `changed_at` | `timestamptz not null default now()` | Cuándo cambió de estado por última vez. |

Restricciones e índices:

- `unique (applicant_id, attempt_id)`.
- `create unique index applications_one_active_idx on public.applications (applicant_id, pet_id) where status = 'sent'`.
- `create index applications_applicant_idx on public.applications (applicant_id, sent_at desc)` (Mis solicitudes, última solicitud).
- `create index applications_pet_active_idx on public.applications (pet_id) where status = 'sent'` (cierres por animal).
- `create index applications_publisher_active_idx on public.applications (publisher_id) where status = 'sent'` (cierres por bloqueo y suspensión; FK con índice).
- Transiciones: `sent → withdrawn`, `sent → closed`; nunca de vuelta (trigger `before update` que lo rechaza).

RLS: `enable row level security`; `applications_select_own` `for select to authenticated using
(applicant_id = (select auth.uid()))`. Sin políticas de escritura. Sin acceso para quien administra
(FR-081). `anon` sin nada.

### `public.pets` (cambia)

- `required_level smallint not null default 1`, `check (required_level in (1, 2))`. Las filas
  existentes toman 1 (FR-010).

### `public.identity_requests` (cambia)

- `return_pet_id uuid references public.pets (id) on delete set null` (R10), con índice.

## Funciones

Todas `security definer`, `set search_path = ''`, con `revoke all … from public, anon,
authenticated` y el `grant` que se indica.

| Función | Para quién | Qué hace |
|---|---|---|
| `private.application_answers_shape(jsonb)` | interna | Forma mínima para el `check` de la tabla. |
| `private.application_answers_valid(jsonb, boolean)` | interna | Validación completa (R4): claves exactas según vivienda alquilada y animal sin castrar, opciones conocidas, textos 1–500 sin solo espacios. |
| `private.pet_receives_applications(public.pets)` | interna | Devuelve texto y no booleano (cambió en Build: la pantalla y el envío distinguen los dos frenos): `yes`; `unavailable` (pausada, vencida, publicador sin nivel 1, vuelve sola); `closed` (adoptada, dada de baja, publicador suspendido). |
| `private.application_questions()`, `private.max_active_applications()`, `private.answer_max_length()` | interna | El cuestionario y los dos números, una sola vez en SQL, con el test de paridad contra `lib/applications/` (sumado en Build). |
| `private.application_pet(p_pet uuid, p_viewer uuid)` | interna | Lo que una solicitud muestra del animal (FR-065): nombre, foto, código y publicador mientras siga publicado y no sea de alguien que quien mira bloqueó; `on_view`. Lo comparten `my_applications`, `my_application` y `apply_context` (sumado en Build). |
| `public.pet_application_view(p_code text)` | `anon`, `authenticated` | `required_level`, `receives` (general, sin bloqueos) y, con sesión, `my_active_id` (R8). |
| `public.apply_context(p_applicant uuid, p_code text, p_pending_ttl interval)` | `service_role` | Todo lo que necesita `applyGate` (R5), incluidas las respuestas de la última solicitud y sus activas con nombre, primera foto y fecha. |
| `public.submit_application(p_applicant uuid, p_attempt uuid, p_code text, p_answers jsonb, p_pending_ttl interval)` | `service_role` | Candado por cuenta; si el intento ya existe → `already` con su id. Controles en el orden de FR-003 (la suspensión de quien solicita ya la frenó `getSessionUser`): `not_found`; `own`; `you_blocked` (antes que el estado del animal, como en la ficha, que dibuja el bloqueo antes que nada: cambió en Build); el animal recibe solicitudes: `unavailable` (pausada, vencida o publicador sin nivel 1) o `not_receiving` (adoptada, dada de baja, publicador suspendido, o bloqueada por el publicador); `has_active` (con su id); `limit`; `needs_phone`; `needs_identity`; `answers_invalid`. Si pasa: inserta con `publisher_id` y `pet_name` → `sent` con id. |
| `public.withdraw_application(p_applicant uuid, p_id uuid)` | `service_role` | `withdrawn` · `already_withdrawn` · `closed` (con motivo) · `not_found` (no existe o no es suya). |
| `public.my_applications()` | `authenticated` | Las de `auth.uid()` con lo de R6: estado, motivo, fechas, código, nombre visible, foto cuando corresponde (FR-065), `pet_on_view`, contador de activas. |
| `public.my_application(p_id uuid)` | `authenticated` | Una, con las respuestas, si es de `auth.uid()`; si no, nada (FR-070). |
| `public.check_application_attempt(p_applicant uuid, p_attempt uuid)` | `service_role` | Si el intento ya envió, su id (R7). |
| `public.closed_applications_since(p_since timestamptz, p_pet uuid, p_user uuid)` | `service_role` | Motivos de las cerradas desde `p_since` por ese animal o esa persona, sin ids (R11). |

Cambian:

- `public.publish_pet`, `public.save_pet`: leen `p_fields ->> 'required_level'` (R9).
- `public.submit_identity_request`: suma `p_return_code text default null` (se borra la firma vieja
  y se crea la nueva).
- `public.resolve_identity_request`: devuelve además `return_code` (el código del animal si sigue
  existiendo).

## Triggers (R3)

| Trigger | Tabla y momento | Efecto |
|---|---|---|
| `applications_close_on_pet_change` | `pets` `after update of status, taken_down_at` | `adopted` → cierra `adopted`; `taken_down_at` nuevo → cierra `unpublished`. |
| `applications_close_on_pet_delete` | `pets` `before delete` | cierra `unpublished`. |
| `applications_close_on_block` | `blocks` `after insert` | cierra `not_receiving` / `you_blocked` según quién bloqueó. |
| `applications_close_on_suspension` | `account_suspensions` `after insert` | las de la suspendida → `suspended`; las a sus animales → `unpublished`. |
| `applications_forward_only` | `applications` `before update` | rechaza volver a `sent` o cambiar un cierre. |

Cada cierre pone `status = 'closed'`, `close_reason`, `changed_at = now()` y `pet_name` = nombre
actual del animal, solo sobre filas `sent`.

## Paridad con TypeScript

- `lib/applications/questionnaire.ts`: ids, opciones, tope 500 → test en `tests/db/` que compara con
  lo que acepta `application_answers_valid`.
- `lib/applications/rules.ts`: `MAX_ACTIVE_APPLICATIONS = 3`, `ANSWER_MAX_LENGTH = 500` → paridad
  con la base.
