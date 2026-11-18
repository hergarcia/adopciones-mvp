---
description: "Tareas de la historia #292 — Sumarle al cuestionario de un animal una pregunta mía, la que hoy hago por WhatsApp"
---

# Tasks: Sumarle al cuestionario de un animal una pregunta mía, la que hoy hago por WhatsApp

**Input**: `specs/038-pregunta-propia-cuestionario/` — spec.md, plan.md (§Diseño), research.md
(R1–R11), data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: sí, y solo los de research R11; no se agrega ninguno fuera de ahí ni se saca ninguno de
ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se carga
`frontend-design:frontend-design` y se abre `docs/10-design-system.md`; antes de tocar la migración o
sus tests, `supabase:supabase-postgres-best-practices`; todo texto visible, con `sin-slop`; después de
varios TSX, `vercel:react-best-practices`. La migración es un solo archivo; después de cada cambio,
`pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US5). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: las columnas, la regla de la cría, el largo con paridad y los tipos que usan las cinco
partes.

- [X] T001 Crear `supabase/migrations/20261118120000_own_questions.sql` con `private.own_question_max_length()`, `own_question` en `public.pets` (con el `check` de largo y recorte y `litter_id is null or own_question is null`) y en `public.litters`, `own_question`/`own_answer` en `public.applications` y en `public.held_applications` con sus `check` (las dos o ninguna, largos, no solo espacios), `held_applications_answers_while_waiting` extendido y `private.pet_own_question(p public.pets)` (data-model.md, research R1, R2)
- [X] T002 `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T003 [P] `src/lib/applications/rules.ts`: `OWN_QUESTION_MAX_LENGTH = 200`, y su paridad con `private.own_question_max_length()` en `tests/db/own-questions-rules.test.ts` (que se crea acá con ese único caso)
- [X] T004 [P] `tests/db/own-questions-support.ts`: sembrar sobre el soporte de solicitudes y de camadas una rescatista con un animal sin pregunta, uno con pregunta y una camada con pregunta y dos crías; dos solicitantes con el teléfono verificado; quien administra; una persona sin relación; leer las tablas con el cliente de servicio

**Checkpoint**: la base existe, los tipos están generados y todo compila.

---

## Fase 2: User Story 1 — La pregunta de Kira, contestada y leída en la solicitud (P1) 🎯 MVP

**Goal**: escribir la pregunta de un animal al publicar y al editar, contestarla en el cuestionario y
leerla en la solicitud de los dos lados.

**Independent Test**: spec.md US1.

### Tests de US1

- [X] T005 [P] [US1] `src/lib/schemas/pet.test.ts`: `ownQuestion` vacía o solo espacios es `null`, se recorta, 200 pasa y 201 da `pets.errors.own_question_too_long` sin cortar el texto, teléfono, correo y enlace dan `pets.errors.contact_*` en `ownQuestion`
- [X] T006 [P] [US1] `src/lib/applications/questionnaire.test.ts`: con `ownQuestion` el paso `own_question` va justo antes de `why_this_pet` (también con las condicionales que aparecen y se van), sin pregunta la lista es la de hoy; `stepOf` y `lastAnswered` con el paso
- [X] T007 [P] [US1] `src/lib/schemas/application.test.ts`: con pregunta, la respuesta propia vacía, solo espacios, 501, teléfono, correo o enlace da su error en `own_question` y todas a la vez con las demás; sin pregunta se ignora; devuelve `{ answers, ownAnswer }` sin la propia dentro de `answers`
- [X] T008 [P] [US1] `src/lib/applications/answer-words.test.ts`: con pregunta contestada, el renglón va antes de «¿Por qué?» con la pregunta guardada como etiqueta; sin ella, la lista de hoy
- [X] T009 [P] [US1] `tests/db/own-questions-privacy.test.ts`: sin sesión y como otra persona, `listed_pets`, `pet_by_code`, `pet_share_card` y el perfil público no traen la pregunta; otra persona no lee `pets.own_question`; quien publicó lee la suya; `my_application` y `publisher_application` devuelven la pregunta contestada y la respuesta solo a sus dos puntas; ninguna función de administrar devuelve `own_answer`
- [X] T010 [P] [US1] `tests/db/own-questions-rules.test.ts`: `publish_pet` y `save_pet` guardan, cambian y sacan la pregunta (vacía es nula); `submit_application` con la misma pregunta guarda pregunta y respuesta; con la pregunta y sin respuesta, o con una de 501, da `answers_invalid`; sin pregunta en el animal ignora lo recibido; reintentar con el mismo intento da `already` y una sola fila; `publish_pet` con el mismo intento deja una sola publicación con su pregunta (FR-007); las respuestas propuestas (`apply_context.last_answers`) no traen la respuesta propia

