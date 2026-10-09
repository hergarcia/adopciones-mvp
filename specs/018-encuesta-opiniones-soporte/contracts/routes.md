# Contratos — rutas, acciones y eventos

## Rutas (bajo `[locale]`, `es` sin prefijo)

| Ruta | Zona | Indexa | Qué cambia |
|---|---|---|---|
| Todas | — | como hoy | `PaperFrame` suma el enlace «Opinar» arriba y `SiteFooter` abajo (research R10, plan §Cambios de Build), también con `menu={false}` (cuenta suspendida). |
| `/opinar` | `(open)` | `noindex` | **Nueva.** `FeedbackForm`; de dónde se viene, por el `Referer` (`feedbackOrigin`). Con o sin sesión, también con la cuenta suspendida. |
| `/mis-animales` | `(app)` | `noindex` | `my_pets_survey()`; con una oferta `pending`, `SurveyCard` `gave` encima de la tarjeta de ese animal (`surveys` de `MyPetsGrid`, por `pet.id`). `newly_offered` → `survey_offered`. |
| `/mis-solicitudes/{id}` | `(app)` | `noindex` | `survey_for('adopted', id)` (la base resuelve la adopción de esa solicitud) si la solicitud es `handed_over` con adopción no declinada; `survey_for('not_chosen', id)` si es `rejected` o `closed`/`adopted`. Con `pending`, `SurveyCard` debajo de `AdoptionPanel` o de `NotAcceptedNote`/la nota de cierre. |
| `/mi-perfil` | `(app)` | `noindex` | Para quien administra, suma los caminos a Opiniones y Encuestas, con los de las demás listas (plan §Cambios de Build). |
| `/revision/opiniones` | `(app)` | `noindex` | **Nueva.** `FeedbackList` (`admin_feedback`), «Ver más» con `?ver=<n>` (suma 50 a las que se ven). Sin sesión o sin administrar → `notFound()`. `loading.tsx` y `error.tsx` propios. |
| `/revision/encuestas` | `(app)` | `noindex` | **Nueva.** `SurveySummary` por momento (`admin_survey_summary`) con `SurveyAnswerList` (`admin_survey_answers`), «Ver más» por momento con `?<momento>=<n>`. Igual que arriba. |

Route handler: `GET /api/soporte/whatsapp` — sin número → 404; con número → `track('support_whatsapp_opened', { screen })` (pantalla del `Referer`) y `303` a `supportWhatsAppUrl`.

## Server Actions → `ActionResult<T>`

`src/actions/surveys.ts` (nueva):

| Acción | Entrada | Salida |
|---|---|---|
| `answerSurvey(input)` | `{ offerId: uuid, moment, option, body: string ≤ 500 }` (`surveyAnswerSchema`: opción del momento, `contactMatch` sobre `body`, solo `phone` y `email`, solo espacios = vacío) | `ok: null` (`answered`, `already` o `dismissed`) · `surveys.errors.{option_required,contact,too_long,not_found,session,failed}`. Después: `survey_answered`, `revalidatePath` de la pantalla. |
| `dismissSurvey(input)` | `{ offerId: uuid, moment }` | `ok: null` (`dismissed` o `already`) · `surveys.errors.{not_found,session,failed}`. Después: `survey_dismissed`. |

`src/actions/feedback.ts` (nueva):

| Acción | Entrada | Salida |
|---|---|---|
| `sendFeedback(input)` | `{ attemptId: uuid, body: string 1..1000, path: string }` (`feedbackSchema`) | `ok: null` (`sent` o `already`) · `feedback.errors.{empty,too_long,contact,limit,failed}`. Lee la cookie `opinar` (la escribe el navegador al enviar, `sameSite=lax`, un año) y manda su SHA-256. Después: `feedback_sent {screen}`. Sin sesión, también. |
| `deleteFeedback(input)` | `{ id: uuid }` | `ok: null` · `feedback.errors.{not_found,delete_failed}`. `revalidatePath('/revision/opiniones')`. |

`suspended` no llega: la pantalla ya lleva a la de cuenta suspendida (#13) y la base devuelve
`suspended`, que la acción traduce a `session`.

## Eventos (`lib/analytics/survey-events.ts`)

| Evento | Props | Cuándo |
|---|---|---|
| `survey_offered` | `{ moment }` | La pantalla recibe `newly_offered`. |
| `survey_answered` | `{ moment, option, wrote: boolean }` | `answerSurvey` con `answered` (no con `already`). |
| `survey_dismissed` | `{ moment }` | `dismissSurvey` con `dismissed`. |
| `feedback_sent` | `{ screen }` | `sendFeedback` con `sent`. |
| `support_whatsapp_opened` | `{ screen }` | El route handler, antes de redirigir. |

Ninguno lleva texto, sujeto, ids ni datos de las personas.
