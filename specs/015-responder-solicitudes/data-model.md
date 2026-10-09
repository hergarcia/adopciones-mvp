# Data model — Responder las solicitudes

Una migración nueva, forward-only: `supabase/migrations/<timestamp>_application_responses.sql`.
Después, `pnpm db:types`. Todo en `public` salvo los helpers en `private`, como #63.

## Cambia: `public.applications`

- `status`: el check pasa a `status in ('sent', 'accepted', 'rejected', 'withdrawn', 'closed')`.
- `applications_one_active_idx` se recrea con `where status in ('sent', 'accepted')`.
- `applications_pet_active_idx` y `applications_publisher_active_idx`: idem.
- Índice nuevo `applications_publisher_idx (publisher_id, pet_id, sent_at)` para la bandeja.
- Índice nuevo `applications_rejected_idx (applicant_id, pet_id) where status = 'rejected'` (R7).
- `applications_forward_only`: final = `rejected`, `withdrawn`, `closed`. Transiciones válidas:
  `sent → accepted | rejected | withdrawn | closed`, `accepted → rejected | withdrawn | closed`. Se
  mantiene la excepción del bloqueo mutuo de #63.
- La política `applications_select_own` no cambia. Ninguna columna nueva en esta tabla (R2).

## Nueva: `public.application_reviews`

| Columna | Tipo | Regla |
|---|---|---|
| `application_id` | `uuid` PK | FK `applications(id) on delete cascade` |
| `opened_at` | `timestamptz` | null hasta que el publicador la abre (R6) |
| `first_response_at` | `timestamptz` | la primera de aceptar, rechazar o preguntar (R11) |
| `accepted_at` | `timestamptz` | al aceptar; queda al dejar sin efecto y al cerrarse por adopción |
| `rejected_at` | `timestamptz` | al rechazar o dejar sin efecto |
| `rejection_reason` | `text` | check en la lista de `REJECTION_REASONS` + `not_concluded` |
| `rejection_note` | `text` | solo con `other`, 1–200 caracteres sin solo espacios |

Checks: `(rejected_at is null) = (rejection_reason is null)`;
`(rejection_reason = 'other') = (rejection_note is not null)`;
`rejection_reason <> 'not_concluded' or accepted_at is not null`.
RLS encendida, sin políticas, `revoke all` de `anon` y `authenticated` (R2).

Motivos (claves en inglés, docs/06): `chose_other`, `housing`, `alone_too_long`,
`no_neuter_commitment`, `household_fit`, `no_answer`, `other`, y `not_concluded` solo para dejar sin
efecto. La lista vive en `lib/applications/rejection.ts`; la base recibe la lista por paridad, con un
test que compara las dos, como el cuestionario de #63.

## Nueva: `public.application_questions`

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | |
| `application_id` | `uuid` | FK `applications(id) on delete cascade` |
| `position` | `smallint` | 1–3; único con `application_id` |
| `attempt_id` | `uuid` | único con `application_id` (doble toque, R5) |
| `question` | `text` | 1–500, sin solo espacios |
| `asked_at` | `timestamptz` | |
| `answer` | `text` | null hasta contestar; 1–500 |
| `answered_at` | `timestamptz` | `(answer is null) = (answered_at is null)` |

Índice único parcial `application_questions_one_pending (application_id) where answer is null`.
RLS encendida, sin políticas, sin `grant`: se lee con las funciones de abajo, que la muestran solo a
las dos personas (FR-033).

## Nueva: `public.application_notices` (R3)

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | |
| `kind` | `text` | check en `new_application`, `question_answered`, `accepted`, `rejected`, `question_asked`, `closed_adopted`, `closed_unpublished` |
| `application_id` | `uuid` | FK `applications(id) on delete cascade` |
| `recipient_id` | `uuid` | FK `auth.users(id) on delete cascade` |
| `created_at` | `timestamptz` | |

