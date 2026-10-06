# Research — Solicitar la adopción de un animal con el cuestionario

Decisiones técnicas de la historia #63. Cada una: decisión, por qué, qué se descartó.

## R1. Las solicitudes viven en una tabla cerrada y se escriben solo con funciones de la base

**Decisión**: `public.applications` con RLS que deja leer a quien solicitó (`applicant_id =
auth.uid()`) y nada más; ninguna política de insert, update ni delete. Enviar y retirar son
funciones `security definer` (`submit_application`, `withdraw_application`) que reciben el id de
quien solicita como parámetro, que la acción saca de la sesión en el servidor, y se llaman con
permisos de servicio: el mismo patrón que `create_report` y `block_person` de #13.

**Por qué**: las reglas que importan (3 activas, una por animal, nivel exigido, animal que recibe
solicitudes, bloqueo, suspensión) se controlan juntas, con candado, en una transacción; desde el
cliente no hay forma de saltearlas. La lectura por RLS deja que Mis solicitudes use la sesión de la
persona y que el test de privacidad intente leer como otra.

**Descartado**: insertar con RLS (`with check`): no puede contar las activas con candado ni mirar
bloqueos de la otra persona sin abrirle esas tablas.

## R2. El límite y la unicidad se garantizan en la base, no en la pantalla

**Decisión**: índice único parcial `(applicant_id, pet_id) where status = 'sent'`; el conteo de
activas se hace con `public.lock_phone_account(applicant)` (el candado por cuenta que ya usan
publicar y verificar) tomado al principio de `submit_application`. La idempotencia es por
`(applicant_id, attempt_id)` único: el intento lo genera el cuestionario al abrirse (como
`publish_pet`), viaja con el borrador y un reintento con el mismo intento devuelve la solicitud ya
creada (`already`), no una segunda.

**Por qué**: SC-003 (doble toque, reintento, dos pestañas). Con el candado por cuenta, dos envíos
simultáneos se ordenan; el índice parcial es la red por si alguna vez se escribe por otro camino.

**Descartado**: un contador en el perfil (otra cosa que mantener al día en cada cierre); validar
solo en la acción (dos pestañas pasan juntas).

## R3. Los cierres los hacen triggers sobre lo que los provoca, y quedan escritos

**Decisión**: una solicitud cerrada guarda `status = 'closed'`, `close_reason` y `changed_at`, y no
vuelve atrás. Los cierres los escribe la base en el mismo momento que su causa:

- `pets` `after update of status, taken_down_at`: a `adopted` → `adopted`; `taken_down_at` que
  pasa a no nulo → `unpublished`.
- `pets` `before delete` (también el borrado en cascada de la cuenta del publicador) →
  `unpublished`; la FK `pet_id` es `on delete set null`.
- `blocks` `after insert`: las de la bloqueada a animales de quien bloquea → `not_receiving`; las de
  quien bloquea a animales de la bloqueada → `you_blocked`.
- `account_suspensions` `after insert`: las de la suspendida → `suspended`; las dirigidas a sus
  animales → `unpublished`.

Cada cierre copia en `pet_name` el nombre del animal en ese momento.

Pausar, vencer y que el publicador pierda el nivel 1 **no** escriben nada: la nota «no está
disponible por ahora» se deriva al leer (R6), así que vuelve sola cuando el animal vuelve a la
vista.

**Por qué**: FR-061, FR-062, FR-064 dicen que volver a publicar, desbloquear o reactivar no
reabren; eso exige guardar el cierre, no derivarlo. Con triggers, ningún camino que adopta, borra,
da de baja, bloquea o suspende se puede olvidar de cerrar (hoy son `change_pet_status`,
`delete_pet`, `resolve_pet_review`, `block_person`, `suspend_account` y el borrado de cuenta).

**Descartado**: llamar a una función de cierre desde cada una de esas funciones (seis lugares que
copiar y uno nuevo mañana que se olvida); derivar el cierre al leer (se reabriría solo).

## R4. Las respuestas se guardan como un objeto por id estable de pregunta, validado dos veces

