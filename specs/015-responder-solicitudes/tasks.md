---
description: "Tareas de la historia #65 — Responder las solicitudes de un animal y hablar por WhatsApp al aceptar"
---

# Tasks: Responder las solicitudes de un animal y hablar por WhatsApp al aceptar

**Input**: `specs/015-responder-solicitudes/` — spec.md, plan.md (§Diseño, §Qué se testea),
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
- **[Story]**: a qué user story pertenece (US1…US5). Preparación, base y pulido no llevan etiqueta

---

## Fase 1: Preparación

**Propósito**: constantes, tipos, rutas y textos base.

- [X] T001 [P] Ampliar `src/lib/applications/types.ts` (`ApplicationStatus` suma `accepted` y `rejected`; `PublisherClose` `adopted` `unpublished` `you_blocked` `gone`; `RejectionReason`; `NoticeKind`; `PublisherApplication`, `InboxPet`, `PetApplicationRow`, `ApplicationQuestion`, `Contact`) y `src/lib/applications/rules.ts` (`MAX_QUESTIONS = 3`, `QUESTION_MAX_LENGTH = 500`, `REJECTION_NOTE_MAX_LENGTH = 200`)
- [X] T002 [P] Crear `src/lib/applications/rejection.ts` con `REJECTION_REASONS` (las siete claves de data-model.md en orden) y `REVOCATION_REASONS` (`not_concluded` primero + las siete)
- [X] T003 [P] Ampliar `src/lib/applications/paths.ts`: `INBOX_PATH`, `petInboxPath(petId)`, `publisherApplicationPath(id)`, `whatsappRoutePath(id)`, el flag `aceptada`
- [X] T004 [P] Textos base en `messages/es.json`: `nav.inbox`, `metadata.inbox.*`, `inbox.reasons.*`, `applications.status.*` nuevos (plan.md §Textos, voseo)

---

## Fase 2: Base compartida

**Propósito**: el estado nuevo, las tablas sin permisos, la bandeja de salida y las lecturas que
todas las user stories usan. Bloquea las fases 3 a 7.

- [X] T005 Escribir `supabase/migrations/<ts>_application_responses.sql` (después de `20261006120000`): el check de `status`, los índices recreados y nuevos, `applications_forward_only` con las transiciones nuevas; `application_reviews`, `application_questions`, `application_notices`, `inbox_visits` con RLS encendida, sin políticas y `revoke all` (data-model.md); `private.rejection_reasons()` para la paridad
- [X] T006 Recrear en la misma migración lo de #63 que cuenta activas como `sent` o `accepted`: `submit_application` (con el control `rejected` de R7), `apply_context`, `pet_application_view` (`my_rejected`), `withdraw_application` (retira una `accepted`), `my_applications`, `my_application` (`was_accepted`, `waiting_question`) y los cuatro triggers de cierre (cierran `accepted`; los de pet encolan, los de bloqueo y suspensión no)
- [X] T007 `pnpm exec supabase db reset` y `pnpm db:types` → `src/lib/supabase/types.ts` (nunca a mano)
- [X] T008 [P] `tests/db/application-responses-support.ts`: publicadora, dos o tres solicitantes con nivel 1, una sin teléfono, quien administra, una solicitud insertada con el servicio en cada estado, lecturas como `anon`, otra persona, la otra solicitante, el publicador y quien administra
- [X] T009 [P] Test de paridad en `tests/db/application-responses-rules.test.ts` (primera parte): `REJECTION_REASONS`, `MAX_QUESTIONS` y los topes contra la base
- [X] T010 Actualizar `src/lib/supabase/queries/applications.ts` a los estados nuevos y `my_rejected`; `src/lib/applications/application-view.ts` + test: `accepted` (`primary`), `rejected` («No aceptada», `muted`), `info_requested` (`warning`), «Esperando respuesta»
- [X] T011 [P] `src/components/applications/application-stamp.tsx`: los estados nuevos sobre `Stamp`

**Checkpoint**: lo de #63 sigue verde (`pnpm test`), con las aceptadas contando como activas.

---

## Fase 3: User Story 1 — Ver las solicitudes, aceptar una y hablar por WhatsApp (P1) 🎯 MVP

