---
description: "Tareas de la historia #71 — Encuesta al terminar una adopción o no ser elegido, opiniones desde cualquier pantalla y WhatsApp de soporte"
---

# Tasks: Encuesta al terminar una adopción o no ser elegido, opiniones desde cualquier pantalla y WhatsApp de soporte

**Input**: `specs/018-encuesta-opiniones-soporte/` — spec.md, plan.md (§Diseño, §Qué se testea),
research.md (R1–R14), data-model.md, contracts/routes.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí. Todo lo
que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola. Antes de escribir JSX o CSS se carga `frontend-design:frontend-design` y se abre
`docs/10-design-system.md`; antes de la migración y de sus tests,
`supabase:supabase-postgres-best-practices`; después de varios TSX, `vercel:react-best-practices`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Preparación, base y pulido no llevan etiqueta

---

## Fase 1: Preparación

**Propósito**: tipos, constantes y textos base.

- [ ] T001 [P] Crear `src/lib/surveys/types.ts` (`SURVEY_MOMENTS` `gave` `adopted` `not_chosen`; `SurveyOption` por momento; `SurveyOffer` `{ offerId, moment, state, newlyOffered, petId? }`; `SURVEY_TEXT_MAX = 500`) y `src/lib/feedback/types.ts` (`FEEDBACK_SCREENS` de research R9, `FEEDBACK_TEXT_MAX = 1000`, `FEEDBACK_DAILY_MAX = 5`)
- [ ] T002 [P] Sumar `SUPPORT_WHATSAPP` a `src/lib/config.ts` (de `NEXT_PUBLIC_SUPPORT_WHATSAPP`, solo dígitos, nulo si falta o vacío) y la línea vacía en `.env.example`
- [ ] T003 [P] Textos base en `messages/es.json`: `surveys.*` (las tres preguntas y sus opciones, la abierta, «Enviar», «Ahora no», gracias, errores), `feedback.*` (trigger, sheet, pie, errores, toast, nombres de pantalla), `support.*` (saludo con `{app}`, enlace), `metadata.review.feedback` y `metadata.review.surveys` (plan.md §Textos)

---

## Fase 2: Base compartida

**Propósito**: la migración y las lecturas que todas las user stories usan. Bloquea las fases 3 a 6.

- [ ] T004 Escribir `supabase/migrations/<ts>_surveys_feedback.sql`: `survey_offers`, `survey_answers`, `survey_counts` (tres filas), `private.survey_settings` (`since = now()`), `feedback`, `feedback_quota`, con RLS encendida, sin políticas y `revoke all` (data-model.md); `private.survey_option_valid`, `private.feedback_screen_valid`; el disparador `survey_offers_forward_only`; índices de data-model.md
- [ ] T005 En la misma migración: `survey_for`, `my_pets_survey` (R2, R3), `answer_survey`, `dismiss_survey` (R7), el disparador `adoptions_decline_withdraws_survey` (R5), `send_feedback` (R8, `execute` para `anon` y `authenticated`) y las cuatro `admin_*` (R12); `revoke all on function ... from public` y los `grant` justos
- [ ] T006 `pnpm exec supabase db reset` y `pnpm db:types` para regenerar `src/lib/supabase/types.ts`
- [ ] T007 [P] Test `tests/db/surveys-privacy.test.ts` (plan.md §Qué se testea): ninguna tabla nueva se lee ni escribe con `anon` ni con sesión; las `admin_*` devuelven nada a `anon`, a una persona y a quien respondió; la oferta de otra → `not_found`; `survey_answers` y `feedback` sin columnas que apunten a una persona
- [ ] T008 [P] Crear `src/lib/analytics/survey-events.ts` (+ `survey-events.test.ts`) con `survey_offered`, `survey_answered`, `survey_dismissed`, `feedback_sent`, `support_whatsapp_opened` (contracts §Eventos) y sumarlos a `src/lib/analytics/events.ts`; el test afirma que ninguno lleva texto, sujeto ni ids

**Checkpoint**: la base existe y nadie la lee por fuera de sus funciones.

---

## Fase 3: User Story 1 — La encuesta de dos preguntas en los tres desenlaces (P1) 🎯 MVP

**Goal**: quien publicó, quien adoptó y quien no fue elegida ven la encuesta de su momento en Mis
animales o Mi solicitud, como mucho una cada 30 días, y la responden o la cierran.

**Independent Test**: spec §US1 Independent Test.

### Tests de US1

