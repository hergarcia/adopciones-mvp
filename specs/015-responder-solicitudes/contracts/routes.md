# Contratos — rutas, acciones, correos y eventos

## Rutas (todas bajo `[locale]`, `es` sin prefijo)

| Ruta | Zona | Indexa | Qué es |
|---|---|---|---|
| `/solicitudes` | `(app)` | `noindex` | La bandeja (`publisher_inbox`). Al cargar: `visit_inbox(user)` y `inbox_opened`. Vacía: con animales → «Ir a Mis animales»; sin animales → «Publicar un animal». |
| `/solicitudes/animal/{petId}` | `(app)` | `noindex` | Las de un animal (`pet_applications`). Animal ajeno, inexistente, borrado o dado de baja → `notFound()`. Al cargar: `visit_inbox(user, petId)`. |
| `/solicitudes/{id}` | `(app)` | `noindex` | Una, para el publicador (`publisher_application`, `application_questions_of`, `application_contact`). Ajena o inexistente → `notFound()`. Al cargar: `open_application` y, la primera vez, `application_opened`. `?aceptada=1` muestra la oferta de «En proceso» (solo con el animal disponible). |
| `/mis-solicitudes/{id}` (cambia) | `(app)` | `noindex` | Suma la pregunta para contestar, las anteriores y el contacto. |
| `/mis-solicitudes` (cambia) | `(app)` | `noindex` | Los estados nuevos. |
| `/mis-animales` (cambia) | `(app)` | `noindex` | Cada animal con nuevas suma «N nuevas» → `/solicitudes/animal/{petId}`. |
| `/animales/{code}` (cambia) | `(public)` | según `INDEXING_ENABLED` | `ApplyAction` suma `rejected`: «Tu solicitud no fue aceptada» y «Ver animales en adopción». |
| `/solicitar/{code}` (cambia) | `(app)` | `noindex` | `applyGate` suma `rejected` → la misma pantalla que la ficha. |
| `/` (cambia) | `(public)` | según `INDEXING_ENABLED` | Los dos pasos nuevos. |
| `GET /api/solicitudes/{id}/whatsapp` | Route Handler | — | R9: con sesión y contacto visible → registra `whatsapp_tapped` y 303 a `wa.me`; si no → 303 a la solicitud del lado de quien mira. |
| `GET /api/cron/publicaciones` (cambia) | Route Handler | — | Suma `drainApplicationNotices()` al final. |

Las tres rutas nuevas: `requireProfile` (sin sesión → ingresar con `next`, que vuelve a la
solicitud: edge case del correo), `metadata` con `robots: noindex` y textos de
`metadata.inbox.*`, `loading.tsx` con su esqueleto y `error.tsx` con `ErrorScreen`.

## Server Actions (`src/actions/application-responses.ts`) → `ActionResult<T>`

| Acción | Entrada | Salida |
|---|---|---|
| `acceptApplication(id)` | id | `ok: { firstResponse }` · `inbox.errors.{gone,closed,you_blocked,already_rejected,applicant_needs_phone,not_found,failed}`; `publisher_needs_phone` → `detail.redirect` al aviso de verificación con `para=aceptar` y vuelta a la solicitud. `already_accepted` cuenta como `ok`. |
| `rejectApplication(input)` | `{ id, reason, note? }` (`rejectionSchema`) | `ok: null` · `inbox.errors.{missing_reason,missing_note,contact,gone,closed,you_blocked,accepted,not_found,failed}`. `already_rejected` cuenta como `ok`. |
| `revokeAcceptance(input)` | `{ id, reason, note? }` (`revocationSchema`, suma `not_concluded`) | `ok: null` · igual, con `not_accepted`. |
| `askQuestion(input)` | `{ id, attemptId, text }` (`questionSchema`) | `ok: null` · `inbox.errors.{empty,contact,pending,limit,not_waiting,gone,closed,you_blocked,not_found,failed}`. `already` cuenta como `ok`. |
| `markInProcessFromOffer(id)` | id de la solicitud | Usa `changePetStatusRecord` con `mark_in_process`; registra `pet_in_process_from_offer`. Errores de `pets.status.errors.*`. |

En `src/actions/applications.ts` (quien solicitó):

| Acción | Entrada | Salida |
|---|---|---|
| `answerQuestion(input)` | `{ questionId, text }` (`answerSchema`) | `ok: null` · `applications.answer.errors.{empty,contact,not_active,not_found,failed}`. `already_answered` → `ok` con la pantalla refrescada. |

Cada acción: `getSessionUser()` (la puerta de la suspendida), la función de la base, los eventos
(R11), `drainApplicationNotices()` y `revalidatePath` de las pantallas de las dos puntas. El
`outcome` se traduce con `responseOutcome` (pura).

Cambian: `changePetStatus` (adoptar), `deletePet`, `resolvePetReview` (baja) y el borrado de la
cuenta llaman a `drainApplicationNotices()` después de guardar. `blockPerson`, `suspendAccount` y
`withdrawApplication` no (sus cierres no encolan).

## Correos (`src/lib/email/send-application-notice.ts`)

Uno por `kind`, con la plantilla de `sendEmail` y textos en `emails.applications.<kind>`:

| `kind` | A quién | Asunto (es) | Botón → |
|---|---|---|---|
| `new_application` | publicador | «Alguien quiere adoptar a {name}» | `/solicitudes` |
| `question_answered` | publicador | «Te contestaron sobre {name}» | `/solicitudes/{id}` |
| `accepted` | quien solicitó | «Aceptaron tu solicitud por {name}» | `/mis-solicitudes/{id}` |
| `rejected` | quien solicitó | «Tu solicitud por {name} no fue aceptada» | `/mis-solicitudes/{id}` |
| `question_asked` | quien solicitó | «Te preguntaron algo sobre tu solicitud por {name}» | `/mis-solicitudes/{id}` |
| `closed_adopted` | quien solicitó | «{name} encontró hogar» | `/mis-solicitudes/{id}` |
| `closed_unpublished` | quien solicitó | «{name} ya no está publicado» | `/mis-solicitudes/{id}` |

Ninguno lleva teléfono, respuestas, preguntas, motivo ni el correo de nadie (FR-063): solo el
nombre del animal, su sexo para concordar y el enlace. El log no lleva dirección ni id.

## WhatsApp (`applications.whatsapp.*`)

- Quien solicitó → publicador: «Hola, soy {sender}. Aceptaste mi solicitud por {pet} en {app}.»
- Publicador → quien solicitó: «Hola, soy {sender}. Acepté tu solicitud por {pet} en {app}.»

## Eventos (R11)

`inbox_opened`, `application_opened { hours }`, `application_first_response { hours, kind }`,
`application_accepted`, `application_rejected { reason }`, `question_asked`, `question_answered
{ hours }`, `acceptance_revoked { reason }`, `whatsapp_tapped { side }`,
`pet_in_process_from_offer`. Sin ids, nombres, textos ni teléfonos.
