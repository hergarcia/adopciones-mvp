# Research: Pedirle a quien solicitó que verifique su identidad antes de decidir

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Fecha**: 2026-10-29

Cada decisión con su motivo y lo que se descartó. Leído antes de decidir: las migraciones de la
#11 (`identity_verification`), la #63 (`applications`), la #65 (`application_responses`), la #206
(`litter_lifecycle`) y la #234 (`verification_exits`); `src/actions/application-responses.ts`,
`src/actions/review.ts`, `src/actions/identity.ts`, `src/lib/verification/exit-question.ts`,
`src/lib/applications/{paths,notices,publisher-actions}.ts` y las dos pantallas de una solicitud.

## R1. Dónde vive el pedido: una tabla propia, una fila por solicitud

**Decisión**: tabla nueva `public.application_identity_asks` con `application_id` como clave
primaria (FK a `applications` con `on delete cascade`), `asked_at timestamptz not null default
now()` y `resolved_at timestamptz` (nulo mientras no se resolvió). Sin políticas y sin permisos
para `anon` ni `authenticated`, como `application_reviews` y `application_questions`: se lee solo
con funciones `security definer` que eligen columnas según quién mira.

**Motivo**: la clave primaria en la solicitud es la regla «a lo sumo uno por solicitud» (FR-003)
hecha restricción; un doble toque, dos pestañas o un reintento chocan con ella y no hace falta un
id de intento como en las preguntas. Ponerlo en `applications` lo dejaría a la vista de quien
solicitó por `applications_select_own` con todas sus columnas, que hoy está bien pero ata el dato
a una política que no lo pensó; en `application_reviews` quedaría junto al motivo del rechazo, que
quien solicitó no puede ver (R2 de la #65) y la vista de quien solicitó necesita el pedido.

**Descartado**: columnas en `applications` (la política de lectura propia expone la fila entera);
columnas en `application_reviews` (mezcla lo que ve solo quien publicó con lo que ven las dos);
guardar el día como `date` (el día se calcula en hora de Uruguay al mostrar, como el resto de las
fechas de una solicitud; guardar el instante deja ordenar y comparar con la visita a la bandeja).

## R2. Pedir: una función con el candado de la solicitud, sin teléfono propio

**Decisión**: `public.ask_identity(p_publisher uuid, p_id uuid)` (solo `service_role`, el id sale
de la sesión en la acción), con `select … for update` sobre la solicitud, como `ask_question`.
Devuelve `outcome`, `asked_at`, `in_litter`:

| outcome | cuándo |
|---|---|
| `asked` | quedó el pedido y el aviso a quien solicitó |
| `already` | ya había uno (doble toque, otra pestaña, reintento): no escribe nada, devuelve su `asked_at` |
| `verified` | quien solicitó ya tiene la identidad aprobada (`identity_verifications`) |
| `not_waiting` | la solicitud está aceptada o rechazada |
| `gone` · `you_blocked` · `closed` | retirada o cerrada, con `private.not_answerable` (el texto de hoy, FR-007) |
| `not_found` | no existe o no es de un animal suyo |

Antes del candado de la solicitud toma el de la cuenta de quien solicitó
(`lock_identity_account`), en el mismo orden que la aprobación: sin eso, un pedido y una aprobación
simultáneos podían dejar un pedido abierto a alguien que ya tenía la identidad.

No pide el teléfono de quien publicó (FR-009): `ask_question` tampoco lo pide y pedir no revela
contacto. El orden de los controles es el de la tabla: `already` antes que el estado, así un
reintento después de que la solicitud se cerró dice «ya lo pediste» y no un error.

**Motivo**: el candado ordena el pedido con aceptar, rechazar, retirar y la aprobación de la
identidad (R4), que toman la misma fila. `on conflict do nothing` sobre la clave primaria deja un
solo pedido aunque dos llamadas pasen el control a la vez.

**Descartado**: un id de intento como en las preguntas (sobra: hay uno solo por solicitud);
exigir el nivel 1 de quien publicó (aceptar lo exige porque revela el teléfono; pedir no).

## R3. «Tener nivel 2»: la identidad aprobada, no la chapita

**Decisión**: se ofrece y se acepta pedir cuando no existe fila en `identity_verifications` para
quien solicitó. `publisher_application` suma `applicant_identity_verified boolean`, calculado así,
y `publisherActions` decide con eso, no con `applicant_level`.

**Motivo**: la spec (Assumptions) dice que a quien ya tiene la identidad no se le pide aunque haya
perdido el teléfono; `private.person_level` da 0 sin teléfono y lo confundiría con alguien sin
identidad. El dato no dice nada nuevo a quien publicó: solo esconde un botón.

## R4. Resolver al aprobar: en la misma transacción que la aprobación

**Decisión**: `private.resolve_identity_asks(p_user uuid)` corre dentro de
`resolve_identity_request` cuando el resultado es `approve`, después de insertar la verificación.
Toma `for update` las solicitudes de esa persona con un pedido sin resolver, y para cada una que
sigue `sent`:

1. `resolved_at = now()` en el pedido;
2. `opened_at = null` en `application_reviews` (vuelve a figurar como nueva, R5);
3. el aviso `identity_verified` a quien publicó con la regla de la solicitud nueva (R6).

Devuelve el nivel de ahora de cada quien pidió (`private.person_level(publisher_id)`) como
`smallint[]`, que `resolve_identity_request` suma a lo que ya devuelve como `asker_levels`. La
firma cambia: se borra la vieja y se crea la nueva, como hizo la #63 con esta misma función.

**Motivo**: la aprobación y la resolución son un solo hecho; si la resolución fallara aparte, la
persona quedaría verificada con quien publicó viendo «Todavía no la verificó». El candado de la
solicitud ordena la aprobación con un aceptar o un cierre simultáneos (spec §Edge Cases): el que
llega segundo ve el estado del primero. La acción necesita los niveles para medir (R9) y no hay
otra forma de saber cuáles resolvió esa aprobación sin guardar algo más.

**Descartado**: un trigger `after insert` sobre `identity_verifications` (la acción no sabría qué
pedidos resolvió para medirlos; un trigger escondido en otra tabla es difícil de seguir); resolver
en la acción después de aprobar (dos transacciones, el caso que se quiere evitar).

## R5. «Vuelve a figurar como nueva»: borrar `opened_at`

**Decisión**: resolver pone `application_reviews.opened_at = null`. Todo lo que hoy cuenta nuevas
(`publisher_inbox`, `publisher_new_counts`, `pet_applications.is_new`, la camada de
`publisher_inbox` de la #206) lo toma sin cambios. `open_application` se redefine para que
`opened_first` sea falso cuando la solicitud tiene un pedido resuelto: abrirla de nuevo no es la
primera vez y no vuelve a medir las horas hasta abrirla.

**Motivo**: es una sola columna que ya decide «nueva» en cinco lugares; una segunda marca obligaría
a tocar cada uno. El pedido solo se hace desde la solicitud abierta, así que un pedido resuelto
implica que ya se había abierto antes.

**Descartado**: una columna `seen_after_resolve` en el pedido y `is_new = opened_at is null or …`
en cada función (cinco funciones redefinidas por lo mismo).

## R6. Los correos: dos tipos nuevos en la bandeja de salida

**Decisión**: `application_notices.kind` suma `identity_asked` (a quien solicitó, lo escribe
`ask_identity` cuando el resultado es `asked`) e `identity_verified` (a quien publicó, lo escribe
`resolve_identity_asks`). La regla de no repetir es la de `submit_application`, ampliada a las que
volvieron a ser nuevas: no se escribe si existe otra solicitud `sent` de ese animal, sin abrir, que
se volvió nueva después de la última visita a la bandeja de ese animal (`sent_at` o, si tiene
pedido resuelto, `resolved_at`, mayor que `inbox_visits.seen_at`). Una cría es su propio animal,
como en el correo de solicitud nueva de la #206.

Los dos salen por `sendApplicationNotice` como los demás (asunto, título, cuerpo y botón de
`emails.applications.<kind>`, con el nombre del animal o de la cría con su camada). `noticeEmail`
lleva `identity_asked` a Mi solicitud (ya es el camino de todo lo de quien solicitó) e
`identity_verified` a esa solicitud del lado de quien publicó (suma la clase a `TO_PUBLISHER`, sin
camino propio). La acción y la revisión vacían la bandeja al terminar (`drainApplicationNotices`),
y lo que quede lo barre la tarea diaria, como hoy.

**Motivo**: la bandeja de salida ya escribe el aviso en la misma transacción que el cambio y
nunca lo manda dos veces (se borra al tomarlo): es exactamente FR-003 y FR-027. Ningún correo de
esta bandeja lleva teléfono, respuestas ni datos de la cédula (FR-019, FR-026).

## R7. El camino a verificar y la vuelta: `?solicitud=<id>`

**Decisión**: una marca nueva en `/verificar-identidad`, `solicitud=<id de la solicitud>`
(`APPLICATION_FLAG` en `lib/applications/paths.ts`), con `identityForApplicationPath(id)` =
`/verificar-identidad?pedir=1&solicitud=<id>`. La página valida la marca con
`getMyApplication(id)`: si no es suya, no espera respuesta o no tiene un pedido abierto, se ignora y
la pantalla es la de hoy (FR-023). Con la marca válida:

- `IdentityRequestForm` recibe `hrefs.sent = myApplicationPath(id)` (vuelve a la solicitud, que dice
  «en revisión» porque lee el estado real) y ningún `returnCode`;
- «Ahora no» y «Cancelar la verificación» vuelven a `myApplicationPath(id)` (`exitDestination`);
- la puerta del teléfono, si hace falta, lleva `next` con la marca y `desde` la solicitud.

El pedido de verificación se guarda con `origin = 'profile'` y sin `return_pet_id`, como hoy desde
«Mi perfil»: los momentos de la verificación no cambian (spec Assumptions).

**Motivo**: el patrón ya existe con `animal=<código>` (#63, research R10/R11 de esa historia). El
id de la solicitud en la dirección no expone nada: solo la abre quien la mandó, y la página no la
usa sin validarla.

**Descartado**: guardar la solicitud de origen en el pedido de verificación (es un dato nuevo sin
uso: la vuelta es en la misma visita, y el correo de aprobado no cambia en esta historia).

## R8. El origen de la pregunta de por qué se va: `asked`

**Decisión**: `EXIT_ORIGINS` suma `asked` (en la interfaz, «Se la pidió quien publicó»).
`ExitPlace` suma `applicationId`; `exitPlaceOf` lo lee de `solicitud`; `exitOrigin` devuelve
`asked` para la identidad con `applicationId`, y para el teléfono cuando la puerta vuelve a una Mi
solicitud (`from` = `/mis-solicitudes/<uuid>`), que es el camino del pedido sin teléfono.
La acción de salir (`leaveVerification`) confirma con `getMyApplication` que la solicitud es de
quien sale antes de contar `asked`; si no, cuenta `self`, como una dirección inventada.

La migración amplía los `check` de origen de `verification_exit_tickets`,
`verification_exit_answers` y `verification_exit_counts`, inserta las filas `(phone, asked)` e
`(identity, asked)` en `verification_exit_counts` y redefine `ask_verification_exit` con la lista
nueva. `exitSummaryBlocks` arma `byOrigin` desde `EXIT_ORIGINS` en lugar de nombrar los tres, y
`ExitOriginTable` en Encuestas suma la columna.

**Motivo**: es lo que pide la historia (FR-035) y la decisión del 2026-10-29: separar si la gente
verifica más cuando se lo pide una persona que cuando lo pide una regla.

## R9. La medición: dos momentos nuevos

**Decisión**: `identity_ask_sent: { publisher_level?: MeasuredLevel; litter: boolean }`, desde la
acción con resultado `asked`, con el nivel leído recién entonces (`getApplicationMeasure(id)`,
como los momentos de responder de la #236); e `identity_ask_resolved: { publisher_level?:
MeasuredLevel }`, uno por cada nivel de `asker_levels` en `resolveIdentityRequest`, con `{ visit:
false }` como los demás momentos de quien administra. Un nivel que no se pudo leer no sale
(`publisherLevelProps`). Las funciones que arman los eventos van en
`lib/analytics/identity-ask-events.ts` con su prueba. `litter` sigue la marca de camada que ya
llevan los momentos de responder; no dice qué camada.

**Motivo**: FR-033, FR-034 y FR-036: el nivel y nada más, sin quién, animal ni solicitud. El
doble toque devuelve `already` y no mide.

## R10. Lo que ve cada lado: funciones de lectura ampliadas

**Decisión**:

- `publisher_application(p_id)` suma `identity_asked_at`, `identity_resolved_at` y
  `applicant_identity_verified` (R3). Se redefine con `drop` + `create`, como hizo la #206.
- `pet_applications(p_pet)` suma `identity_asked boolean`: pedido sin resolver y solicitud `sent`.
- `my_application(p_id)` suma `identity_asked boolean` (pedido sin resolver, solicitud `sent`),
  `identity_resolved_at` (solo si la solicitud sigue `sent`) y `publisher_level smallint` (solo con
  pedido y solicitud `sent`; las chapitas de quien publicó, FR-015).
- La vista de quien solicitó cruza eso con su propio estado de identidad, que la página ya sabe
  leer (`getMyIdentity` + `myVerification`), en una función pura
  `myIdentityAskView(application, identityStatus)` →
  `none | verify | retry | in_review | capped(retryOn) | verified`.
- La vista de quien publicó, en `publisherIdentityAskView(application)` →
  `offer | waiting(askedOn) | verified(askedOn, verifiedOn) | asked_only(askedOn) | none`.
  `publisherActions` suma `identityAsk: 'offer' | null` con la regla de FR-001.

Ninguna función de quien administra cambia (FR-030).

**Motivo**: es donde ya se decide qué ve cada lado; las reglas de visibilidad quedan en la base
(constitución §V) y lo que se pinta, en funciones puras que se prueban sin la base.

## R11. Borrar: con la solicitud y con la cuenta de cualquiera de los dos

**Decisión**: el pedido cae con la solicitud por `on delete cascade`. Borrar la cuenta de quien
solicitó borra sus solicitudes (cascade de `applicant_id`). Borrar la de quien publicó deja
`publisher_id` en nulo y la solicitud cerrada para quien la mandó: un trigger
`application_identity_asks_on_publisher_gone` (`after update of publisher_id on applications`,
cuando pasa a nulo) borra el pedido.

**Motivo**: FR-030 pide que se borre al borrar la cuenta de cualquiera de los dos, y la solicitud
sobrevive al borrado de quien publicó (FR-082 de la #63).

## R12. Qué se prueba y por qué (docs/09 §Qué vale la pena testear)

- **`tests/db/identity-asks-privacy.test.ts`**: la tabla no se lee como visitante, como quien
  solicitó, como quien publicó ni como quien administra; `my_application` de otra persona no
  devuelve nada; `publisher_application` de una solicitud ajena tampoco; ninguna función de quien
  administra (`admin_*`, la cola de revisión, la ficha de una persona) trae el pedido; el trigger
  borra el pedido al borrar la cuenta de quien publicó y la cascada al borrar la de quien solicitó.
- **`tests/db/identity-asks-rules.test.ts`**: cada resultado de `ask_identity` (un solo pedido y un
  solo aviso con dos llamadas, `verified`, `not_waiting`, `gone`, `you_blocked`, `closed`,
  `not_found`, una cría); pedir no toca `first_response_at` ni las preguntas; aprobar resuelve los
  pedidos abiertos de uno y de dos rescatistas, pone `opened_at` en nulo, escribe el aviso con la
  regla y devuelve los niveles; aprobar no toca un pedido de una solicitud aceptada, rechazada o
  cerrada; rechazar, vencer o retirar no tocan nada; `open_application` no vuelve a decir
  `opened_first`; el origen `asked` se acepta en la pregunta de por qué se va.
- **Unitarias con Stryker al 100 %**: `myIdentityAskView`, `publisherIdentityAskView`,
  `publisherActions` (la oferta), `identityAskOutcome` (resultado de la base → `ActionResult`),
  los dos eventos, `exitPlaceOf`/`exitOrigin`/`exitDestination` con la solicitud,
  `exitSummaryBlocks` con el origen nuevo, `noticeEmail` con las dos clases, las rutas nuevas.
- **e2e `tests/e2e/identidad-pedida.spec.ts`**: quien publicó pide la identidad y ve la línea;
  quien solicitó ve el aviso, va a verificar, manda las fotos y vuelve a su solicitud en revisión;
  quien administra aprueba y la solicitud vuelve a figurar como nueva con «Verificó su identidad».
- **No se prueba**: los componentes que solo pintan, las queries finas, las páginas.