- [ ] T009 [P] [US1] Test `tests/db/surveys-rules.test.ts`: cada desenlace de R3 ofrece y ningún otro cierre ofrece; anterior a `since` no; 29 días `skipped` y nunca después, 30 `pending`; dos desenlaces → uno `pending`; `my_pets_survey` con tres adopciones → una; llamar dos veces no cambia nada; «Yo no adopté» con `pending` borra y resta `offered`, con `answered` no; `answer_survey` dos veces → `already` y una respuesta; tras `dismiss_survey` → `dismissed`; opción de otro momento y 501 caracteres → `invalid`; cuenta suspendida → nada y `suspended`; borrar la cuenta que respondió deja `admin_survey_summary` igual
- [ ] T010 [P] [US1] Test `src/lib/schemas/survey.test.ts` para `surveyAnswerSchema` (opción requerida y del momento, 500/501, solo espacios = vacío, teléfono, correo, «500 caracteres» pasa)
- [ ] T011 [P] [US1] Test `src/lib/surveys/questions.test.ts` (`surveyQuestion`: clave de pregunta y opciones por momento) y `src/lib/surveys/outcomes.test.ts` (cada resultado de la base a su clave; `already` y `dismissed` son éxito)

### Implementación de US1

- [ ] T012 [P] [US1] `src/lib/schemas/survey.ts` (`surveyAnswerSchema`, con `contactMatch` de `src/lib/contact/contact-match.ts`, que rechaza solo `phone` y `email`: un enlace o un usuario de redes en una opinión no es un dato de contacto de quien la manda), `src/lib/surveys/questions.ts` y `src/lib/surveys/outcomes.ts`
- [ ] T013 [US1] `src/lib/supabase/queries/surveys.ts`: `surveyFor`, `myPetsSurvey`, `answerSurvey`, `dismissSurvey`
- [ ] T014 [US1] `src/actions/surveys.ts`: `answerSurvey` y `dismissSurvey` → `ActionResult<null>`, con los eventos y `revalidatePath` (contracts §Server Actions)
- [ ] T015 [US1] `src/components/surveys/survey-card.tsx` (cliente: `RadioGroup`, `CountedTextarea`, «Enviar» `secondary`, «Ahora no» `ghost`, gracias, errores; plan.md §Diseño La encuesta) y `src/app/[locale]/_components/survey-texts.ts`
- [ ] T016 [US1] `src/components/pets/my-pets-grid.tsx`: prop `surveys: ReadonlyMap<string, ReactNode>` (por `pet.id`, como `followUps`), arriba de la tarjeta de ese animal a todo el ancho
- [ ] T017 [US1] `src/app/[locale]/(app)/mis-animales/page.tsx`: `myPetsSurvey()` en paralelo con lo que ya trae; `SurveyCard` `gave` en `surveys` por `pet.id`; `survey_offered` si `newlyOffered`
- [ ] T018 [US1] `src/app/[locale]/(app)/mis-solicitudes/[id]/page.tsx`: `surveyFor('adopted', adopción)` o `surveyFor('not_chosen', id)` según el estado (contracts §Rutas); `SurveyCard` debajo de `AdoptionPanel` o de la nota de no aceptada o cerrada; `survey_offered` si `newlyOffered`

**Checkpoint**: la encuesta funciona en los tres momentos.

---

## Fase 4: User Story 2 — Opinar desde cualquier pantalla, con o sin sesión (P2)

**Goal**: «Opinar» arriba en todas las pantallas, con su `Sheet`, el tope del día y sin nada que una
la opinión a la persona.

**Independent Test**: spec §US2 Independent Test.

### Tests de US2

- [ ] T019 [P] [US2] Test `tests/db/feedback-rules.test.ts` (plan.md §Qué se testea: `anon` manda, `attempt_id` repetido, la sexta, otro navegador, otro día con la cuota vieja borrada, inválidos)
- [ ] T020 [P] [US2] Test `src/lib/feedback/screens.test.ts` (`feedbackScreen`), `src/lib/schemas/feedback.test.ts` (`feedbackSchema`: vacío, espacios, 1.000/1.001, teléfono, correo) y `src/lib/feedback/outcomes.test.ts`

### Implementación de US2

- [ ] T021 [P] [US2] `src/lib/feedback/screens.ts`, `src/lib/schemas/feedback.ts`, `src/lib/feedback/outcomes.ts`
- [ ] T022 [US2] `src/lib/supabase/queries/feedback.ts`: `sendFeedback`
- [ ] T023 [US2] `src/actions/feedback.ts`: `sendFeedback` (cookie `opinar`, SHA-256, `feedbackScreen` del `path`, evento) → `ActionResult<null>`
- [ ] T024 [US2] `src/components/feedback/feedback-sheet.tsx` (cliente: `Sheet`, `CountedTextarea`, «Enviar» `primary`, errores, `attemptId` por apertura; plan.md §Diseño Opinar) y `src/components/feedback/feedback-trigger.tsx` (cliente: `Button` `ghost` `sm` que importa el sheet con `import()` al primer toque)
- [ ] T025 [US2] `src/app/[locale]/_components/feedback-texts.ts` y `src/app/[locale]/_components/paper-frame.tsx` (`async`): `FeedbackTrigger` en la fila de arriba, con y sin menú; `SiteFooter` con la línea de Opinar (`src/app/[locale]/_components/site-footer.tsx`)

**Checkpoint**: Opinar funciona en todas las pantallas, con o sin sesión.

---

## Fase 5: User Story 3 — Opiniones y Encuestas para quien administra (P3)