**Objetivo**: la bandeja, una solicitud, aceptar con el contacto de las dos personas y «Abrir
WhatsApp», la oferta de «En proceso», el correo de solicitud nueva y el de aceptada.

**Prueba independiente**: spec.md §US1.

### Tests de US1 (fallan primero)

- [X] T012 [P] [US1] `tests/db/application-responses-privacy.test.ts`: el contacto antes y después de aceptar, otra solicitante aceptada, quien administra, `anon`, otra persona; número a medias o recuperado → `phone` nulo; `publisher_application` y `pet_applications` de otro publicador vacías; quien solicitó no lee `application_reviews` ni `application_notices`
- [X] T013 [P] [US1] `tests/db/application-responses-rules.test.ts`: aceptar (dueño, `already_accepted`, `gone` con retirada, `publisher_needs_phone`, `applicant_needs_phone`, `closed`), una aceptada cuenta entre las 3, `first_response`
- [X] T014 [P] [US1] `tests/db/application-notices.test.ts` (primera parte): `new_application` con la regla de R6 (dos sin abrir → la tercera no; tras `visit_inbox` sí; otro animal sí), `accepted`, `claim` borra y no repite
- [X] T015 [P] [US1] Tests unitarios: `src/lib/applications/publisher-actions.test.ts`, `publisher-view.test.ts`, `days-waiting.test.ts`, `inbox-order.test.ts`, `whatsapp.test.ts`, `response-outcome.test.ts` (ramas de aceptar), `notices.test.ts` (destino y enlace por tipo), y los eventos de US1 en `src/lib/analytics/application-events.test.ts`

### Implementación de US1

- [X] T016 [US1] En la migración: `publisher_inbox`, `publisher_new_counts`, `pet_applications`, `publisher_application`, `application_contact`, `open_application`, `visit_inbox`, `accept_application`, `claim_application_notices`; `db reset` y `db:types`
- [X] T017 [P] [US1] `src/lib/supabase/queries/application-responses.ts`: las lecturas y escrituras de T016
- [X] T018 [P] [US1] Funciones puras: `src/lib/applications/publisher-actions.ts`, `publisher-view.ts`, `days-waiting.ts`, `inbox-order.ts`, `whatsapp.ts`, `response-outcome.ts`, `notices.ts`
- [X] T019 [US1] `src/lib/email/send-application-notice.ts` y `src/lib/email/drain-application-notices.ts` (con `deliverNotice`; log sin dirección ni id); textos `emails.applications.{new_application,accepted}`
- [X] T020 [US1] `src/actions/application-responses.ts`: `acceptApplication` y `markInProcessFromOffer`, con eventos, vaciado y `revalidatePath`; motivo `aceptar` en el aviso de verificación (`verification.gate.accept_*` y `parseGate`)
- [X] T021 [P] [US1] Componentes: `inbox-pet-card.tsx`, `inbox-wall.tsx`, `application-card.tsx`, `application-status.tsx`, `applicant-header.tsx`, `response-actions.tsx` (solo aceptar en esta fase), `accept-dialog.tsx`, `contact-reveal.tsx`, `in-process-offer.tsx` en `src/components/applications/` (plan.md §Diseño)
- [X] T022 [US1] Rutas `src/app/[locale]/(app)/solicitudes/` (`page`, `loading`, `error`), `animal/[petId]/` y `[id]/` con `requireProfile`, `noindex`, `notFound()` para lo ajeno, `open_application`/`visit_inbox` al cargar y los eventos `inbox_opened` / `application_opened`
- [X] T023 [US1] `src/app/api/solicitudes/[id]/whatsapp/route.ts` (R9) y `ContactReveal` en `src/app/[locale]/(app)/mis-solicitudes/[id]/page.tsx`
- [X] T024 [US1] `AccountMenu` y «Mi perfil» con «Solicitudes»; `MyPetActions` con «N solicitudes nuevas» en `/mis-animales`
- [X] T025 [US1] `submitApplication` vacía la bandeja de salida después de enviar (`src/actions/applications.ts`)
- [X] T026 [US1] Seed: una solicitud de una persona sembrada a un animal de otra (`supabase/seed.sql`); `tests/e2e/respond.spec.ts` (aceptar y ver el contacto de las dos puntas)