### Implementación de US1

- [X] T011 [US1] En la migración: `publish_pet` y `save_pet` redefinidas con `own_question` (research R8); `submit_application` (`drop` + `create`) con `p_own_question`, `p_own_answer`, el chequeo entero de R3 (el cliente aprende a mostrar `question_changed` en US3; hasta entonces cae en el error de siempre) y la columna `own_question` en lo que devuelve; `apply_context`, `my_application` y `publisher_application` (`drop` + `create`, mismos permisos) con `own_question`/`own_answer`; `db reset` y `db:types`
- [X] T012 [P] [US1] `src/lib/pets/types.ts` y `src/lib/schemas/pet.ts`: `ownQuestion` en `PetFormValues`, `PET_FIELDS` y el schema (research R8)
- [X] T013 [P] [US1] `src/lib/applications/questionnaire.ts`, `src/lib/schemas/application.ts`, `src/lib/applications/answer-words.ts` y `src/lib/applications/types.ts`: el paso virtual, la validación y el renglón (research R4, R6)
- [X] T014 [US1] `src/lib/supabase/queries/pets.ts` (`getMyPet` con `own_question`), `src/actions/pets.ts` (`p_fields.own_question`), `src/hooks/use-pet-draft.ts` (lo que se recupera trae la pregunta)
- [X] T015 [US1] `src/components/pets/own-question-field.tsx` sobre `CountedTextarea` y `src/components/pets/pet-fields.tsx` con el campo en `end`, después de `RequiredLevelField` (plan §Diseño); `PetForm` le pasa textos, valor, error e id
- [X] T016 [US1] `src/lib/supabase/queries/applications.ts` (`getApplyScreen` con `ownQuestion`, `submitApplicationRecord` con los dos parámetros y la columna nueva, `getMyApplication` con la pregunta contestada) y `src/actions/applications.ts` (`submitApplication` manda `ownQuestion` y `ownAnswer`)
- [X] T017 [US1] `src/hooks/use-questionnaire-steps.ts`, `src/components/applications/question-field.tsx` (`kind: 'own'` con «La pregunta de {name}») y `src/components/applications/application-form.tsx` (`ownQuestion` y `ownAnswer` en el estado; el nombre de quien publicó llega en `texts.ownLabel`)
- [X] T018 [US1] `src/app/[locale]/(app)/solicitar/[code]/page.tsx`: pasa `ownQuestion` (y el nombre de quien publicó, en los textos) solo a la rama del cuestionario
- [X] T019 [US1] `src/lib/supabase/queries/application-responses.ts` (`getPublisherApplication` con la pregunta contestada) y las páginas `solicitudes/[id]/page.tsx` y `mis-solicitudes/[id]/page.tsx`: el renglón en `AnswerList`
- [X] T020 [US1] `messages/es.json`: `pets.form.own_question.*`, `pets.errors.own_question_too_long`, `applications.own_question.label` (contracts §Textos), escritos con `sin-slop`
- [X] T021 [US1] `supabase/seed.sql`: un animal sembrado con pregunta, para el e2e y las capturas
- [X] T022 [US1] `tests/e2e/pregunta-propia.spec.ts`: publicar con pregunta, ver que la ficha no la muestra, solicitar como otra persona contestándola y abrir la solicitud de los dos lados; la pantalla de identidad pedida de un animal con pregunta no la contiene

**Checkpoint**: un animal con pregunta se solicita contestándola y se lee de los dos lados.

---

## Fase 3: User Story 2 — La pregunta de una camada vale para cada cría (P2)

**Goal**: la pregunta al publicar y al editar una camada, contestada en el cuestionario de cada cría.

**Independent Test**: spec.md US2.

### Tests de US2

- [X] T023 [P] [US2] `src/lib/schemas/litter.test.ts`: `ownQuestion` con las mismas reglas que la del animal
- [X] T024 [P] [US2] `tests/db/own-questions-rules.test.ts` (camadas): `publish_litter` y `save_litter` guardan, cambian y sacan; una cría (también una sumada después) contesta la de la camada en `submit_application`; guardar una pregunta en una cría falla por el `check`; `litter_by_code` no la trae a nadie (en `own-questions-privacy.test.ts`)

### Implementación de US2

