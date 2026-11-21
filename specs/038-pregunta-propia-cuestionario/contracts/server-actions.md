# Contracts: acciones, rutas y momentos

Server Actions devuelven `ActionResult<T>`; el `error` es una clave de i18n. Nunca lanzan.

## `publishPet`, `savePet` (`src/actions/pets.ts`) y `publishLitter`, `saveLitter` (`src/actions/litters.ts`)

Entrada: la de hoy más `ownQuestion: string` (el campo tal cual). El schema (`petSchema`,
`litterSchema`) la recorta; vacía es `null`.

| Caso | Resultado |
|---|---|
| más de 200 | error de campo `pets.errors.own_question_too_long` en `ownQuestion`; nada se guarda, lo cargado queda |
| teléfono, correo o enlace | error de campo `pets.errors.contact_phone` · `contact_email` · `contact_link` en `ownQuestion`; momento `pet_contact_rejected` `{ field: 'ownQuestion', kind }` |
| válida o vacía | se manda en `p_fields.own_question` (texto o nulo); lo demás, igual que hoy |

Momentos al guardar: `pet_published` y `pet_edited` suman `own_question: boolean`.

## `submitApplication` y `holdApplication` (`src/actions/applications.ts`)

Entrada: la de hoy más `ownQuestion: string | null` (la que la persona tiene en pantalla) y
`ownAnswer: string` (vacío si no hay pregunta). `validateApplication(input, { isNeutered, ownQuestion })`
valida la respuesta con la regla de las abiertas solo si hay pregunta.

| Resultado de la base | `ActionResult` |
|---|---|
| `question_changed` | error `applications.errors.question_changed` con `detail.ownQuestion` = la de hoy; el formulario va al paso de la pregunta, vacío, con lo anterior a la vista (R4) |
| `answers_invalid` con pregunta | `detail.errors.own_question` = `applications.errors.text_required` |
| `sent` / `held` | como hoy |
| los demás | como hoy |

Errores de la respuesta propia, al lado del campo (FR-012): `applications.errors.text_required`,
`applications.errors.too_long`, `applications.errors.contact_*`, los de siempre.

Momento: `application_sent` suma `own_question: boolean` (`own_question` no nulo en lo que devolvió la
base).

## `acceptApplication`, `rejectApplication`, `askQuestion` (`src/actions/application-responses.ts`)

Sin cambio de entrada ni de resultado. `application_accepted`, `application_rejected` y
`application_first_response` suman `own_question?: boolean` desde `application_measure`; si no se pudo
leer, la propiedad no sale.

## Rutas

- `/solicitar/[code]` (y la de una cría): el cuestionario con el paso de la pregunta propia cuando el
  animal o su camada tiene una. Las pantallas de freno no reciben la pregunta.
- `/solicitudes/[id]` (quien publicó): la pregunta contestada y la respuesta en «Lo que contestó»; o
  «Llegó antes de tu pregunta» con `asks_now`.
- `/mis-solicitudes/[id]` (quien solicitó): la pregunta contestada y su respuesta.
- `/mis-animales/publicar`, `/mis-animales/[id]/editar`, `/mis-animales/camadas/[id]/editar`: el campo.
- `/revision/encuestas` (quien administra): la sección «Lo que preguntan quienes publican», con
  `?preguntas=<n>` para «Ver más».

## Momentos (PostHog, sin persona ni texto)

| Momento | Propiedad nueva |
|---|---|
| `pet_published`, `pet_edited` | `own_question: boolean` |
| `application_sent` (también el de la que sale sola) | `own_question: boolean` |
| `application_first_response`, `application_accepted`, `application_rejected` | `own_question?: boolean` |
| `pet_contact_rejected` | `field` suma `ownQuestion` |

## Textos nuevos (`messages/es.json`, escritos y revisados con `sin-slop`)

- `pets.form.own_question.{label,hint,placeholder}` («Tu pregunta para quien quiera adoptarlo»; «La ve
  quien te solicita, no la ficha.»; un ejemplo).
- `pets.errors.own_question_too_long`.
- `applications.own_question.label` («La pregunta de {name}»), `applications.own_question.changed`
  (el aviso), `applications.own_question.added` (el aviso cuando no había pregunta y se sumó; cambio
  del Build: «cambió su pregunta» no es cierto si antes no había ninguna), las dos con su variante
  `*_no_publisher`, `applications.own_question.previous` («Lo que habías escrito»),
  `applications.own_question.before` («Llegó antes de tu pregunta»),
  `applications.own_question.yours` («Tu pregunta para quien quiera adoptarlo»).
- `applications.errors.question_changed`.
- `surveys.own_questions.{title,counts,list_title,list_label,empty,failed,more}`, con `empty` =
  «Todavía nadie sumó una pregunta.»
