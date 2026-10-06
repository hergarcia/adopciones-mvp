---
description: "Tareas de la historia #63 — Solicitar la adopción de un animal con el cuestionario"
---

# Tasks: Solicitar la adopción de un animal con el cuestionario

**Input**: `specs/014-solicitar-adopcion/` — spec.md, plan.md (§Diseño, §Qué se testea),
research.md (R1–R13), data-model.md, contracts/routes.md, quickstart.md

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

**Propósito**: el cuestionario como datos, las constantes, los tipos y las rutas.

- [X] T001 [P] Crear `src/lib/applications/rules.ts` (`MAX_ACTIVE_APPLICATIONS = 3`, `ANSWER_MAX_LENGTH = 500`), `src/lib/applications/types.ts` (`ApplicationStatus` `sent` `withdrawn` `closed`, `CloseReason` con las cinco claves de data-model.md, `QuestionId`, `Answers`, `ApplyGate`, `ApplicationSummary`, `ApplicationDetail`) y `src/lib/applications/paths.ts` (`applyPath(code)`, `applySentPath(code, id)`, `MY_APPLICATIONS_PATH`, `myApplicationPath(id)`, el flag `retirada` y `tras=telefono`)
- [X] T002 [P] Crear `src/lib/applications/questionnaire.ts` con `QUESTIONS` (ids, tipo `choice`/`text`, opciones y dependencias de research R4, en el orden de FR-020)
- [X] T003 [P] Textos de `applications.questions.*` en `messages/es.json` (etiquetas, ayudas y opciones en voseo, plan.md §Copy)

---

## Fase 2: Base compartida

**Propósito**: la tabla, el nivel exigido, el cierre y la lectura que todas las user stories usan.
Bloquea las fases 3 a 6.

- [X] T004 Escribir `supabase/migrations/<ts>_applications.sql` (timestamp de hoy, después de `20261005120000`): `public.applications` con checks, índices, RLS `applications_select_own`, `revoke all`, `grant select … to authenticated`; `pets.required_level`; `identity_requests.return_pet_id` con índice; `private.application_answers_shape`, `private.application_answers_valid`, `private.pet_receives_applications`; el trigger `applications_forward_only` (data-model.md)
- [X] T005 `pnpm exec supabase db reset` y `pnpm db:types` → `src/lib/supabase/types.ts` (nunca a mano)
- [X] T006 [P] `tests/db/applications-support.ts`: personas con nivel 1 y 2, un publicador con animales en cada estado, quien administra, enviar insertando con el servicio (así una fase no depende de las funciones de otra), leer como `anon`, como otra persona, como el publicador y como quien administra
- [X] T007 [P] Test de paridad en `tests/db/applications-level.test.ts` (primera parte): `MAX_ACTIVE_APPLICATIONS`, `ANSWER_MAX_LENGTH` y los ids y opciones de `QUESTIONS` contra `application_answers_valid`
- [X] T008 Sumar `application-draft:*` a `clearAccountDrafts` en `src/lib/drafts/account-drafts.ts`, con su test en `src/lib/drafts/account-drafts.test.ts` (borra esas claves y no otras)

**Checkpoint**: la base acepta solicitudes válidas insertadas por el servicio y nadie más las lee.

---

## Fase 3: User Story 1 — Solicitar un animal con el cuestionario y verla en Mis solicitudes (P1) 🎯 MVP

**Goal**: desde la ficha, «Quiero adoptar» → ingresar y verificar el teléfono si hace falta →
cuestionario → enviada → Mis solicitudes y Mi solicitud.

**Independent Test**: spec §US1 «Independent Test».

### Tests de US1 (deben fallar primero)