**Checkpoint**: US1 se prueba sola (quickstart.md 3, hasta aceptar).

---

## Fase 4: User Story 2 — Rechazar con un motivo y dejar sin efecto (P2)

**Objetivo**: rechazar con la lista de motivos, dejar sin efecto, «Tu solicitud no fue aceptada» en
la ficha y los correos de no aceptada.

**Prueba independiente**: spec.md §US2.

### Tests de US2 (fallan primero)

- [X] T027 [P] [US2] `tests/db/application-responses-rules.test.ts`: rechazar (motivos, «otro» sin línea, 201 caracteres, `accepted` → usar dejar sin efecto, `already_rejected`, `gone`), dejar sin efecto (`not_accepted`, `not_concluded` solo ahí), el rechazado no vuelve a solicitar (también re-publicado), quien solicitó no lee el motivo
- [X] T028 [P] [US2] `tests/db/application-responses-privacy.test.ts`: el contacto desaparece al dejar sin efecto
- [X] T029 [P] [US2] `tests/db/application-notices.test.ts`: `rejected` al rechazar y al dejar sin efecto, uno solo con doble toque
- [X] T030 [P] [US2] `src/lib/schemas/application-response.test.ts` (`rejectionSchema`, `revocationSchema`), `apply-action.test.ts` y `apply-gate.test.ts` con `rejected`, eventos `application_rejected` y `acceptance_revoked`

### Implementación de US2

- [X] T031 [US2] En la migración: `reject_application`, `revoke_acceptance`; `db reset` y `db:types`
- [X] T032 [P] [US2] `src/lib/schemas/application-response.ts` (`rejectionSchema`, `revocationSchema` con la detección de contacto de `src/lib/contact`)
- [X] T033 [US2] `rejectApplication` y `revokeAcceptance` en `src/actions/application-responses.ts`; textos `emails.applications.rejected`
- [X] T034 [P] [US2] `reject-sheet.tsx` y `revoke-sheet.tsx`; `response-actions.tsx` suma rechazar y dejar sin efecto
- [X] T035 [US2] `applyActionKind` / `ApplyAction` y `applyGate` con `rejected` (ficha y `/solicitar/{code}`); Mi solicitud «No aceptada» con el camino a Animales en adopción
- [X] T036 [US2] `tests/e2e/respond.spec.ts`: dejar sin efecto y ver que el contacto desaparece de las dos puntas

**Checkpoint**: US1 y US2 se prueban solas.

---

## Fase 5: User Story 3 — Pedir más información (P3)

**Objetivo**: preguntar, contestar y ver el hilo en las dos puntas, con sus correos.

**Prueba independiente**: spec.md §US3.

### Tests de US3 (fallan primero)

- [X] T037 [P] [US3] `tests/db/application-responses-rules.test.ts`: 3 preguntas, una pendiente, `not_waiting` después de aceptar, doble toque, contestar dos veces, contestar una cerrada, solo las dos personas leen el hilo
- [X] T038 [P] [US3] `tests/db/application-notices.test.ts`: `question_asked` y `question_answered`
- [X] T039 [P] [US3] `src/lib/schemas/application-response.test.ts` (`questionSchema`, `answerSchema`); eventos `question_asked` y `question_answered`; `publisher-actions.test.ts` con preguntas

### Implementación de US3

- [X] T040 [US3] En la migración: `ask_question`, `answer_question`, `application_questions_of`; `db reset` y `db:types`
- [X] T041 [P] [US3] `questionSchema` y `answerSchema` en `src/lib/schemas/application-response.ts`
- [X] T042 [US3] `askQuestion` (`src/actions/application-responses.ts`) y `answerQuestion` (`src/actions/applications.ts`); textos `emails.applications.{question_asked,question_answered}`
- [X] T043 [P] [US3] `ask-question-sheet.tsx`, `question-thread.tsx`, `answer-question-form.tsx`; `response-actions.tsx` suma preguntar
- [X] T044 [US3] Mi solicitud y Mis solicitudes con «Te preguntaron algo», el hilo y el formulario de respuesta