- [X] T025 [US2] En la migración: `publish_litter` y `save_litter` redefinidas con `own_question`; `submit_application` y `apply_context` leen `private.pet_own_question` (ya lo hacen si T011 lo usó; verificar con la cría); `db reset` y `db:types`
- [X] T026 [P] [US2] `src/lib/schemas/litter.ts`, `src/hooks/use-litter-values.ts`, `src/hooks/use-litter-draft.ts`: `ownQuestion` (los dos hooks no cambian: `change` ya acepta cualquier campo de `LitterFormValues` y lo escrito hereda `ownQuestion` de `PET_DRAFT_FIELDS` desde la US1)
- [X] T027 [US2] `src/lib/supabase/queries/litters.ts` (`getLitterForEdit` con `own_question`) y `src/actions/litters.ts` (`p_fields.own_question`)
- [X] T028 [US2] `src/components/litters/litter-apply-fields.tsx` y `src/components/litters/litter-form.tsx`: `OwnQuestionField` después de `DeliveryDateField`
- [X] T029 [US2] `supabase/seed.sql`: una camada sembrada con pregunta

**Checkpoint**: la camada pregunta en el cuestionario de cada cría.

---

## Fase 4: User Story 3 — Cambiar o sacar la pregunta sin romper lo que llegó (P3)

**Goal**: «Llegó antes de tu pregunta», la pregunta contestada intacta después de cambiar o sacar, la
pregunta cambiada al enviar y la solicitud que espera la identidad.

**Independent Test**: spec.md US3.

### Tests de US3

- [X] T030 [P] [US3] `src/lib/applications/submit-outcome.test.ts` y `held-outcome.test.ts`: `question_changed` da `applications.errors.question_changed` con `detail.ownQuestion`
- [X] T031 [P] [US3] `src/lib/applications/draft.test.ts`: un borrador con `own` se lee; uno sin `own` sigue sirviendo; `own` con otra forma rompe el borrador como hoy
- [X] T032 [P] [US3] `src/lib/applications/answer-words.test.ts` (antes): sin respuesta y con `asksNow`, el renglón «Tu pregunta…» / «Llegó antes de tu pregunta» en el mismo lugar; sin `asksNow`, nada
- [X] T033 [P] [US3] `tests/db/own-questions-rules.test.ts` (cambios): con otra pregunta, con una nueva cuando no había, y con la que volvió al texto contestado; `question_changed` no guarda nada y devuelve la de hoy; cambiar y sacar no tocan `own_question`/`own_answer` de las que llegaron; `asks_now` con y sin pregunta hoy; `hold_application` guarda la pregunta y da `question_changed` igual; al salir copia pregunta y respuesta, y una escrita sin pregunta sale sin ella; al no salir quedan nulas
- [X] T034 [P] [US3] `tests/db/own-questions-privacy.test.ts` (antes): `my_application` no devuelve `asks_now`

### Implementación de US3

- [X] T035 [US3] En la migración: `hold_application` (`drop` + `create`) con los dos parámetros y la columna; `private.release_held_applications` copia las dos columnas; `private.lapse_held_applications` las pone en nulo; `publisher_application` con `asks_now`; `db reset` y `db:types`
- [X] T036 [P] [US3] `src/lib/applications/submit-outcome.ts`, `held-outcome.ts`, `draft.ts` y `answer-words.ts`: lo que prueban T030–T032
- [X] T037 [US3] `src/lib/supabase/queries/applications.ts` (`holdApplicationRecord`) y `src/actions/applications.ts` (`holdApplication` con la pregunta)
- [X] T038 [US3] `src/hooks/use-application-submit.ts`, `src/hooks/use-application-draft.ts` y `src/components/applications/application-form.tsx`: con `question_changed`, la pregunta nueva, `previousOwnAnswer`, el paso y el foco; el borrador con `own` (research R4, R5)
- [X] T039 [US3] `src/components/applications/changed-question-note.tsx` (el aviso y «Lo que habías escrito», plan §Diseño)
- [X] T040 [US3] `solicitudes/[id]/page.tsx`: «Llegó antes de tu pregunta» con `asks_now`
- [X] T041 [US3] `messages/es.json`: `applications.own_question.{changed,previous,before,yours}` y `applications.errors.question_changed`, con `sin-slop`

**Checkpoint**: cambiar o sacar la pregunta nunca cambia lo que se lee de una solicitud que llegó.

---

## Fase 5: User Story 4 — Lo que preguntan quienes publican, en Encuestas (P4)

**Goal**: la sección de Encuestas con el conteo y la lista, sin persona ni animal.

**Independent Test**: spec.md US4.

### Tests de US4

- [X] T042 [P] [US4] `tests/db/own-questions-rules.test.ts` (resumen): cuenta animales sin camada y camadas disponibles, en proceso, en pausa y vencidas; no cuenta adoptadas, dadas de baja ni de cuentas suspendidas; una camada una vez; las preguntas en orden alfabético
- [X] T043 [P] [US4] `tests/db/own-questions-privacy.test.ts` (resumen): sin administrar, cero filas
- [X] T044 [P] [US4] `src/lib/surveys/own-questions.test.ts`: el tramo que se ve, «Ver más» solo si quedan, los ids por posición, el conteo para el texto