**Decisión**: `answers jsonb` con forma `{ "<question_id>": "<valor>" }`. Los ids y las opciones
viven en `lib/applications/questionnaire.ts` (una sola lista, con el orden de FR-020, el tipo de cada
pregunta y de qué depende). La valida `lib/schemas/application.ts` (zod, compartido por el cliente y
la acción) y la vuelve a validar la base con `private.application_answers_valid(answers,
pet_is_neutered)`: claves exactas (las dos condicionales solo cuando corresponden), opciones
conocidas, textos de 1 a 500 caracteres sin espacios solos. La detección de contacto (`contactMatch`
de #53) corre en el schema, no en la base.

Ids: `housing_type`, `housing_tenure`, `rental_allows_pets`, `outdoor_space`, `household`,
`other_pets`, `hours_alone`, `moving_plan`, `experience`, `neuter_commitment`, `vet_budget`,
`why_this_pet`. Opciones como claves en inglés (`house`, `apartment`, `other`; `owned`, `rented`,
`other`; `yes`, `no`, `unsure`; `yard`, `netted_balcony`, `open_balcony`, `none`; `under_4`,
`4_to_8`, `over_8`; `yes`, `no`; `yes`, `tight`, `no`). Los textos en
`messages/es.json` bajo `applications.questions.<id>` (docs/06 §Cuestionario).

**Por qué**: docs/06 §Cuestionario: cambiar el texto de una pregunta no rompe lo enviado. Doble
validación porque la base es la última puerta (constitución §IV) y el schema da los errores por
campo.

**Descartado**: una tabla de respuestas por fila (doce inserts por envío, nada que ganar); detectar
contacto también en SQL (dos copias de una regla que se corrige seguido).

## R5. La pantalla del cuestionario decide con una función pura qué mostrar

**Decisión**: una sola lectura, `apply_context(p_applicant, p_code, p_pending_ttl)`, trae lo que
hace falta para los controles de FR-003: si el animal recibe solicitudes para esa persona (y por
qué no: no existe, no está a la vista, adoptado, bloqueada por el publicador, bloqueó al
publicador), si es suya, su solicitud activa por ese animal, sus activas (con nombre, foto y fecha),
nivel 1, nivel 2, el estado de su pedido de identidad, el nivel exigido, el estado del animal
(`in_process`), si está castrado, su nombre y su primera foto, y las respuestas de su última
solicitud. `lib/applications/apply-gate.ts` (pura, con test) recibe eso y devuelve una de: `suspended`
(lo resuelve antes `getSessionUser`), `own` (su propio animal, en cualquier estado), `not_receiving`, `blocked_publisher`, `has_active`,
`limit`, `needs_phone`, `needs_identity`, `form`. La página compone la pantalla de cada rama.

`submit_application` repite los mismos controles en la base, en el mismo orden, y devuelve el
motivo; `lib/applications/submit-outcome.ts` (pura) traduce cada uno a la clave de error y a si se
muestra en el cuestionario o lleva a otra pantalla (FR-014, FR-030).

**Por qué**: el orden de FR-003 es una regla de negocio que, mal, hace verificar a alguien por nada
o le cuenta un bloqueo; como función pura se prueba con todas las combinaciones.

## R6. Mis solicitudes deriva el estado que se ve, sin guardar la nota

**Decisión**: `my_applications()` (con la sesión, `security invoker` sobre la tabla con RLS más una
función `security definer` angosta para el animal) devuelve cada solicitud con `status`,
`close_reason`, `sent_at`, `changed_at`, el código, el nombre (vivo si existe y se puede ver, si no
`pet_name`), la primera foto solo cuando corresponde (FR-065) y `pet_on_view` (si hoy está a la
vista). `lib/applications/application-view.ts` (pura, con test) arma la etiqueta: enviada, enviada
con «no está disponible por ahora», retirada, cerrada con motivo; y si lleva foto y enlace.

**Por qué**: la nota de FR-060 aparece y desaparece con el animal; guardarla obligaría a otro trigger
por cada cambio de visibilidad.

## R7. El borrador es por animal, atado a la cuenta y al intento

**Decisión**: `localStorage` con clave `application-draft:<code>`, con la forma de `PetDraft`:
`{ v, accountId, attemptId, startedAt, updatedAt, answers }`. `useApplicationDraft` lo lee después de
montar, lo escribe con cada cambio (con el mismo retardo corto que el de mascotas) y lo borra al
enviar bien. `clearAccountDrafts` borra además toda clave que empiece con `application-draft:`
(cerrar sesión, borrar la cuenta). Si el borrador es de otra cuenta, o pasó `DRAFT_TTL_DAYS`, se
descarta. Si el intento del borrador ya envió (respuesta perdida y recarga), `checkApplicationAttempt`
lo dice y la pantalla lleva a Mi solicitud, como hace `checkPetAttempt`.

**Por qué**: FR-040–FR-042 y el caso de borradores de varios animales.

## R8. «Quiero adoptar» en la ficha: un enlace en el HTML, sin JS nuevo

**Decisión**: la ficha suma una lectura chica, `pet_application_view(p_code)` (`security definer`,
`anon` y `authenticated`), que devuelve el nivel exigido, si el animal recibe solicitudes en general
(disponible o en proceso, a la vista) y, con sesión, el id de la solicitud activa de quien mira por
ese animal. `ApplyAction` (componente de dominio, servidor) dibuja un `LinkButton` `tirita` a
`/solicitar/{code}` (con o sin sesión; la ruta manda a ingresar), o `secondary` «Ver mi
solicitud», o nada; `RequiredLevelLine` dibuja la línea de identidad. Para la bloqueada se dibuja
«Quiero adoptar» igual: `pet_application_view` no mira bloqueos (FR-001).

**Por qué**: la ficha está en la zona pública, con el presupuesto de JS más ajustado (#95); un
enlace no suma nada. No se toca `pet_by_code`, que es grande y lo usan la vista previa y la imagen.

**Descartado**: sumar columnas a `pet_by_code` (cambiar su tipo de retorno obliga a borrarla y
recrearla, y la usan cinco lugares).

## R9. El nivel exigido es una columna de la publicación, leída por `publish_pet` y `save_pet`

**Decisión**: `pets.required_level smallint not null default 1 check (required_level in (1, 2))`;
las publicaciones existentes quedan en 1. `publish_pet` y `save_pet` se redefinen para leer
`p_fields ->> 'required_level'` (por omisión 1). El formulario de #53 suma el campo «Quién puede
solicitar» (`RadioGroup` `column`, dos opciones), en el grupo final antes de guardar. `PetDraft`
acepta el campo como opcional para no descartar borradores viejos.

**Por qué**: FR-010; atómico con el resto de la publicación.

**Descartado**: una función aparte para fijar el nivel después de guardar (si falla, el animal queda
pidiendo menos de lo que eligió el publicador).

## R10. El correo de identidad aprobada lleva al animal desde el que se pidió

**Decisión**: `identity_requests.return_pet_id uuid references pets (id) on delete set null`.
«Verificar mi identidad» en la pantalla de identidad lleva a `/verificar-identidad?pedir=1&animal=
<code>`; la página pasa el código al formulario y `submitIdentityRequest` a `submit_identity_request`
(nuevo parámetro opcional `p_return_code`, que la base resuelve a id; uno que no existe se ignora).
`resolve_identity_request` devuelve además el código del animal cuando sigue existiendo, y
`sendIdentityResult` suma el botón «Ver a <nombre>» a `/solicitar/<code>` cuando lo hay.

**Por qué**: FR-012. Guardarlo en el pedido y no en el perfil: se borra con el pedido y con la
cuenta, y no hace falta escribir nada al mirar una pantalla.

## R11. La medición sigue el patrón de la portada y de #59

**Decisión**: eventos nuevos en `lib/analytics/events.ts`, armados por `lib/analytics/application-events.ts`
(pura, con test, sin ids ni respuestas):

- `apply_tapped` `{ signedIn, level: 0|1|2|3, required: 1|2 }` — al abrir `/solicitar/{code}` (la
  página registra antes de decidir la rama, también sin sesión, antes de mandar a ingresar: el
  enlace de la ficha va siempre a esa ruta).
- `apply_stopped` `{ by: 'phone' | 'identity' | 'limit' | 'not_receiving' }`.
- `application_started` `{ proposed: boolean }` — primera respuesta tocada.
- `application_abandoned` `{ lastQuestion: <id> | 'none' }` — `pagehide` sin enviar, por
  `navigator.sendBeacon` a `POST /api/solicitudes/abandono` (Route Handler que solo valida y
  registra; sin sesión requerida, sin datos de la persona).
- `application_sent` `{ seconds, proposedUsed, after: 'phone' | 'identity' | null }` — `after`
  sale de la marca `?tras=telefono` en el destino de la puerta de #10 y, para identidad, de si su
  pedido aprobado tiene `return_pet_id` igual a este animal.
- `application_withdrawn` `{ days }`.
- `application_closed` `{ reason }`, uno por solicitud cerrada — lo registra la acción que provocó
  el cierre (cambiar el estado, borrar, dar de baja, bloquear, suspender): al terminar su llamada
  pregunta `closed_applications_since(p_since, p_pet, p_user)` (solo servicio; devuelve los motivos
  de las cerradas desde que empezó la acción por ese animal o esa persona, sin ids) y registra un
  evento por cada una. El borrado de cuenta no registra cierres: el evento `account_deleted` ya lo
  cuenta, y no hay a quién preguntar después.

Se registran como el resto del sitio hoy (consola, hasta M5).

**Por qué**: FR-090, FR-091, SC-006. El beacon es la única forma confiable de enterarse de que
alguien se fue; no es una dependencia nueva.

## R12. Rutas en la zona `(app)`

**Decisión**: `/solicitar/[code]` (el cuestionario y sus pantallas de freno), `/solicitar/[code]/enviada`,
`/mis-solicitudes` y `/mis-solicitudes/[id]`. Todas `noindex`, con `loading.tsx` y `error.tsx`.

**Por qué**: piden sesión, llevan formulario y textos de cliente (el `ErrorTextsProvider` de `(app)`);
la ficha pública queda liviana.

## R13. Skills

Los skills `frontend-design:frontend-design`, `supabase:supabase-postgres-best-practices` y
`supabase:supabase` no están instalados en la sesión que escribió este plan: el diseño sale de
docs/10 y de los patrones ya construidos (#13, #59), y la etapa Build carga cada skill antes de
escribir JSX, la migración y los tests de la base.
