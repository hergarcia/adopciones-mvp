# Research — Responder las solicitudes de un animal

Cada decisión técnica de la historia #65, con lo que se descartó. Lo que ya decidió la historia #63
(`specs/014-solicitar-adopcion/research.md`) no se repite: escrituras solo por funciones de la base
con el candado de la cuenta, cierres como triggers sobre su causa, medición sin ids.

## R1 — Los estados nuevos viven en `applications.status`

**Decisión**: `status` pasa de `sent | withdrawn | closed` a `sent | accepted | rejected | withdrawn
| closed`. `sent` sigue siendo «esperando respuesta». **Activa** = `sent` o `accepted`: el índice
único de una activa por animal, el límite de 3, `pet_application_view`, `apply_context`, los cierres
por trigger y `applications_forward_only` pasan a mirar las dos. Una rechazada (también la dejada
sin efecto) es final, como retirada y cerrada.

**Por qué**: el estado de una solicitud es uno solo y lo leen las dos puntas; un segundo campo
«respuesta del publicador» al lado de `status` permite combinaciones imposibles (retirada y
aceptada). La transición `accepted → closed(adopted)` conserva `accepted_at` y es la que deja ver
el contacto (R4).

**Descartado**: una tabla `application_decisions` aparte con el estado — duplicaba la verdad y
cada lectura de #63 tendría que unirla para saber si una solicitud cuenta entre las 3.

## R2 — Lo que solo ve el publicador va en una tabla sin permisos

**Decisión**: `application_reviews` (una fila por solicitud, creada en la primera respuesta o al
abrirla) guarda `opened_at`, `accepted_at`, `rejected_at`, `rejection_reason`, `rejection_note`.
RLS encendida, **sin políticas y sin `grant`** a `anon` ni `authenticated`: se lee solo con
funciones `security definer` que eligen las columnas por quien mira.

**Por qué**: la política de #63 deja a quien solicitó leer su fila entera de `applications`
(`applications_select_own`). Un motivo de rechazo en esa fila sería legible con su sesión desde el
navegador, aunque ninguna pantalla lo muestre (FR-021, SC-003). Fuera de esa fila, no hay camino.
`opened_at` tampoco va a la vista de quien solicitó: sería un «visto» que la historia no pide.

**Descartado**: permisos por columna (`grant select (col…)`) — funcionan, pero se rompen en silencio
con el próximo `alter table … add column` que alguien agregue sin pensar en el `grant`.

## R3 — Los correos salen de una bandeja de salida que escribe la base

**Decisión**: `application_notices (id, kind, application_id, recipient_id, created_at)` la escriben
las funciones de responder y los triggers de cierre, en la misma transacción que el cambio. La acción
que provocó el cambio, al terminar, llama a `drainApplicationNotices()`, que toma las pendientes con
`claim_application_notices(p_limit)` (`delete … returning`, `for update skip locked`) y manda cada una
con `deliverNotice` (nunca lanza). El cron diario de `/api/cron/publicaciones` también vacía lo que
haya quedado (una acción que murió después de guardar).

Tipos: `new_application`, `question_answered` (al publicador); `accepted`, `rejected`,
`question_asked`, `closed_adopted`, `closed_unpublished` (a quien solicitó). El correo se arma al
mandarlo con el nombre del animal de ese momento y el enlace a la solicitud; nunca lleva teléfono,
respuestas, preguntas ni motivo (FR-063).