- [X] T009 [P] [US1] `src/lib/schemas/application.test.ts` — plan.md §Qué se testea (schema)
- [X] T010 [P] [US1] `src/lib/applications/questionnaire.test.ts` — `visibleQuestions` y el orden
- [X] T011 [P] [US1] `src/lib/applications/apply-gate.test.ts` — todas las ramas de FR-003 en su orden
- [X] T012 [P] [US1] `src/lib/applications/submit-outcome.test.ts` — cada resultado a su clave y destino
- [X] T013 [P] [US1] `src/lib/applications/application-view.test.ts` — enviada y su sello (las ramas de cierre se suman en US4)
- [X] T014 [P] [US1] `src/lib/applications/apply-action.test.ts` — la tabla de la ficha (FR-001)
- [X] T015 [P] [US1] `src/lib/applications/draft.test.ts` — otra cuenta, vencido, forma inválida, clave por animal
- [X] T016 [P] [US1] `src/lib/analytics/application-events.test.ts` — `apply_tapped`, `apply_stopped`, `application_started`, `application_abandoned`, `application_sent`, sin identidad ni respuestas
- [X] T017 [P] [US1] `tests/db/applications-submit.test.ts` (parte US1): `sent`, `already`, `has_active`, `own`, `needs_phone`, `unavailable`, `not_receiving` (adoptada, baja, suspendido, bloqueada), `you_blocked`, `answers_invalid`
- [X] T018 [P] [US1] `tests/db/applications-privacy.test.ts`: las dos caras de FR-084, sin teléfono ni correo en ninguna lectura, permisos de las funciones

### Implementación de US1

- [X] T019 [US1] En la migración: `pet_application_view`, `apply_context`, `submit_application`, `check_application_attempt`, `my_applications`, `my_application` con sus `revoke`/`grant` (data-model.md); `db reset` y `db:types`
- [X] T020 [US1] Implementar `src/lib/schemas/application.ts` (con `contactMatch`), `visibleQuestions`, `apply-gate.ts`, `submit-outcome.ts`, `application-view.ts` (enviada), `apply-action.ts` y `draft.ts` hasta que T009–T015 pasen
- [X] T021 [US1] `src/lib/supabase/queries/applications.ts`: `applyContext`, `submitApplication`, `checkApplicationAttempt`, `listMyApplications`, `getMyApplication`, `getPetApplicationView`
- [X] T022 [US1] `src/lib/analytics/events.ts` y `application-events.ts` hasta que T016 pase; `src/app/api/solicitudes/abandono/route.ts` (valida y registra, 204)
- [X] T023 [US1] `src/actions/applications.ts`: `submitApplication`, `checkApplicationAttempt`, `trackApplicationMoment` → `ActionResult` (contracts/routes.md), pasando por `getSessionUser()`
- [X] T024 [P] [US1] Hooks `src/hooks/use-application-draft.ts`, `use-application-submit.ts`, `use-abandon-beacon.ts` (research R7, R11)
- [X] T025 [P] [US1] Componentes `src/components/applications/`: `apply-action.tsx`, `application-header.tsx`, `in-process-note.tsx`, `contact-later-note.tsx`, `question-field.tsx`, `application-form.tsx`, `application-sent.tsx`, `application-stamp.tsx`, `application-list.tsx`, `application-row.tsx`, `answer-list.tsx`, `not-receiving.tsx` — plan.md §Diseño
- [X] T026 [US1] `src/app/[locale]/(public)/animales/[code]/page.tsx`: `ApplyAction` primero en `actions` con `getPetApplicationView` (R8)
- [X] T027 [US1] `src/app/[locale]/(app)/solicitar/[code]/page.tsx` (+ `loading.tsx`, `error.tsx`, `generateMetadata` `noindex`): registra `apply_tapped`, `requireProfile`, `applyGate`, y compone cada rama; sin nivel 1 → la puerta de #10 con `reason: 'apply'` y `next` con `?tras=telefono`
- [X] T028 [US1] `src/app/[locale]/(app)/solicitar/[code]/enviada/page.tsx`
- [X] T029 [US1] `src/app/[locale]/(app)/mis-solicitudes/page.tsx` y `[id]/page.tsx` (+ `loading.tsx`, `error.tsx`, `noindex`; ajena → `notFound()`); «Mis solicitudes» en `account-menu.tsx` y en «Mi perfil»
- [X] T030 [US1] Textos `applications.{form,errors,sent,mine,detail,not_receiving,ficha}`, `metadata.applications.*`, `nav.my_applications` en `messages/es.json`; sumar las claves de los límites nuevos a `ErrorTextsProvider`
- [X] T031 [US1] Seed: los cuatro animales de Ana de quickstart.md en `supabase/seed.sql`
- [X] T032 [US1] `tests/e2e/apply.spec.ts` — plan.md §Qué se testea (E2E), salvo el retiro (US2)