**Checkpoint**: US1 a US3 se prueban solas.

---

## Fase 6: User Story 4 — Lo que cambia con el animal y las personas (P4)

**Objetivo**: los cierres sobre una aceptada, sus correos y lo que ve el publicador en cada caso.

**Prueba independiente**: spec.md §US4.

### Tests de US4 (fallan primero)

- [X] T045 [P] [US4] `tests/db/application-responses-privacy.test.ts`: contacto tras adopción (sí), borrado y baja (no), retiro, bloqueo en las dos direcciones y suspensión de cada lado (no); `publisher_application` de un animal borrado sin perfil ni respuestas
- [X] T046 [P] [US4] `tests/db/application-notices.test.ts`: `closed_adopted` (aceptada y esperando), `closed_unpublished` (borrado, baja, borrar la cuenta del publicador); retirar, bloquear y suspender no escriben; borrar la cuenta de quien solicitó borra sus notices
- [X] T047 [P] [US4] `publisher-view.test.ts`: `gone` para retirada, bloqueo de quien solicitó y suspensión; `you_blocked` con bloqueo mutuo

### Implementación de US4

- [X] T048 [US4] `changePetStatus` (adoptar), `deletePet`, `resolvePetReview` (baja) y el borrado de cuenta (`src/actions/profile.ts`) vacían la bandeja de salida; el cron `src/app/api/cron/publicaciones/route.ts` también
- [X] T049 [US4] Textos `emails.applications.{closed_adopted,closed_unpublished}` y las líneas de cierre del publicador en `inbox.*`
- [X] T050 [US4] La pantalla del publicador muestra cada cierre (FR-042, FR-043) sin acciones; Mi solicitud muestra el contacto en una cerrada por adopción que estaba aceptada

**Checkpoint**: US1 a US4 se prueban solas.

---

## Fase 7: User Story 5 — La portada (P5)

- [ ] T051 [US5] `home.adopter.apply` y `home.rescuer.steps.inbox` en `messages/es.json`; `src/components/home/adopter-promise.tsx` y `rescuer-steps.tsx`

**Checkpoint**: las cinco user stories se prueban solas.

---

## Fase 8: Pulido

- [ ] T052 [P] `docs/06-i18n.md`: tildar WhatsApp y motivos de rechazo; glosario nuevo (plan.md §Docs que cambian)
- [ ] T053 [P] `docs/10-design-system.md` §Componentes: los componentes nuevos y los que pasan de reservados a construidos
- [ ] T054 [P] `docs/known-limitations.md`: KL-63-1 resuelta por #65
- [ ] T055 Medir la ficha y la portada contra el presupuesto de docs/07 (ningún JS nuevo en la zona pública)
- [ ] T056 `node scripts/walk.mjs --story responder-solicitudes --user` con las rutas nuevas y las que cambian, a 390 y 1280 px
- [ ] T057 Recorrer quickstart.md de punta a punta (SC-001: del correo al contacto en no más de 4 toques)
- [ ] T058 `pnpm verify` completo y `pnpm mutation` al 100 % sobre los archivos con test

---

## Dependencias y orden

- Fase 1 → Fase 2 → Fases 3 a 7 en orden de prioridad (US1 → US2 → US3 → US4 → US5) → Fase 8.
- US2, US3 y US4 se apoyan en la bandeja y la pantalla de una solicitud de US1; US5 solo en que
  US1 y US2 existan (la portada cuenta lo que el sitio ya hace).
- Todas las funciones nuevas van en la misma migración (una por PR); cada fase la extiende y corre
  `db reset`.
- Dentro de cada fase, los tests van antes de su implementación y deben fallar primero.
- [P] marca archivos distintos sin dependencias pendientes.

## Paralelo, por ejemplo

- US1: T012, T013, T014 y T015 juntos; después T017, T018 y T021 juntos.
- US2: T027 a T030 juntos; T032 y T034 juntos.

## Estrategia

MVP = Fases 1–3 (la bandeja y aceptar con el contacto: ya cierra KL-63-1). Cada fase siguiente se
suma sin romper la anterior; el PR sale con las cinco.