### Implementación de US4

- [X] T045 [US4] En la migración: `public.admin_own_question_summary()` con sus permisos (research R7); `db reset` y `db:types`
- [X] T046 [P] [US4] `src/lib/surveys/own-questions.ts` y `src/lib/supabase/queries/own-questions.ts` (`null` si falla)
- [X] T047 [US4] `src/components/surveys/survey-answer-list.tsx` (`meta` optativo), `revision/encuestas/_components/shown-lists.ts` (clave `preguntas`), `revision/encuestas/_components/own-questions.tsx` y `revision/encuestas/page.tsx`
- [X] T048 [US4] `messages/es.json`: `surveys.own_questions.*`, con `sin-slop`

**Checkpoint**: quien administra lee qué se pregunta sin ver a nadie.

---

## Fase 6: User Story 5 — Medir si la pregunta ahorra la charla (P5)

**Goal**: el sí o el no en los seis momentos y la lectura 14.

**Independent Test**: spec.md US5.

### Tests de US5

- [X] T049 [P] [US5] `src/lib/analytics/pet-events.test.ts`: `pet_published` y `pet_edited` llevan `own_question`
- [X] T050 [P] [US5] `src/lib/analytics/application-events.test.ts` y `measured-levels.test.ts`: `application_sent` lleva `own_question` (también el de la que sale sola, desde el momento de la base); `application_accepted`, `application_rejected` y `application_first_response` lo llevan si se pudo leer y no lo llevan si no; ninguno lleva el texto
- [X] T051 [P] [US5] `tests/db/own-questions-rules.test.ts` (medición): `application_measure` devuelve `own_question`; el momento de una que sale sola lo trae

### Implementación de US5

- [X] T052 [US5] En la migración: `held_application_moments.own_question`, `release_held_applications` lo llena, `claim_held_application_moments` y `application_measure` (`drop` + `create`, mismos permisos); `db reset` y `db:types`
- [X] T053 [US5] `src/lib/analytics/events.ts`, `pet-events.ts`, `measured-levels.ts`, `application-events.ts`: las propiedades nuevas y `PetField` con `ownQuestion`
- [X] T054 [US5] `src/actions/pets.ts`, `src/actions/litters.ts`, `src/actions/applications.ts`, `src/actions/application-responses.ts` y `src/lib/supabase/queries/held-moments.ts`: pasar el dato
- [X] T055 [US5] `docs/03-mvp-features.md` §Métricas de éxito: la lectura 14 (research R10), escrita con `sin-slop`

**Checkpoint**: las cinco partes andan y todas las pruebas pasan.

---

## Fase 7: Pulido

- [ ] T056 [P] `docs/10-design-system.md`: filas de `OwnQuestionField` y `ChangedQuestionNote`, y las variantes nuevas de `QuestionField`, `AnswerList`, `PetFields`, `LitterApplyFields` y `SurveyAnswerList`
- [ ] T057 [P] Revisar con `sin-slop` todos los textos nuevos de `messages/es.json`
- [ ] T058 `vercel:react-best-practices` sobre los TSX tocados
- [ ] T059 `node scripts/walk.mjs --story 292-pregunta-propia --user` sobre publicar, el cuestionario con la pregunta, una solicitud recibida con y sin respuesta, «Mi solicitud» y Encuestas, a 390 y 1280 px
- [ ] T060 `pnpm gates:affected` verde (la migración corre la suite entera) y Stryker al 100 % sobre lo que tiene test

---

## Dependencias

- Fase 1 bloquea todo. US1 → US2 → US3 → US4 → US5 en ese orden: US2 suma la camada a lo que US1
  construye para el animal, US3 cambia el envío que arma US1, US4 lee lo que guardan US1 y US2, y US5
  mide lo que hacen las cuatro.
- Dentro de cada fase, los tests [P] se escriben primero y fallan; después la implementación.
- `messages/es.json` se toca en una tarea por fase para no pisarse. La migración, en una tarea por
  fase.

## Paralelo por fase

- US1: T005–T010 juntos; después T012 y T013 juntos.
- US2: T023 y T024 juntos; T026 mientras corre T025.
- US3: T030–T034 juntos; T036 mientras corre T035.
- US4: T042–T044 juntos; T046 mientras corre T045.
- US5: T049–T051 juntos.

## Estrategia

MVP = Fase 1 + US1: ya reemplaza la pregunta de WhatsApp para un animal. Cada fase siguiente se
verifica con su Independent Test antes de pasar a la otra.