**Checkpoint**: US1 se prueba sola con quickstart.md §Camino feliz.

---

## Fase 4: User Story 2 — El límite de 3, retirar una solicitud y las respuestas propuestas (P2)

**Goal**: respuestas propuestas desde la segunda, pantalla de límite con retiro, retirar desde Mi
solicitud.

**Independent Test**: spec §US2 «Independent Test».

### Tests de US2 (deben fallar primero)

- [X] T033 [P] [US2] `src/lib/applications/proposed-answers.test.ts` — FR-025 y FR-042
- [X] T034 [P] [US2] `tests/db/applications-submit.test.ts` (parte US2): `limit` con cuatro y con dos sesiones a la vez; `withdraw_application` `withdrawn`, `already_withdrawn`, `not_found`, `closed`; volver a enviar después de retirar
- [X] T035 [P] [US2] Sumar `application_withdrawn` a `src/lib/analytics/application-events.test.ts`

### Implementación de US2

- [X] T036 [US2] En la migración: `withdraw_application`; `db reset` y `db:types`
- [X] T037 [US2] `src/lib/applications/proposed-answers.ts` hasta que T033 pase; `ApplicationForm` arranca con borrador o propuestas y `ProposedAnswersNote`
- [X] T038 [US2] `withdrawApplication` en `src/actions/applications.ts` y en `queries/applications.ts`; `application_withdrawn`
- [X] T039 [P] [US2] `src/components/applications/withdraw-application-dialog.tsx`, `limit-reached.tsx`, `proposed-answers-note.tsx`; la rama `limit` de `/solicitar/{code}`; «Retirar» en Mi solicitud; `?retirada=1` en Mis solicitudes con `ScreenToast`
- [X] T040 [US2] Textos `applications.{withdraw,limit}`; el retiro en `tests/e2e/apply.spec.ts`

**Checkpoint**: US1 y US2 se prueban solas.

---

## Fase 5: User Story 3 — El publicador exige identidad verificada (P3)

**Goal**: «Quién puede solicitar» al publicar y editar, la línea en la ficha, la pantalla de
identidad antes del cuestionario y el correo de aprobación con la vuelta al animal.

**Independent Test**: spec §US3 «Independent Test».

### Tests de US3 (deben fallar primero)

- [ ] T041 [P] [US3] `tests/db/applications-level.test.ts` (segunda parte): `publish_pet`/`save_pet` con `required_level`; cambiarlo no toca las enviadas; `needs_identity` y `sent` con nivel 2; `pet_application_view` con y sin sesión; `submit_identity_request` con `p_return_code` y `resolve_identity_request` con el código; animal borrado → nulo
- [ ] T042 [P] [US3] `src/lib/schemas/pet.test.ts` y `src/lib/pets/draft.test.ts` (cambian): `requiredLevel` 1 o 2, por omisión 1; borrador viejo sin el campo

### Implementación de US3