**Por qué**:
- Los cierres los escribe un trigger (#63, R3), así que solo la base sabe a quién le cerró qué; y el
  borrado de la cuenta del publicador deja `publisher_id` nulo en cascada: preguntar después «qué se
  cerró» ya no encuentra a nadie.
- Retirar, bloquear y suspender no mandan correo (FR-062): sus triggers simplemente no escriben en
  la bandeja. La regla queda en el lugar donde se cierra, con un test por camino.
- Un doble toque escribe una sola fila porque la transición de estado es una sola (FR-064).
- `delete … returning` hace que dos vaciados a la vez no manden el mismo correo dos veces.

**Descartado**: mandar desde la acción con lo que devolvió la función — no cubre los cierres por
trigger ni el borrado de cuenta; un trigger que llame a la red (`pg_net`) — saca el correo del
camino probado de `sendEmail` y de `.artifacts/mail/` en local.

## R4 — El contacto se lee, no se copia

**Decisión**: `application_contact(p_id)` devuelve el nombre de hoy y el teléfono verificado de hoy
de **la otra** persona, solo si quien pregunta es una de las dos y la solicitud está `accepted`, o
`closed` con `close_reason = 'adopted'` y `accepted_at` no nulo. El teléfono sale de `phones` con la
misma regla que el nivel 1 (`identity_level_one`): con un cambio a medias o sin número verificado,
devuelve `phone = null` y la pantalla dice que no tiene un teléfono verificado ahora (FR-013). Nunca
el correo.

**Por qué**: FR-083 y la decisión 2026-09-27 (el teléfono de hoy, sin reconfirmar). Desde #25, un
número recuperado deja la fila vieja sin `verified_number`, así que el número viejo no sale por
ningún lado.

**Descartado**: copiar el número a la solicitud al aceptar — mostraría el número viejo tras un
cambio, y queda un dato personal más que borrar.

## R5 — Aceptar, rechazar y preguntar son funciones con candado

**Decisión**: `accept_application`, `reject_application`, `revoke_acceptance`, `ask_question`,
`answer_question` y `open_application` toman el candado de la solicitud (`for update`), controlan
dueño, estado y reglas, escriben y encolan el correo. Devuelven un `outcome` corto, como
`withdraw_application`:

- `accept_application(p_publisher, p_id)` → `accepted` · `already_accepted` · `rejected` ·
  `gone` (retirada, o cerrada por bloqueo de la otra o suspensión: FR-042) · `you_blocked` ·
  `closed` (con motivo) · `publisher_needs_phone` · `applicant_needs_phone` · `not_found`.
- `reject_application(p_publisher, p_id, p_reason, p_note)` y `revoke_acceptance(…)` → `rejected` ·
  `already_rejected` · `accepted` (rechazar una que ya está aceptada: usar dejar sin efecto) ·
  `not_accepted` (dejar sin efecto una que no lo está) · `gone` · `you_blocked` · `closed` ·
  `invalid` · `not_found`.
- `ask_question(p_publisher, p_id, p_attempt, p_text)` → `asked` · `already` · `pending` ·
  `limit` · `not_waiting` · `gone` · `you_blocked` · `closed` · `invalid` · `not_found`.
- `answer_question(p_applicant, p_question, p_text)` → `answered` · `already_answered` ·
  `not_active` · `invalid` · `not_found`.

El texto se valida dos veces: el schema zod con la detección de contacto (`lib/contact`) en el
servidor de la app, y la base solo el largo y que no esté vacío (la detección de contacto no se
duplica en SQL: es una regla de presentación con mensajes, y #63 hizo lo mismo).

**Por qué**: dos pestañas, un retiro y una aceptación al mismo tiempo, o un bloqueo en el medio, se
ordenan por el candado (edge cases de la spec). La suspensión del publicador la frena la sesión
(`getSessionUser`, #13).

## R6 — «Nueva» y el correo que no se repite

**Decisión**: nueva = `status = 'sent'` y `opened_at` nulo. `open_application` marca `opened_at` la
primera vez que el publicador abre la solicitud. `inbox_visits (publisher_id, pet_id, seen_at)`
guarda la última vez que abrió las solicitudes de ese animal; abrir **Solicitudes** actualiza la de
todos sus animales con solicitudes (una sola sentencia). `submit_application` encola
`new_application` salvo que exista otra solicitud de ese animal `sent`, sin abrir y con `sent_at`
posterior al `seen_at` de ese animal (FR-060, spec §Assumptions).

`open_application` y `visit_inbox` se llaman al renderizar la página (como `apply_tapped` en #63). Para que
el prefetch de Next no marque una solicitud como abierta sin que nadie la mire, cada ruta tiene su
`loading.tsx` (el prefetch de una ruta dinámica llega solo hasta ahí) y los enlaces de
`ApplicationCard` e `InboxPetCard` van con `prefetch={false}`.

**Por qué**: es la regla del caso borde de la historia («2 nuevas sin abrir → no hay correo;
después de abrir Solicitudes, la próxima sí»), contada por animal.

## R7 — Rechazados no vuelven a solicitar ese animal

**Decisión**: `submit_application` y `apply_context` suman el control `rejected`: existe una
solicitud `rejected` de esa persona a ese animal. Va después de `has_active` y antes del límite
(FR-003 de #63): no tiene sentido verificar nada para un animal que ya no se puede pedir.
`pet_application_view` suma `my_rejected`; `applyActionKind` suma la rama «Tu solicitud no fue
aceptada» y `applyGate` la pantalla correspondiente si se entra por la dirección del cuestionario.

## R8 — Las pantallas del publicador son tres rutas nuevas en `(app)`

**Decisión**: `/solicitudes` (bandeja), `/solicitudes/animal/{petId}` (las de un animal),
`/solicitudes/{id}` (una). La de una solicitud llega también sin animal (borrado): se identifica por
la solicitud, no por el animal. Todas `noindex`, con `requireProfile`. Ajena o inexistente →
`notFound()` (FR-001).

**Por qué**: `/mis-animales/{id}` ya es la edición del animal; meter la bandeja adentro mezcla dos
trabajos. Una solicitud de un animal borrado necesita una dirección que no dependa del animal
(caso borde del correo viejo).

## R9 — «Abrir WhatsApp» es un enlace a una ruta propia que mide y redirige

**Decisión**: `GET /api/solicitudes/{id}/whatsapp` lee el contacto con la sesión (R4), registra
`whatsapp_tapped { side }` y responde 303 a `https://wa.me/{número sin +}?text={mensaje}`. Sin
contacto (dejó de verse, sin teléfono verificado) → 303 a la solicitud. El mensaje lo arma
`whatsappMessage({ side, petName, senderName, appName })` (pura) con los textos de
`applications.whatsapp.*`. El número también queda escrito en la pantalla.

**Por qué**: es un `<a>` sin JavaScript (Server Component), la medición no depende de un `onClick`, y
el control de quién puede ver el contacto es el mismo de la pantalla. `wa.me` abre la app en el
teléfono y WhatsApp Web en la computadora (edge case de la spec).

**Descartado**: `api.whatsapp.com/send` — redirige a `wa.me` igual; un `onClick` con `sendBeacon`
— suma una hoja cliente por un evento.

## R10 — Funciones puras con test

- `publisherActions(app, ctx)`: qué se ofrece en una solicitud (aceptar, con su freno de teléfono de
  cada lado; rechazar; preguntar, con cuántas quedan; dejar sin efecto; nada).
- `publisherApplicationView(app)`: el sello y la línea del estado del lado del publicador, con el
  texto único de FR-042 para retirada/bloqueo/suspensión.
- `applicationView` (de #63) suma `accepted`, `rejected` y «te preguntaron algo».
- `daysWaiting(sentAt, now)`: días de calendario en `America/Montevideo`.
- `inboxOrder(pets)` y `petApplicationsOrder(apps)`.
- `whatsappMessage(...)` y `whatsappUrl(phone, text)`.
- `responseOutcome(outcome)`: el `outcome` de la base → `ActionResult` con su clave de i18n.
- `rejectionSchema`, `questionSchema`, `answerSchema` (`lib/schemas/application-response.ts`).
- Los eventos de `lib/analytics/application-events.ts` nuevos.

## R11 — Medición

Eventos nuevos: `inbox_opened`, `application_opened { hours }`, `application_first_response
{ hours, kind }`, `application_accepted`, `application_rejected { reason }` (sin la línea),
`question_asked`, `question_answered { hours }`, `acceptance_revoked { reason }`, `whatsapp_tapped
{ side: 'publisher' | 'applicant' }`, `pet_in_process_from_offer`. «Primera respuesta» es la primera
de aceptar, rechazar o preguntar sobre esa solicitud: la base devuelve `first_response = true` cuando
`application_reviews` no tenía ninguna. Ninguno lleva ids, nombres, textos ni teléfonos (FR-091).

## R12 — La portada suma un renglón en cada lado

`home.adopter.apply` y `home.rescuer.steps.inbox` en `messages/es.json`; `AdopterPromise` suma la
frase y la lista de pasos de «Si rescatás» suma el suyo. Sin JS, sin consulta nueva.

## R13 — Sin dependencias nuevas

Todo lo de esta historia se hace con lo que hay en `main`: Postgres, Server Actions, `sendEmail`,
las primitivas de `ui/`. No se agrega ninguna línea a `docs/07-stack.md`.
