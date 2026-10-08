# Data model — El seguimiento y sus fotos

Una migración nueva, forward-only: `supabase/migrations/<timestamp>_follow_ups.sql`. Después,
`pnpm db:types`. Todas las funciones nuevas o recreadas: `set search_path = ''`, nombres
calificados, `revoke all … from public, anon, authenticated` antes del `grant`, como #65 y #67.

## Nueva: `public.follow_ups` (R1)

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `adoption_id` | `uuid` not null **unique** | FK `adoptions(id) on delete cascade` |
| `adopter_id` | `uuid` | FK `auth.users(id) on delete cascade`; null ⇔ `skipped` (así la marca de «no se pide» sobrevive al borrado de la cuenta y no se vuelve a medir) |
| `status` | `text` not null | check in (`requested`, `answered`, `closed`, `skipped`) |
| `skip_reason` | `text` | check in (`account_deleted`, `ended`, `declined`, `blocked`, `suspended`); not null ⇔ `skipped` |
| `resolved_at` | `timestamptz` not null | `now()`: el día del pedido (o en que no se pidió) |
| `answered_at` | `timestamptz` | not null ⇔ `answered` |
| `answer_text` | `text` | `char_length <= 500`; null con texto vacío; solo con `answered` |
| `closed_at` | `timestamptz` | not null ⇔ `closed` |
| `close_reason` | `text` | check in (`ended`, `declined`, `blocked`); not null ⇔ `closed` |
| `seen_at` | `timestamptz` | la primera vez que quien lo dio vio la respuesta (R11) |
| `measured_at` | `timestamptz` | el evento de pedido o de no pedido ya salió (R11) |

Índices: `follow_ups_adopter_idx (adopter_id)` (el historial y la cascada del borrado de cuenta);
`follow_ups_unmeasured_idx (resolved_at) where measured_at is null`. La de `adoption_id` la da el
`unique`. Para `given`: `adoptions_publisher_idx` de #67.

RLS encendida, sin políticas, `revoke all on public.follow_ups from anon, authenticated` (R2).

`follow_ups_forward_only` (`before update`): `adoption_id`, `resolved_at`, `skip_reason` no cambian;
`status` solo pasa `requested → answered` o `requested → closed`; `answered_at`, `answer_text`,
`closed_at`, `close_reason`, `seen_at`, `measured_at` pasan de null a valor y no vuelven (la
respuesta no se edita: FR-013).

## Nueva: `public.follow_up_photos` (R6)

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | lo genera el navegador (reintento idempotente) |
| `follow_up_id` | `uuid` not null | FK `follow_ups(id) on delete cascade` |
| `position` | `smallint` | null en espera; 1 a 3 al responder |
| `width`, `height` | `integer` not null | del tamaño `full` |
| `thumbhash` | `text` not null | |
| `staged_at` | `timestamptz` not null | `now()` |

Índices: `follow_up_photos_follow_up_idx (follow_up_id)`; único `(follow_up_id, position) where
position is not null`. RLS encendida, sin políticas, sin permisos.

## Nueva: `public.follow_up_photo_purges` (R7)

`follow_up_id uuid not null`, `photo_id uuid not null`, `queued_at timestamptz not null default
now()`, PK `(follow_up_id, photo_id)`. La llena `follow_up_photos_queue_purge` (`after delete on
follow_up_photos`). Sin políticas, sin permisos; solo `service_role` por funciones.

## Storage

Bucket privado `follow-up-photos`, sin políticas: sube y firma solo el servicio, después de que una
función dijo que corresponde. Objetos `<follow_up_id>/<photo_id>/{thumb,card,full}.webp`.

## Cambia: `public.adoptions` (R4)

- Columna `blocked_at timestamptz`. `adoptions_forward_only` la suma a las fechas que no vuelven.
- Disparador nuevo `adoptions_mark_blocked` (`after insert on public.blocks`): `blocked_at = now()`
  en las adopciones `kind = 'site'` entre `blocker_id` y `blocked_id` en las dos direcciones, con
  `blocked_at is null`, terminadas o no.
- Disparador nuevo `adoptions_close_follow_up` (`after update of ended_at, declined_at, blocked_at`)
  (R5).
- La migración rellena `blocked_at` donde hoy hay un bloqueo entre las dos personas.

## Cambia: `public.application_notices`

`application_notices_kind_valid` suma `follow_up_requested` (a quien adoptó) y
`follow_up_answered` (a quien lo dio). `claim_application_notices` no cambia.

## Funciones nuevas — lectura (`security definer`, `auth.uid()` adentro)