- [ ] T043 [US3] En la migración: `publish_pet` y `save_pet` con `required_level`; `submit_identity_request` con `p_return_code` (borrar la firma vieja); `resolve_identity_request` con `return_code`; `db reset` y `db:types`
- [ ] T044 [US3] `src/lib/schemas/pet.ts`, `src/lib/pets/draft.ts`, `src/lib/pets/types.ts`, `src/actions/pets.ts`, `queries/pets.ts`: `requiredLevel`
- [ ] T045 [P] [US3] `src/components/pets/required-level-field.tsx` en `pet-fields.tsx`; `src/components/applications/required-level-line.tsx` en la ficha; `src/components/applications/identity-required.tsx` y la rama `needs_identity` de `/solicitar/{code}`
- [ ] T046 [US3] `/verificar-identidad?animal=`: la página pasa el código al formulario; `submitIdentityRequest` lo manda; `src/lib/email/send-identity-result.ts` suma «Ver a {nombre}» a `/solicitar/{code}`; `after: 'identity'` en `application_sent`
- [ ] T047 [US3] Textos `pets.form.required_level.*`, `applications.identity.*`, `emails.identity_approved.pet_button`

**Checkpoint**: US1, US2 y US3 se prueban solas.

---

## Fase 6: User Story 4 — Lo que le pasa a una solicitud cuando cambia el animal o una de las personas (P4)

**Goal**: los cierres por adopción, borrado, baja, bloqueo y suspensión, y la nota de no disponible
por ahora.

**Independent Test**: spec §US4 «Independent Test».

### Tests de US4 (deben fallar primero)

- [ ] T048 [P] [US4] `tests/db/applications-close.test.ts` — plan.md §Qué se testea (cierres)
- [ ] T049 [P] [US4] `src/lib/applications/application-view.test.ts` (parte US4): cada motivo de cierre, no disponible por ahora, sin foto cuando corresponde (FR-065)
- [ ] T050 [P] [US4] Sumar `application_closed` a `src/lib/analytics/application-events.test.ts`

### Implementación de US4

- [ ] T051 [US4] En la migración: los cuatro triggers de cierre de data-model.md y `closed_applications_since`; `db reset` y `db:types`
- [ ] T052 [US4] `application-view.ts` hasta que T049 pase; textos de los motivos en `applications.mine.*`
- [ ] T053 [US4] `src/actions/pet-status.ts`, `pets.ts` (borrar), `pet-review.ts` (baja), `moderation.ts` (bloquear, suspender): registran `application_closed` con `closedApplicationsSince` (research R11)

**Checkpoint**: las cuatro user stories se prueban solas.

---

## Fase 7: Pulido

- [ ] T054 [P] `docs/06-i18n.md` §Cuestionario: la forma `{ question_id: answer }`, con fecha
- [ ] T055 [P] `docs/10-design-system.md`: las filas que cambian (plan.md §Docs que cambian)
- [ ] T056 [P] `docs/known-limitations.md`: «le llegó a quien publicó» sin bandeja, con su condición de reapertura
- [ ] T057 Medir la ficha con sesión y sin ella contra el presupuesto de docs/07 (la consulta nueva, ningún JS nuevo)
- [ ] T058 `node scripts/walk.mjs --story solicitar-adopcion --user` con las rutas nuevas y las que cambian, a 390 y 1280 px
- [ ] T059 Recorrer quickstart.md de punta a punta, cronometrando el cuestionario (SC-001)
- [ ] T060 `pnpm verify` completo y `pnpm mutation` al 100 % sobre los archivos con test

---

## Dependencias y orden

- Fase 1 → Fase 2 → Fases 3 a 6 en orden de prioridad (US1 → US2 → US3 → US4) → Fase 7.
- US2, US3 y US4 se apoyan en el envío y en Mis solicitudes de US1.
- Todas las funciones nuevas van en la misma migración (una por PR); cada fase la extiende y corre
  `db reset`.
- Dentro de cada fase, los tests van antes de su implementación y deben fallar primero.
- [P] marca archivos distintos sin dependencias pendientes.
