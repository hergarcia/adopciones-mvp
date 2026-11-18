# Implementation Plan: Sumarle al cuestionario de un animal una pregunta mía, la que hoy hago por WhatsApp

**Branch**: `feature/292-sumarle-cuestionario-pregunta-propia` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/038-pregunta-propia-cuestionario/spec.md`

## Summary

Quien publica un animal o una camada puede escribir una pregunta propia de hasta 200 caracteres, sin
contacto, en el mismo formulario. Se guarda en una columna de `pets` (animal sin camada) y otra de
`litters`; una cría usa la de su camada, leída en el momento (research R1). Las dos tablas ya se leen
solo por su dueña y todo lo público pasa por funciones con columnas nombradas, así que la pregunta no
llega a la ficha, al listado ni a la vista previa sin tocar nada de eso. En el cuestionario es un paso
de texto más, justo antes de «¿Por qué <nombre>?», con el nombre de quien publicó (R4). Cada solicitud
guarda aparte, en dos columnas, la pregunta tal como se contestó y la respuesta (R2); la base compara la
pregunta en la misma transacción que inserta y devuelve `question_changed` si cambió (R3). Quien publicó
la lee en la solicitud, o «Llegó antes de tu pregunta» si el animal hoy pregunta y esa solicitud no la
contestó (R6). La solicitud que espera la identidad (#289) la guarda y la copia al salir. Encuestas suma
la sección «Lo que preguntan quienes publican» (R7). La medición suma el sí o el no a seis momentos que
ya existen y la lectura 14 de docs/03 (R9, R10).

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre (next-intl, zod, Supabase con `@supabase/ssr`, Radix bajo las
primitivas, PostHog). **Ninguna dependencia nueva.**

**Storage**: Supabase Postgres local; una migración forward-only
(`20261118120000_own_questions.sql`): siete columnas, tres funciones nuevas, siete reemplazadas y seis
redefinidas (data-model.md)

**Testing**: Vitest (unitarias y `tests/db` contra Supabase local), Stryker al 100 % sobre lo que tiene
test, Playwright (un flujo)

**Target Platform**: web mobile-first, 390 px y 1280 px

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: sin JS nuevo en pantallas públicas. El campo vive en `PetForm` y `LitterForm`,
que ya son hojas cliente; el paso nuevo vive en `ApplicationForm`, que ya es hoja cliente; la
solicitud abierta, «Mi solicitud» y Encuestas siguen siendo Server Components. Presupuesto de siempre:
JS inicial < 150 KB, LCP < 2,5 s, Lighthouse mobile ≥ 90

**Constraints**: Ley 18.331 (la pregunta no es pública; la respuesta la ven solo las dos puntas; quien
administra lee preguntas sin persona ni animal); el contacto solo al aceptar; una solicitud nunca sale
con una respuesta a una pregunta que la persona no vio

**Scale/Scope**: beta de 3-5 rescatistas; pantallas tocadas: publicar y editar animal y camada, el
cuestionario, la solicitud recibida, «Mi solicitud», Encuestas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra tablas, rutas ni componentes; el cómo vive acá, en research y data-model. |
| II. Una feature, un PR | Cinco user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R11: privacidad y reglas en `tests/db`, lógica pura con Stryker al 100 %, un e2e. |
| IV. Reglas como código | Largos y «la cría no tiene la suya» como `check` con paridad (200, 500); la comparación de la pregunta, en la base y en la misma transacción. |
| V. Datos mínimos y privados | Columnas en tablas leídas solo por su dueña; la pregunta contestada vive con la respuesta y se borra con ella; quien administra lee un arreglo alfabético sin ids; los momentos llevan sí o no; pruebas que intentan leer como visitante, otra persona, quien administra y quien publicó un animal ajeno. |
| VI. Sin deriva | No cambia las preguntas de siempre, sus textos ni su orden, «Pedir más información», la ficha, el listado, la vista previa, el texto para el grupo, la revisión de publicaciones ni los correos. |
| VII. Liviana y linda | Componentes y tokens de docs/10 (`CountedTextarea`, `QuestionField`, `AnswerList`, `FormNote`, `SurveyAnswerList`); tres estados de cada bloque con datos (§Diseño). |
| VIII. Autonomía con veto | Las seis decisiones de la historia van a docs/03 en esta rama (§2, §4, §6 y §Métricas de éxito); el glosario de docs/06 suma «pregunta propia» y §Cuestionario registra dónde se guarda; ninguna regla que juzga a los agentes cambia. |

Sin violaciones. Re-chequeado después del diseño: igual.

## Project Structure

### Documentation (this feature)

```text
specs/038-pregunta-propia-cuestionario/
├── story.md             # cuerpo verbatim de la historia #292
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/server-actions.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/20261118120000_own_questions.sql            # nuevo (data-model.md)
src/lib/supabase/types.ts                                       # regenerado con pnpm db:types
src/lib/applications/rules.ts                                   # OWN_QUESTION_MAX_LENGTH
src/lib/applications/questionnaire.ts (+ .test.ts)              # FormQuestionId, el paso virtual, stepOf/lastAnswered
src/lib/applications/draft.ts (+ .test.ts)                      # own en el borrador
src/lib/applications/submit-outcome.ts (+ .test.ts)             # question_changed
src/lib/applications/held-outcome.ts (+ .test.ts)               # question_changed
src/lib/applications/answer-words.ts (+ .test.ts)               # el renglón propio y «Llegó antes»
src/lib/applications/types.ts                                   # ApplyScreen.ownQuestion, MyApplication/PublisherApplication own*
src/lib/schemas/application.ts (+ .test.ts)                     # validar la respuesta propia
src/lib/schemas/pet.ts (+ .test.ts)                             # ownQuestion en PET_FIELDS y el schema
src/lib/schemas/litter.ts (+ .test.ts)                          # ownQuestion
src/lib/pets/types.ts                                           # PetFormValues.ownQuestion
src/lib/surveys/own-questions.ts (+ .test.ts)                   # nuevo: el resumen para la sección
src/lib/analytics/events.ts                                     # own_question en seis momentos; PetField
src/lib/analytics/measured-levels.ts (+ .test.ts)               # ApplicationMeasure.ownQuestion
src/lib/analytics/application-events.ts (+ .test.ts)            # sent, accepted, rejected, first response, held
src/lib/analytics/pet-events.ts (+ .test.ts)                    # published, edited
src/lib/supabase/queries/applications.ts                        # apply_context, submit/hold, my_application
src/lib/supabase/queries/application-responses.ts               # publisher_application
src/lib/supabase/queries/pets.ts, litters.ts                    # leer own_question para editar
src/lib/supabase/queries/own-questions.ts                       # nuevo: admin_own_question_summary, null si falla
src/actions/pets.ts, litters.ts, applications.ts                # el campo, la pregunta al enviar, los momentos
src/hooks/use-application-submit.ts                             # question_changed
src/hooks/use-questionnaire-steps.ts                            # el paso virtual
src/hooks/use-application-draft.ts                              # own
src/hooks/use-pet-draft.ts, use-litter-draft.ts, use-litter-values.ts  # ownQuestion
src/components/pets/own-question-field.tsx                      # nuevo
src/components/pets/pet-fields.tsx                              # el campo en `end`
src/components/litters/litter-apply-fields.tsx                  # el campo en «Para adoptar»
src/components/applications/question-field.tsx                  # kind own: la etiqueta con el nombre
src/components/applications/changed-question-note.tsx           # nuevo: el aviso y lo anterior
src/components/applications/application-form.tsx                # ownQuestion, publisherName, previousOwnAnswer
src/components/surveys/survey-answer-list.tsx                   # meta optativo
src/app/[locale]/(app)/solicitar/[code]/page.tsx                # pasa la pregunta solo al cuestionario
src/app/[locale]/(app)/solicitudes/[id]/page.tsx                # own y asks_now a AnswerList
src/app/[locale]/(app)/mis-solicitudes/[id]/page.tsx            # own a AnswerList
src/app/[locale]/(app)/revision/encuestas/page.tsx              # la sección
src/app/[locale]/(app)/revision/encuestas/_components/own-questions.tsx   # nuevo
src/app/[locale]/(app)/revision/encuestas/_components/shown-lists.ts      # clave preguntas
messages/es.json                                                # los textos (contracts §Textos)
docs/03-mvp-features.md                                         # decisiones (ya) y lectura 14
docs/06-i18n.md                                                 # glosario y §Cuestionario (ya)
docs/10-design-system.md                                        # OwnQuestionField, ChangedQuestionNote en la tabla
tests/db/own-questions-privacy.test.ts, own-questions-rules.test.ts, own-questions-support.ts
tests/e2e/pregunta-propia.spec.ts
supabase/seed.sql                                               # un animal y una camada con pregunta
```

**Structure Decision**: la de F00, sin carpetas nuevas. Lo de dominio en `components/pets`,
`components/applications` y `components/surveys`; la lógica pura en `lib/applications`, `lib/surveys`
y `lib/schemas`; la base solo por `lib/supabase/queries`.

## Diseño

Se cargó `docs/10-design-system.md` (§Principios, §Componentes, §Layout) antes de escribir esta
sección. El skill `frontend-design:frontend-design` no está en esta sesión; lo carga el Build antes
de escribir el JSX, como dice CLAUDE.md.

### Componentes

| Componente | Reusa / nuevo | Notas |
|---|---|---|
| `OwnQuestionField` (pets) | nuevo, sobre `CountedTextarea` | etiqueta `--text-sm` `ink-muted`, ayuda «La ve quien te solicita, no la ficha.» en el mismo tono, `placeholder` con el ejemplo, tres renglones, `CharacterCount` de 200 sin `maxLength` (sobran en `--color-accent`), error debajo con `ErrorText` |
| `PetFields`, `LitterApplyFields` | reusa | el campo al pie de «Quién puede solicitar» / «Para adoptar» |
| `QuestionField` | reusa, suma `kind: 'own'` | arriba, «La pregunta de Carla» en `--text-sm` `ink-muted`; la pregunta en `--text-lg` `ink`, como las otras; `CountedTextarea` de 500 |
| `ChangedQuestionNote` (applications) | nuevo, sobre `FormNote` | el aviso arriba de la pregunta, `role="status"`; debajo del campo, `PreviousAnswer`: «Lo que habías escrito» en `--text-sm` `ink-muted` y el texto en `--text-base` `ink` dentro de `--color-surface`, seleccionable |
| `AnswerList` | reusa | un renglón más; «Llegó antes de tu pregunta» va como respuesta en `ink-muted` |
| `SurveyAnswerList` | reusa, `meta` optativo | las preguntas entre comillas, sin renglón de meta |
| `SurveySummary` | no | la sección no tiene opciones ni barras |
| `ShowMoreLink` | reusa | «Ver más» de la lista |

### Tokens

`--color-ink`, `--color-ink-muted`, `--color-surface`, `--color-line`, `--color-accent` (solo el «Sobran
N»), `--text-sm`, `--text-base`, `--text-lg`, `--text-xl` (el `h2` de la sección), `--space-2`,
`--space-4`, `--space-6`, `--space-8`, `--measure`. Ningún valor fuera de la guía.

### Lo único que llama la atención

En el cuestionario, la pregunta de quien publicó: es el contenido del paso, en `--text-lg` tinta, como
cualquier otra pregunta; nada más en ese paso compite con ella (ni sello, ni color, ni cinta). En el
formulario de publicar el campo es uno más, sin destacar: es optativo.

### Publicar y editar (390 px, al pie de «Quién puede solicitar»)

```text
┌──────────────────────────────────────┐
│ Quién puede solicitar                │
│ ( ) Teléfono verificado              │
│ ( ) Identidad verificada             │
│                                      │
│ Tu pregunta para quien quiera        │  --text-sm ink-muted
│ adoptarlo                            │
│ La ve quien te solicita, no la ficha.│  --text-sm ink-muted
│ ┌──────────────────────────────────┐ │
│ │ Ej.: Toma una pastilla dos veces │ │  placeholder
│ │ por día. ¿Podés dársela?         │ │
│ └──────────────────────────────────┘ │  renglón de tinta 2 px
│                          Quedan 40   │  aparece desde los 100
│ [error: no puede llevar un teléfono] │
│                                      │
│ ▓▓▓▓▓▓▓▓▓ Publicar ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  tirita
└──────────────────────────────────────┘
```

Estados: vacío (ejemplo y ayuda), con texto, sobran N (accent, no guarda), error de contacto, cargando
(el `PetFormSkeleton` / `LitterForm` de siempre), guardado fallido (`PetSaveFooter`).

### El paso de la pregunta propia en el cuestionario (390 px)

```text
┌──────────────────────────────────────┐
│ 11 de 12                             │  --text-sm ink-muted tabular-nums
│                                      │
│ La pregunta de Carla                 │  --text-sm ink-muted
│ Kira toma una pastilla dos veces por │  --text-lg ink (lo que llama la atención)
│ día. ¿Podés dársela en horario?      │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │  CountedTextarea, 3 renglones
│ └──────────────────────────────────┘ │
│                         Quedan 500   │
│                                      │
│ ▓▓▓▓▓▓▓▓ Siguiente ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  primary lg
│ Anterior                             │  ghost
└──────────────────────────────────────┘
```

### La pregunta cambió al tocar «Enviar»

```text
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │  FormNote, --color-surface
│ │ Carla cambió su pregunta mientras│ │  role=status
│ │ escribías. Contestá la nueva     │ │
│ │ para mandar la solicitud.        │ │
│ └──────────────────────────────────┘ │
│ La pregunta de Carla                 │
│ ¿Tenés otro gato en casa?            │  --text-lg ink
│ ┌──────────────────────────────────┐ │  vacío, con el foco
│ └──────────────────────────────────┘ │
│ Lo que habías escrito                │  --text-sm ink-muted
│ ░ Sí, puedo dársela a las 8 y a las ░│  --color-surface, seleccionable
│ ░ 20, trabajo desde casa.           ░│
│ ▓▓▓▓▓▓▓▓ Siguiente ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────────────────────────┘
```

### La solicitud recibida y «Mi solicitud», «Lo que contestó»

```text
│ ...                                  │
│ ¿Qué experiencia tenés?              │  --text-sm ink-muted
│ Tuve dos perros...                   │  --text-base ink
│ ──────────────────────────────────── │  --color-line
│ Kira toma una pastilla dos veces por │  la pregunta contestada, como las otras
│ día. ¿Podés dársela en horario?      │
│ Sí, a las 8 y a las 20.              │
│ ──────────────────────────────────── │
│ ¿Por qué Kira?                       │
│ ...                                  │
```

Sin respuesta y con pregunta hoy (solo quien publicó):

```text
│ Tu pregunta para quien quiera        │  --text-sm ink-muted
│ adoptarlo                            │
│ Llegó antes de tu pregunta           │  --text-base ink-muted
```

Cargando: el `AnswerListSkeleton` de siempre. Error: el `error.tsx` de la ruta, como hoy. Vacío: no
aplica (una solicitud siempre tiene respuestas).

### Encuestas, «Lo que preguntan quienes publican» (1280 px, una columna de lectura)

```text
──────────────────────────────────────────────────── --color-line
Lo que preguntan quienes publican                     h2 --text-xl bold
3 de 8 publicaciones tienen una pregunta.             --text-sm ink-muted

  Las preguntas                                       h3 --text-base medium
  «¿Te comprometés a traerlo a la vacuna de los 3     --text-base ink
  meses?»
  «¿Tenés patio cerrado?»
  «Kira toma una pastilla dos veces por día...»
  Ver más                                             ShowMoreLink
```

Vacía: el `h2` y «Todavía nadie sumó una pregunta.» en `--text-base` `ink-muted`. Error: el `h2` y
«No pudimos traer las preguntas. Probá de nuevo en un rato.» en el mismo tono, sin tapar las otras
secciones. Cargando: el `loading.tsx` de Encuestas, como hoy.

## Complexity Tracking

Sin violaciones de la constitución.