Sin políticas, sin `grant`; la vacía `claim_application_notices` con `service_role`.

## Nueva: `public.inbox_visits` (R6)

`(publisher_id uuid FK auth.users on delete cascade, pet_id uuid FK pets on delete cascade,
seen_at timestamptz, primary key (publisher_id, pet_id))`. Sin políticas, sin `grant`.

## Funciones nuevas (lectura, `security definer`, `auth.uid()` adentro, `grant` a `authenticated`)

- `publisher_inbox()` → por animal propio no borrado ni dado de baja con al menos una solicitud:
  `pet_id, name, sex, cover…, waiting int, new int, last_sent_at`. Sin datos de nadie.
- `publisher_new_counts()` → `pet_id, new int` para Mis animales (FR-006).
- `pet_applications(p_pet uuid)` → cero filas si el animal no es de quien mira. Por solicitud:
  `id, status, close_reason, sent_at, changed_at, is_new, waiting_question boolean,
  applicant_id, display_name, avatar…, level smallint` (los distintivos de #12 se leen con su
  función de siempre), y tres respuestas clave (`housing`, `outdoor`, `hours_alone`). Sin contacto.
- `publisher_application(p_id uuid)` → una, si `publisher_id = auth.uid()`: estado, fechas, el
  animal (nombre guardado si se borró), quien solicitó (nombre, foto, zona, nivel, id para el
  perfil), `answers`, `accepted_at`, `rejection_reason`, `rejection_note`, `opened_at`,
  `applicant_has_phone boolean`. Para un animal borrado o dado de baja, las columnas de quien
  solicitó y `answers` vuelven nulas (FR-043). `close_reason` no sale: sale `publisher_close`, uno
  de `adopted`, `unpublished`, `you_blocked` (cerrada por un bloqueo y el publicador bloquea hoy a
  quien solicitó, también en un bloqueo mutuo) o `gone` (retirada, el bloqueo de quien solicitó o
  una suspensión, sin distinguir: FR-042).
- `application_questions_of(p_id uuid)` → las preguntas en orden, si quien mira es una de las dos
  personas.
- `application_contact(p_id uuid)` → `name, phone` de la otra persona según R4; cero filas si no
  corresponde.
- `my_applications()` y `my_application(p_id)` (de #63) se recrean: suman `accepted_at` solo como
  booleano `was_accepted`, `waiting_question boolean` y `publisher_id` no (nunca sale).

## Funciones nuevas (escritura, `security definer`, `grant` solo a `service_role`)

`open_application(p_publisher, p_id)` → `opened_first boolean, sent_at`;
`visit_inbox(p_publisher, p_pet uuid default null)`;
`accept_application`, `reject_application`, `revoke_acceptance`, `ask_question`,
`answer_question` (R5); `claim_application_notices(p_limit int)` → `id, kind, application_id,
recipient_id, pet_name, pet_id` (y las borra).

## Cambian

- `submit_application`: control `rejected` (R7); la activa y el límite cuentan `accepted`; encola
  `new_application` según R6.
- `apply_context`, `pet_application_view` (suma `my_rejected`).
- `withdraw_application`: retira también una `accepted`; no encola nada.
- `applications_close_on_pet_change`: cierra `sent` y `accepted`; encola `closed_adopted` o
  `closed_unpublished` (baja) para cada una que cerró.
- `applications_close_on_pet_delete`: idem con `closed_unpublished`.
- `applications_close_on_block` y `applications_close_on_suspension`: cierran también `accepted`;
  **no** encolan (FR-062).
- `closed_applications_since`: sin cambios de contrato.

## Borrado de cuenta

Quien solicitó: `applications` cae en cascada y con ella `application_reviews`,
`application_questions` y `application_notices` (FR-082). Quien publicó: sus animales se borran,
el trigger cierra y encola `closed_unpublished`; `publisher_id` queda nulo y su `inbox_visits` cae.
