---
description: "Tareas de la historia #206 — Camadas: mantener al día, responder, entregar y seguir cada cría"
---

# Tasks: Camadas: mantener al día, responder, entregar y seguir cada cría

**Input**: `specs/026-camadas-mantener-al-dia/` — spec.md, plan.md (§Diseño, §Qué se testea),
research.md (R1–R13), data-model.md, contracts/routes.md, quickstart.md

**Tests**: sí, y solo los de plan.md §Qué se testea; no se agrega ninguno fuera de ahí ni se saca
ninguno de ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se carga
`frontend-design:frontend-design` y se abre `docs/10-design-system.md`; antes de tocar la migración o
sus tests, `supabase:supabase-postgres-best-practices`; todo texto visible, con `sin-slop`; después de
varios TSX, `vercel:react-best-practices`. La migración es un solo archivo que cada fase completa;
después de cada cambio, `pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: las columnas, el estado calculado y el nombre de la camada que todas las user stories
usan.

- [X] T001 Crear `supabase/migrations/<ts>_litter_lifecycle.sql` con `litters.paused_at`, `expires_at` (con el relleno de `now() + private.pet_lifetime()` para las ya publicadas y su copia a las crías, FR-001), `reminder_sent_at`, `expiry_counted_at` y el índice `litters_reminder_due_idx`; `pets.resume_status` con sus dos checks y el trigger `pets_clear_resume_status`; el trigger `litters_sync_young_expiry` (data-model.md, research R1–R3)
- [X] T002 En la misma migración: `private.litter_state(l)` en el orden de R1; `publish_litter` y `save_litter` con el `expires_at` de la camada en cada cría y la cría nueva pausada en una camada pausada; `applications.litter_name` y su copia en `applications_close_on_pet_change` y `applications_close_on_pet_delete`; `delete_litter` borra las crías antes que la camada (R8)
- [X] T003 `pnpm exec supabase db reset` y `pnpm db:types`; tipos `LitterState` y `YoungState` en `src/lib/litters/types.ts`; `litterPanelPath(id)` en `src/lib/litters/paths.ts`
- [X] T004 [P] `tests/db/litter-support.ts`: sembrar crías en un estado dado, una solicitud por cría, una aceptada y una adopción, sobre `applications-support.ts` y `adoptions-support.ts`
- [X] T005 [P] `youngLabel({ name, litterName })` en `src/lib/litters/litter-words.ts` con su test en `litter-words.test.ts` (plan §Solicitudes de una cría)

**Checkpoint**: la base existe, los tipos están generados y las camadas viejas tienen vencimiento.

---

## Fase 2: User Story 1 — Responder las solicitudes de cada cría por separado (P1) 🎯 MVP

**Goal**: la bandeja agrupada por camada y por cría, aceptar y rechazar sin tocar otras crías, el
nombre de la camada en «Mis solicitudes» y en los correos, y las nuevas por cría en «Mis animales».

**Independent Test**: spec.md US1.

### Tests de US1

- [X] T006 [P] [US1] `src/lib/applications/inbox-groups.test.ts`: `groupInbox` con animales sueltos y camadas mezclados, el orden de las crías, las sumas de esperando y nuevas, una camada con una sola cría pedida y las filas en cero (R7)
- [X] T007 [P] [US1] Ampliar `tests/db/application-responses-rules.test.ts`: `publisher_inbox` trae `litter_*` y filas en cero para las crías sin solicitudes de una camada con alguna, y ninguna fila de una camada sin solicitudes; aceptar una solicitud de una cría no cambia las de otra (FR-024)
- [X] T008 [P] [US1] Ampliar `tests/db/applications-submit.test.ts`: el límite de 3 cuenta dos crías de la misma camada (FR-037, US1-8)
- [X] T009 [P] [US1] `tests/db/litter-lifecycle-privacy.test.ts` (parte bandeja): quien fue aceptada para una cría no lee por `pet_applications`, `publisher_inbox`, `publisher_application` ni `application_contact` nada de quienes pidieron otra cría; otra persona no lee la bandeja de la camada (FR-027, SC-003)

### Implementación de US1

- [X] T010 [US1] En la migración: `publisher_inbox` e `inbox_pet` con `litter_*` y las filas en cero; `my_applications`, `my_application`, `claim_application_notices` y `accept_application` con `litter_name` e `in_litter` (R7, R8, R12); `db reset` y `db:types`
- [X] T011 [P] [US1] `src/lib/applications/inbox-groups.ts` (`groupInbox`)
- [X] T012 [US1] Consultas: `publisher_inbox`/`inbox_pet` en `src/lib/supabase/queries/application-responses.ts`, `my_applications`/`my_application` en `applications.ts`, la cola de avisos en `application-response-records.ts`, con `litterName`
- [X] T013 [US1] `InboxLitterGroup` (nuevo) y `InboxPetCard` con la variante «sin solicitudes» en `src/components/applications/`; `src/app/[locale]/(app)/solicitudes/page.tsx` arma los grupos con `groupInbox`
- [X] T014 [US1] El nombre de la camada con `youngLabel` en `ApplicationPetLayout` (solicitudes de una cría), `MyApplicationCard`, `PastedApplicationCard` y la pantalla de `/mis-solicitudes/[id]`
- [X] T015 [US1] `send-application-notice.ts` y su plantilla nombran la cría y la camada (FR-038); `acceptApplication` lleva `litter: true` en `application_accepted` (R12)
- [X] T016 [US1] «Mis animales»: `YoungRows`/`YoungRow` (en `src/components/litters/`) reemplazan a `LitterYoungSummary` con nombre, sexo y las nuevas de cada cría como enlace a sus solicitudes (FR-026); `listMyLitters` trae el id de cada cría; borrar `litter-young-summary.tsx`
- [X] T017 [US1] Textos `litters.inbox` y la segunda línea de camada con `sin-slop` en `messages/es.json`
- [ ] T018 [US1] `pnpm gates:affected`

**Checkpoint**: la bandeja de una camada se responde cría por cría.

---

## Fase 3: User Story 2 — Marcar cada cría en proceso, disponible o adoptada (P2)

**Goal**: los estados de cada cría, la entrega y el seguimiento por cría, los sellos y el recuento al
día en la ficha y el listado.

**Independent Test**: spec.md US2.

### Tests de US2

- [X] T019 [P] [US2] `src/lib/litters/lifecycle.test.ts`: `actionsForYoung` por estado de cría y de camada (Edge Cases), `actionsForLitter`, `leadActionForLitter`, `needsLevelOne`
- [X] T020 [P] [US2] `src/lib/schemas/litter-status.test.ts`: acciones válidas por sujeto, `youngIds` solo en `republish`, 1 a 10
- [X] T021 [P] [US2] `tests/db/litter-lifecycle.test.ts` (parte cría): `mark_in_process` y `mark_available` sin nivel 1 y solo con la camada disponible; `mark_available` de una adoptada termina su adopción; rechazos con la camada pausada o vencida; una cría de otra persona o inexistente da `not_found` sin cambiar nada (FR-008); idempotencia y «cambió mientras tanto» (FR-009); marcar adoptada a la última deja la camada `adopted` (FR-030)
- [X] T022 [P] [US2] Ampliar `tests/db/applications-close.test.ts`: adoptar una cría cierra solo sus solicitudes con `closed_adopted` y `litter_name` (SC-004); una cría en proceso recibe solicitudes y una adoptada no
- [X] T023 [P] [US2] Ampliar `tests/db/listed-pets.test.ts`: recuento por estado (SC-005), `status` `in_process` sin disponibles, filtro de sexo con hembras adoptadas, camada pausada, vencida o adoptada fuera del listado y del total (FR-015)

### Implementación de US2

- [X] T024 [US2] En la migración: `change_young_status`; `litter_available_count` y `listed_pets` por estado (R6); `litter_by_code` con el estado de cada cría; `litter_share_card` de la adoptada; `mark_pet_adopted` con `in_litter`; `handover_candidates`, `commitment_for_email`, `claim_follow_up_events` y `follow_up_answered_for_email` con `litter_name` (R4, R8); `db reset` y `db:types`
- [X] T025 [P] [US2] `src/lib/litters/lifecycle.ts` y `src/lib/schemas/litter-status.ts`
- [X] T026 [US2] `src/lib/supabase/queries/litter-status.ts` (`changeYoungStatusRecord`) y `src/actions/litter-status.ts` (`changeYoungStatus`, con la marca `litter: 'young'` en `pet_status_changed` y la revalidación de contracts/routes.md; con una cría, `markInProcessFromOffer` usa `changeYoungStatus`: la oferta de US1-AS4 hoy cae en `change_pet_status`, que rechaza a las crías)
- [X] T027 [US2] `usePetStatus` recibe la acción del servidor y el sujeto; extraer `StatusActionList` de `PetStatusActions`, que pasa a componerlo (R10); `YoungStatusActions` (nuevo) con `EndAdoptionDialog` en «Marcar disponible» de una adoptada (FR-007)
- [X] T028 [US2] `YoungRow` suma el sello (`Stamp`) y «Acciones» con `PetStatusSheet`; «Marcar adoptada» lleva a `/mis-animales/[id]/adoptado` con el id de la cría
- [X] T029 [US2] `/mis-animales/[id]/adoptado` acepta una cría: las aceptadas de esa cría, el compromiso con `youngLabel` y la vuelta a `litterPanelPath`; `markPetAdopted` con `litter: true` en `pet_handed_over`
- [X] T030 [US2] `MyLitterPanel` y `YoungPanelRow` (nuevos) en `src/components/litters/` y la ruta `src/app/[locale]/(app)/mis-animales/camadas/[id]/` (`page.tsx`, `loading.tsx`, `error.tsx`, `noindex`) con `HandoverLine` y `FollowUpLine` por cría adoptada (FR-032)
- [X] T031 [US2] La encuesta de «dio en adopción» debajo de la fila de la cría en «Mis animales» (`surveyBeneath` también busca entre las crías, FR-043)
- [X] T032 [US2] Ficha: `YoungCard` con el sello y sin «Quiero adoptar» en la adoptada; `LitterCountLine` al día; `LitterSheet` adoptada con `PetStatusStamp` y el camino al listado; la imagen de la vista previa de la adoptada (FR-016, FR-018, FR-020)
- [X] T033 [US2] `/solicitar/[code]`: `YoungGone` con la variante «ya encontró hogar» y el camino a la ficha (FR-022)
- [X] T034 [US2] Correos de entrega, compromiso y seguimiento con `youngLabel` (`send-commitment-email.ts`, `send-follow-up-answered.ts` y el pedido de seguimiento del cron)
- [X] T035 [US2] Textos `litters.status` (acciones de cría, avisos, fallas, rechazos), `litters.panel` y los sellos en femenino con `sin-slop`
- [X] T036 [US2] `pnpm gates:affected`

**Checkpoint**: cada cría se marca, se entrega y se sigue sola; la camada se adopta entera al final.

---

## Fase 4: User Story 3 — Pausar, renovar, volver a publicar y borrar la camada entera (P3)

**Goal**: las acciones de la camada, su vencimiento, un correo por camada y «Sigue disponible».

**Independent Test**: spec.md US3.

### Tests de US3

- [X] T037 [P] [US3] `tests/db/litter-lifecycle.test.ts` (parte camada): cada fila de la tabla de data-model.md con su nivel 1; una camada de otra persona da `not_found` (FR-008); editar o cambiar una cría no corre el vencimiento (FR-010); pausar y reanudar con una en proceso y una adoptada durante la pausa (US3-1, US3-10); volver a publicar una vencida no toca las crías y una adoptada solo las elegidas, con sus adopciones terminadas; sin nivel 1 nada cambia; renovar dos veces deja 30 días
- [X] T038 [P] [US3] `tests/db/litter-renewal.test.ts`: `claim_litter_reminders` toma una camada una sola vez y no las pausadas, adoptadas, dadas de baja ni de cuentas suspendidas; `renew_by_link` de camada en cada estado y sin nivel 1; enlace vencido, alterado o de camada borrada; `reactivate_account` corre el vencimiento de la camada; y en `tests/db/pet-reminders.test.ts`, ninguna cría entra a `claim_pet_reminders` ni a `claim_pet_expiries` (SC-001)
- [X] T039 [P] [US3] `tests/db/litter-lifecycle-privacy.test.ts` (parte estados): `litter_by_code`, `litter_share_card`, `listed_pets` y las fotos de una camada pausada o vencida para anónimo, persona cualquiera y dueña (FR-019); una cría de camada pausada o vencida no recibe solicitudes nuevas y las abiertas siguen

### Implementación de US3

- [X] T040 [US3] En la migración: `change_litter_status`; `pet_renewal_links.litter_id` con el check de un sujeto; `create_litter_renewal_link`, `claim_litter_reminders`, `claim_litter_expiries`; `renew_by_link` y `renewal_link_view` con la rama de camada; `claim_pet_reminders` y `claim_pet_expiries` sin crías; `pet_lifecycle_tick` con camadas; `reactivate_account` con camadas; `litter_by_code` y `litter_share_card` con pausada y vencida (R4–R6); `db reset` y `db:types`
- [X] T041 [US3] Consultas `changeLitterStatusRecord`, `claimLitterReminders`, `claimLitterExpiries`, `createLitterRenewalLink` en `src/lib/supabase/queries/litter-status.ts`; `pet-renewal.ts` lee el sujeto del enlace
- [X] T042 [US3] `changeLitterStatus` en `src/actions/litter-status.ts` con `litter: 'litter'` en los eventos (R12)
- [X] T043 [US3] `LitterStatusActions` (nuevo) sobre `StatusActionList`; `MyLitterActions` lo compone con `PetExpiryLine` y el sello de la camada en «Mis animales»; el panel de la camada con la tirita de `leadActionForLitter`
- [X] T044 [US3] `RepublishLitterDialog` (nuevo) con `Checkbox` por cría adoptada y el aviso de #67 (R11)
- [X] T045 [US3] `src/lib/email/send-litter-reminder.ts` (con la parte común del de animales extraída si se repite) y `/api/cron/publicaciones` con los recordatorios y vencimientos de camadas, con `litter: 'litter'` en `pet_reminder_sent` y `pet_expired` (FR-042)
- [X] T046 [US3] `/sigue-disponible/[token]` y `RenewalResult` con el nombre de la camada, `noindex` como hoy y `litter: 'litter'` en `pet_renewed`/`pet_republished` (FR-012, FR-044)
- [X] T047 [US3] Ficha pausada o vencida: `PetUnavailable` con los textos de la camada; para la dueña, `HiddenFromPublicNotice` y el camino al panel (FR-019, FR-021)
- [X] T048 [US3] `deleteLitter` corre `trackApplicationClosures` y `drainApplicationNotices`, y su confirmación dice cuántas solicitudes se cierran (FR-034, FR-035)
- [X] T049 [US3] Textos `litters.status` (acciones de camada), `litters.republish`, `litters.reminder`, `litters.page.paused` y `litters.page.expired` con `sin-slop`
- [X] T050 [US3] `pnpm gates:affected`

**Checkpoint**: la camada vence, se renueva con un correo y se pausa y vuelve entera.

---

## Fase 5: User Story 4 — Quitar una cría y avisar a quienes la pidieron (P4)

**Goal**: quitar una cría desde su fila sin teléfono, con el aviso a quienes la pidieron.

**Independent Test**: spec.md US4.

### Tests de US4

- [ ] T051 [P] [US4] `tests/db/litter-lifecycle.test.ts` (parte quitar): `delete_young` sin nivel 1; quitar la única cría borra la camada; quitar la única disponible con las demás adoptadas deja la camada `adopted` (US4-4); con la camada dada de baja, solo borrar la camada
- [ ] T052 [P] [US4] Ampliar `tests/db/application-notices.test.ts`: quitar una cría deja `closed_unpublished` con `litter_name` para cada solicitud abierta, y `claim_application_notices` lo devuelve (FR-034)

### Implementación de US4

- [ ] T053 [US4] En la migración: `delete_young` (R4); `db reset` y `db:types`
- [ ] T054 [US4] `deleteYoungRecord` y `deleteYoung` (con fotos de Storage primero, `trackApplicationClosures`, `drainApplicationNotices` y la marca `litter: 'young'` en `pet_deleted`)
- [ ] T055 [US4] `RemoveYoungAction` (nuevo, sobre `DestructiveConfirmDialog` con los textos de `RemoveYoungDialog` y el número de `previewLitterRemoval`) en `YoungRow` y `YoungPanelRow`
- [ ] T056 [US4] Textos `litters.remove_young` con `sin-slop`
- [ ] T057 [US4] `pnpm gates:affected`

**Checkpoint**: las cuatro user stories andan.

---

## Fase 6: Pulido

- [ ] T058 [P] `tests/e2e/camada-vida.spec.ts`: bandeja agrupada → aceptar una solicitud de «Cría 2» → en proceso → adoptada a esa persona → la ficha dice «3 disponibles» con su sello; pausar y reanudar con una cría en proceso (plan.md §Qué se testea)
- [ ] T059 [P] `supabase/seed.sql`: la camada sembrada con solicitudes en tres crías, una aceptada, una cría en proceso y una adoptada, y una persona que pidió dos crías
- [ ] T060 `docs/10-design-system.md`: las filas nuevas y cambiadas de plan.md §Docs, y borrar la de `LitterYoungSummary`
- [ ] T061 Revisar con `vercel:react-best-practices` los TSX nuevos; `"use client"` solo en las listas de acciones, `RepublishLitterDialog` y `RemoveYoungAction`
- [ ] T062 Capturas con `node scripts/walk.mjs --story camadas-mantener-al-dia --user /mis-animales /solicitudes /mis-solicitudes` y el panel y la ficha de la camada sembrada, a 390 y 1280
- [ ] T063 `pnpm verify` una vez, completo

---

## Dependencias y orden

- Fase 1 bloquea todo. US1 → US2 (marcar adoptada elige entre las aceptadas de US1 y suma sello a la
  fila de US1) → US3 (las acciones de camada reusan `StatusActionList` de US2 y respetan el estado de
  cada cría) → US4 (quitar va en las filas de US1 y US2). Cada fase se puede probar con la camada
  sembrada por `tests/db/litter-support.ts` (T004) aunque la anterior no tenga UI.
- Dentro de cada fase: tests primero (fallan), migración, consultas, acciones, componentes, textos.
- Las tareas [P] tocan archivos distintos y no dependen de otra sin terminar.