**Goal**: quien administra lee las opiniones y las encuestas y borra una opinión; nadie más ve que
existen.

**Independent Test**: spec §US3 Independent Test.

### Tests de US3

- [ ] T026 [P] [US3] Test `src/lib/surveys/option-bars.test.ts` (`optionBars`: proporciones, la mayor marcada, empates, todo en cero sin barras)
- [ ] T027 [US3] Sumar a `tests/db/feedback-rules.test.ts` y `tests/db/surveys-rules.test.ts`: `admin_delete_feedback` por quien administra borra y por otra persona no; `admin_survey_summary` y `admin_survey_answers` devuelven cuentas y textos esperados, solo con texto, de la más nueva a la más vieja, de a `p_limit`

### Implementación de US3

- [ ] T028 [P] [US3] `src/lib/surveys/option-bars.ts`
- [ ] T029 [US3] `src/lib/supabase/queries/surveys.ts` suma `surveySummary`, `surveyAnswers`; `src/lib/supabase/queries/feedback.ts` suma `listFeedback`, `deleteFeedback`; `src/actions/feedback.ts` suma `deleteFeedback`
- [ ] T030 [P] [US3] `src/components/feedback/feedback-list.tsx` (renglones, `DestructiveConfirmDialog` con disparador `ghost`, «Ver más»)
- [ ] T031 [P] [US3] `src/components/surveys/survey-summary.tsx`, `survey-option-bars.tsx`, `survey-answer-list.tsx` (plan.md §Diseño Encuestas)
- [ ] T032 [US3] `src/app/[locale]/(app)/revision/opiniones/page.tsx`, `loading.tsx`, `error.tsx`: `noindex`; `getSessionUser` + `isAdmin` → `notFound()`; vacío «Todavía no llegó ninguna opinión.»
- [ ] T033 [US3] `src/app/[locale]/(app)/revision/encuestas/page.tsx`, `loading.tsx`, `error.tsx`: igual; vacío por momento
- [ ] T034 [US3] `src/app/[locale]/(app)/revision/page.tsx`: los caminos a Opiniones y Encuestas

**Checkpoint**: lo que se escuchó se lee, solo quien administra.

---

## Fase 6: User Story 4 — El WhatsApp de soporte en el pie (P4)

**Goal**: el pie de todas las pantallas lleva el WhatsApp de soporte cuando hay número; sin número,
nada de WhatsApp en ningún lado.

**Independent Test**: spec §US4 Independent Test.

### Tests de US4

- [ ] T035 [P] [US4] Test `src/lib/support/whatsapp.test.ts` (`supportWhatsAppUrl`: nulo sin número, el saludo codificado con `APP_NAME`, sin otros datos)

### Implementación de US4

- [ ] T036 [P] [US4] `src/lib/support/whatsapp.ts`
- [ ] T037 [US4] `src/app/api/soporte/whatsapp/route.ts`: 404 sin número; con número, `support_whatsapp_opened` con `feedbackScreen` del `Referer` y 303 a WhatsApp
- [ ] T038 [US4] `site-footer.tsx` suma el enlace (solo con número); `FeedbackSheet`, `SurveyCard` y el error del tope reciben `supportUrl: string | null` y lo nombran solo si no es nulo

**Checkpoint**: las cuatro user stories funcionan solas.

---

## Fase 7: Pulido y transversal

- [ ] T039 [P] E2E `tests/e2e/survey-feedback.spec.ts` (plan.md §Qué se testea, los dos flujos)
- [ ] T040 [P] `docs/06-i18n.md` (glosario), `docs/10-design-system.md` §Componentes (los nuevos y los que cambian), `docs/known-limitations.md` (tope por cookie, cruce de días en la beta)
- [ ] T041 `vercel:react-best-practices` sobre los TSX nuevos; revisar que Opinar no suma más de 2 KB al JS inicial de la portada
- [ ] T042 Capturas: `node scripts/walk.mjs --story encuesta-opiniones-soporte --user /mis-animales /mis-solicitudes/<id> /revision/opiniones /revision/encuestas` y una pública sin sesión
- [ ] T043 `pnpm gates:affected` y, al cerrar, `pnpm verify`; recorrer quickstart.md

---

## Dependencias y orden

- Fase 1 → Fase 2 → US1, US2, US3, US4. US3 lee lo que escriben US1 y US2, pero se prueba sola con
  datos sembrados en sus tests. US4 usa `feedbackScreen` (US2, T021) y `site-footer.tsx` (T025).
- Dentro de cada US: tests y funciones puras [P] → queries → acciones → componentes → páginas.

## Paralelo

- Fase 1: T001, T002, T003.
- Fase 2: T007 y T008 después de T006.
- US1: T009, T010, T011, T012 juntos. US2: T019, T020, T021. US3: T026, T028, T030, T031.

## Estrategia

MVP = Fases 1–3 (la encuesta). Después US2, US3 y US4, cada una con su checkpoint y
`pnpm gates:affected`.