- `follow_up_of(p_application uuid)` → `grant authenticated`. Cero filas si quien mira no es quien
  lo dio ni quien adoptó esa adopción, si su cuenta está suspendida, o si el seguimiento es
  `skipped` o no existe. Una fila: `side ('publisher' | 'adopter')`, `status`, `requested_at`
  (= `resolved_at`), `answered_at`, `answer_text`, `photos jsonb` (`[{id, width, height,
  thumbhash}]` en orden), `can_answer boolean` (adopter, `requested`, cuenta no suspendida),
  `hidden boolean`. Con `side = 'publisher'` y `adoptions.blocked_at` no nulo: `answer_text` null,
  `photos` `[]`, `answered_at` null y `hidden` true (FR-034). La adopción es la más reciente de
  esa solicitud (como `adoption_of`).
- `my_pet_follow_ups()` → `grant authenticated`. Para cada animal propio, el seguimiento no
  `skipped` de su adopción `site` más reciente: `pet_id, application_id, status, requested_at,
  answered_at, adoption_current boolean`. Nada del contenido.
- `my_open_follow_ups()` → `grant authenticated`. `application_id` de cada seguimiento `requested`
  de quien mira (Mis solicitudes, «Contá cómo va»).
- `follow_up_history(p_public_id text)` → `grant anon, authenticated` (R9): `given integer,
  adopted integer`; `0, 0` para una cuenta suspendida o inexistente.
- `pet_follow_up_history(p_code text)` → `grant anon, authenticated` (Build, US3): lo mismo para quien
  publicó ese animal, para la ficha. Las dos leen `private.follow_up_counts(p_user uuid)`.
- ~~`follow_up_photo_paths`~~: no hace falta. `follow_up_of` ya devuelve el `follow_up_id` y las
  fotos con `position`, y `signFollowUpPhotos` firma exactamente esas con el servicio (Build, US1).

## Funciones nuevas — escritura (`security definer`, `grant` solo a `service_role`)

- `stage_follow_up_photo(p_adopter uuid, p_application uuid, p_photo uuid, p_width integer,
  p_height integer, p_thumbhash text)` → `outcome text, follow_up_id uuid`: `staged` (también si la
  foto ya estaba: reintento), `not_found`, `closed` (no `requested`: incluye `answered`),
  `suspended`, `limit` (9 en espera).
- `answer_follow_up(p_adopter uuid, p_application uuid, p_photos uuid[], p_text text)` →
  `outcome text, requested_at timestamptz, photo_count integer, has_text boolean` (R6): `answered`,
  `already`, `closed`, `not_found`, `suspended`, `invalid` (0 o más de 3 fotos, alguna que no está en
  espera de ese seguimiento, o texto de más de 500).
- `mark_follow_up_seen(p_publisher uuid, p_application uuid)` → `first boolean, answered_at
  timestamptz` (R11). Solo con `answered`, sin `blocked_at`.
- `claim_follow_up_events(p_limit integer)` → `status text, skip_reason text`: marca
  `measured_at` y devuelve lo que se midió (R11).
- `claim_follow_up_photo_purges(p_limit integer)` → `follow_up_id uuid, photo_id uuid`, y
  `forget_follow_up_photo_purges(p_items jsonb)` borra de la cola lo que ya se borró en Storage.
- `follow_up_answered_for_email(p_application uuid, p_recipient uuid)` → para el correo de R8:
  `adopter_name` (de hoy), `pet_name`, `pet_sex`, `follow_up_id`, `first_photo_id`; cero filas si
  quien recibe no es quien lo dio o hay `blocked_at`.

## Funciones privadas

- `private.request_due_follow_ups()` (R3) y `private.purge_stale_follow_up_photos()` (borra las filas en
  espera, `position is null`, con `staged_at` de más de 24 h; la cola de purga se lleva los
  objetos). Programadas
  juntas: `cron.schedule('follow-ups', '10 * * * *', …)`.

## Recreadas

- `adoption_of(p_application)`: suma `follow_up_answered boolean`.
- `decline_adoption(...)`: devuelve `answered` sin cambiar nada si el seguimiento está `answered`
  (FR-017).
- `pet_lifecycle_tick()`: suma `or exists (follow_ups where measured_at is null)` y `or exists
  (follow_up_photo_purges)` a las condiciones para llamar a la ruta.

## Borrado de cuenta

- Quien adoptó: `follow_ups.adopter_id` en cascada borra el seguimiento → sus fotos → la cola de
  purga. `deleteAccount` vacía la cola después de `deleteAccountRecord`.
- Quien lo dio: sus animales caen → `adoptions` → `follow_ups` → fotos → cola. Igual.
- El animal: `deletePet` vacía la cola después de `deletePetRecord`.

## Estados

```
(sin fila) ──día 30, en condiciones──▶ requested ──responde──▶ answered
     │                                     │
     └──día 30, sin condiciones──▶ skipped └──termina / «Yo no adopté» / bloqueo──▶ closed
```
