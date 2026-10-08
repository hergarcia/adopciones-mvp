---
description: "Tareas de la historia #67 — Marcar a quién se entregó cada animal y aceptar entre los dos el compromiso de adopción"
---

# Tasks: Marcar a quién se entregó cada animal y aceptar entre los dos el compromiso de adopción

**Input**: `specs/016-entrega-compromiso-adopcion/` — spec.md, plan.md (§Diseño, §Qué se testea),
research.md (R1–R12), data-model.md, contracts/routes.md, quickstart.md

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

**Propósito**: tipos, rutas y textos base.

- [ ] T001 [P] Crear `src/lib/adoptions/types.ts` (`AdoptionKind` `site` `outside`; `AdoptionRow` de `adoption_of`; `PetAdoptionSummary` de `my_pet_adoptions`; `HandoverCandidate`; `AdoptionState` `pending` `accepted` `declined` `ended`; `HandoverOutcome`, `CommitmentOutcome`) y `src/lib/adoptions/paths.ts` (`handoverPath(petId, volver)`, que acepta solo `/mis-animales` o `/mis-animales/{id}`)
- [ ] T002 [P] Ampliar `src/lib/applications/types.ts`: `close_reason` suma `handed_over`; `PublisherClose` suma `handed_over`; `NoticeKind` suma `adoption_marked`, `commitment_accepted`, `adoption_declined`; `MyApplication` suma `adoption`
- [ ] T003 [P] Textos base en `messages/es.json`: `metadata.handover.*`, `adoptions.commitment.clauses.*` (el texto de FR-010, voseo, con `{pet}`, `{adopter}`, `{publisher}`, `{sex}`), `applications.status.handed_over` y `handed_over_ended`, `applications.contact.unavailable` (plan.md §Textos)

---

## Fase 2: Base compartida

**Propósito**: la tabla, los motivos y tipos nuevos, el contacto del par y las lecturas que todas
las user stories usan. Bloquea las fases 3 a 6.

- [ ] T004 Escribir `supabase/migrations/<ts>_adoptions.sql` (después de `20261007120000`): `public.adoptions` con sus checks, índices, RLS encendida sin políticas y `revoke all`, y `adoptions_forward_only` (data-model.md); `handed_over` en `applications_close_reason_valid` y la excepción `handed_over → adopted` en `applications_forward_only`; los tres `kind` nuevos en `application_notices_kind_valid`
- [ ] T005 En la misma migración: `handover_pet`, `handover_candidates`, `my_pet_adoptions`, `adoption_of`; recrear `my_applications`, `my_application` (`adoption`), `publisher_application` (`handed_over`) y `application_contact` con la regla de R4
- [ ] T006 `pnpm exec supabase db reset` y `pnpm db:types` → `src/lib/supabase/types.ts` (nunca a mano)
- [ ] T007 [P] `tests/db/adoptions-support.ts`: publicadora, dos personas con la solicitud aceptada a un animal, una esperando, otra persona, quien administra; marcar con el servicio; lecturas como `anon`, otra persona, la otra aceptada, la publicadora, la elegida y quien administra
- [ ] T008 [P] `src/lib/supabase/queries/adoptions.ts`: `handoverPet`, `handoverCandidates`, `myPetAdoptions`, `adoptionOf` (las de escritura llegan con cada US); `src/lib/supabase/queries/applications.ts` y `application-responses.ts` con los campos nuevos
- [ ] T009 [P] `src/components/applications/application-stamp.tsx` con «Adoptaste» (`primary`) y «Adopción terminada» (`muted`); `src/lib/applications/application-view.ts` + su test con `handed_over`
- [ ] T010 [P] `src/components/applications/contact-reveal.tsx` con la variante `unavailable` («El contacto ya no está disponible.», sin número ni botón ni fondo verde)

**Checkpoint**: lo de #63 y #65 sigue verde (`pnpm test`).

---

## Fase 3: User Story 1 — Marcar adoptado eligiendo a quién se entregó (P1) 🎯 MVP

**Objetivo**: la pantalla «¿A quién se lo diste?», el compromiso de quien publicó, la adopción, el
cierre de las otras sin teléfono, por fuera del sitio y el correo «Adoptaste a …».

**Prueba independiente**: spec.md §US1.

### Tests de US1 (fallan primero)

- [ ] T011 [P] [US1] `src/lib/adoptions/commitment.test.ts`: `commitmentClauses` con y sin castración, en orden
- [ ] T012 [P] [US1] `tests/db/adoptions-rules.test.ts` (primera parte): marcar exige aceptada de ese animal y publicador (`sent`, `rejected`, `withdrawn`, ajena → rechazo; `gone`, `you_blocked`, `revoked`); `change_pet_status('mark_adopted')` → `changed`; mismo `attempt_id` → una fila y `already`; segundo intento distinto → `changed`; elegida `handed_over` y fuera de las 3 activas; las otras `adopted`; `includes_neuter` fijo al editar el animal; por fuera sin datos de persona (el check rechaza)
- [ ] T013 [P] [US1] `tests/db/adoptions-privacy.test.ts` (primera parte): `handover_candidates`, `my_pet_adoptions`, `adoption_of` vacías para `anon`, otra persona, la otra aceptada y quien administra; la tabla no se lee con ninguna sesión; el contacto lo lee el par y no la aceptada no elegida ni nadie con por fuera
- [ ] T014 [P] [US1] `tests/db/application-notices.test.ts` (suma): marcar a una persona → `adoption_marked` para ella y `closed_adopted` para las demás; por fuera → solo `closed_adopted`
- [ ] T015 [P] [US1] Tests unitarios: `src/lib/adoptions/handover-line.test.ts`, `src/lib/adoptions/outcomes.test.ts` (`handoverOutcome`), `src/lib/schemas/adoption.test.ts` (`handoverSchema`), `src/lib/analytics/adoption-events.test.ts` (`pet_handed_over`), `src/lib/applications/notices.test.ts` (`adoption_marked`)

### Implementación de US1

- [ ] T016 [US1] En la migración: `mark_pet_adopted` (R3) y el cambio de `change_pet_status` (`mark_adopted` → `changed`); `db reset` y `db:types`
- [ ] T017 [P] [US1] `src/lib/adoptions/commitment.ts`, `handover-line.ts`, `outcomes.ts` (`handoverOutcome`); `src/lib/schemas/adoption.ts` (`handoverSchema`); `src/lib/analytics/adoption-events.ts` y `events.ts` (`pet_handed_over`)
- [ ] T018 [US1] `markPetAdopted` en `src/lib/supabase/queries/adoptions.ts` y la acción en `src/actions/adoptions.ts` (contracts §Server Actions): eventos, `drainApplicationNotices`, `revalidatePath` de las dos puntas
- [ ] T019 [P] [US1] `src/components/adoptions/commitment-text.tsx` (sobre `commitmentClauses`), `handover-candidate.tsx` y `handover-form.tsx` (plan.md §Marcar adoptado: los dos pasos, por fuera, vacío, errores, `attemptId`, aviso al volver)
- [ ] T020 [US1] `src/app/[locale]/(app)/mis-animales/[id]/adoptado/page.tsx`, `loading.tsx`, `error.tsx` (`requireProfile`, `noindex`, `notFound` ajeno, `redirect` si no se puede marcar)
- [ ] T021 [US1] `src/components/pets/pet-status-actions.tsx`: «Marcar adoptado» como `LinkButton` a `handoverHref`; `my-pet-actions.tsx` y `my-pet-panel.tsx` con `src/components/adoptions/handover-line.tsx`; `mis-animales/page.tsx` y `mis-animales/[id]/page.tsx` traen `myPetAdoptions` y arman las props
- [ ] T022 [US1] `src/app/[locale]/(app)/solicitudes/[id]/page.tsx` con `src/components/adoptions/handover-summary.tsx`; las otras cerradas por adopción sin `ContactReveal`
- [ ] T023 [US1] Correo `adoption_marked` en `emails.applications.adoption_marked.*` y su destino en `src/lib/applications/notices.ts`
- [ ] T024 [US1] Seed: una solicitud aceptada de una persona sembrada a un animal de otra en `supabase/seed.sql`

**Checkpoint**: US1 se prueba sola (spec.md §US1, Independent Test).

---

## Fase 4: User Story 2 — La persona que adoptó acepta el compromiso y las dos lo reciben (P2)

**Objetivo**: el compromiso en Mi solicitud, aceptarlo, el correo con el texto completo a las dos,
las fechas en todas las pantallas y Mis solicitudes.

**Prueba independiente**: spec.md §US2.

### Tests de US2 (fallan primero)

- [ ] T025 [P] [US2] `tests/db/adoptions-rules.test.ts` (suma): aceptar solo quien adoptó, solo pendiente, vigente y sin corte, no con la cuenta suspendida; dos veces → `already`; las fechas no vuelven atrás
- [ ] T026 [P] [US2] `tests/db/application-notices.test.ts` (suma): aceptar → dos `commitment_accepted`, una por persona, y una sola vez con doble toque
- [ ] T027 [P] [US2] Tests unitarios: `src/lib/adoptions/adoption-view.test.ts` (pendiente y aceptado por lado), `outcomes.test.ts` (`commitmentOutcome`), `src/lib/schemas/adoption.test.ts` (`commitmentActionSchema`), `adoption-events.test.ts` (`commitment_accepted`), `notices.test.ts` (`commitment_accepted` por lado), `src/lib/email/notice-email-template.test.ts` (`lines`, escapa HTML)

### Implementación de US2

- [ ] T028 [US2] En la migración: `accept_commitment` y `commitment_for_email` (R5, R7); `db reset` y `db:types`
- [ ] T029 [P] [US2] `src/lib/adoptions/adoption-view.ts`; `commitmentOutcome` en `outcomes.ts`; `commitmentActionSchema`; el evento `commitment_accepted`
- [ ] T030 [US2] `acceptCommitment` en queries y en `src/actions/adoptions.ts`
- [ ] T031 [US2] `src/lib/email/notice-email-template.ts` con el extra `lines`; `src/lib/email/send-commitment-email.ts`; `send-application-notice.ts` deriva `commitment_accepted`; textos `emails.applications.commitment_accepted.*`
- [ ] T032 [P] [US2] `src/components/adoptions/commitment-dates.tsx`, `adoption-panel.tsx`, `accept-commitment-button.tsx`
- [ ] T033 [US2] `src/app/[locale]/(app)/mis-solicitudes/[id]/page.tsx` con `AdoptionPanel`; `mis-solicitudes/page.tsx` y `my-application-card.tsx` con el sello y «Compromiso pendiente»; las fechas en `HandoverLine` y `HandoverSummary`
- [ ] T034 [US2] `tests/e2e/handover.spec.ts`: marcar eligiendo, aceptar el compromiso, las dos fechas, el correo en `.artifacts/mail/` sin teléfono

**Checkpoint**: US1 y US2 se prueban solas.

---

## Fase 5: User Story 3 — «Yo no adopté a <nombre>» (P3)

**Objetivo**: deshacer la adopción desde Mi solicitud, el correo al publicador y lo que ve cada
una.

**Prueba independiente**: spec.md §US3.

### Tests de US3 (fallan primero)

- [ ] T035 [P] [US3] `tests/db/adoptions-rules.test.ts` (suma): «Yo no adopté» solo quien adoptó, solo pendiente, vigente y sin corte, no suspendida; pasa la solicitud a `adopted`; dos veces → `already`
- [ ] T036 [P] [US3] `tests/db/adoptions-privacy.test.ts` (suma): después de «Yo no adopté», el contacto no se lee y quien lo dijo deja de leer `adoption_of`
- [ ] T037 [P] [US3] `tests/db/application-notices.test.ts` (suma): un `adoption_declined`; unitarios: `adoption-view.test.ts` (deshecha), `handover-line.test.ts` (deshecha), `adoption-events.test.ts` (`adoption_declined`), `notices.test.ts` (`adoption_declined`)

### Implementación de US3

- [ ] T038 [US3] En la migración: `decline_adoption`; `db reset` y `db:types`
- [ ] T039 [US3] `declineAdoption` en queries y en `src/actions/adoptions.ts`; el evento
- [ ] T040 [P] [US3] `src/components/adoptions/decline-adoption-dialog.tsx` en `AdoptionPanel`; textos `adoptions.decline.*` y `emails.applications.adoption_declined.*`

**Checkpoint**: US1 a US3 se prueban solas.

---

## Fase 6: User Story 4 — Volver a publicar y el contacto cortado (P4)

**Objetivo**: la confirmación al volver a publicar, el final de la adopción, y el corte por bloqueo
o suspensión que no vuelve.

**Prueba independiente**: spec.md §US4.

### Tests de US4 (fallan primero)

- [ ] T041 [P] [US4] `tests/db/adoptions-rules.test.ts` (suma): volver a publicar pone `ended_at`; una nueva adopción del mismo animal tiene su fila; borrar la cuenta de quien adoptó deja la fila sin persona; borrar el animal la borra; con el contacto cortado no se acepta ni se deshace
- [ ] T042 [P] [US4] `tests/db/adoptions-privacy.test.ts` (suma): el contacto no se lee después de terminar, de un bloqueo en cada dirección y de una suspensión de cada lado, **ni después de desbloquear o reactivar**
- [ ] T043 [P] [US4] `tests/db/application-notices.test.ts` (suma): volver a publicar, bloquear y suspender no escriben; unitarios: `adoption-view.test.ts` (terminada, cortada), `adoption-events.test.ts` (`adoption_ended`)

### Implementación de US4

- [ ] T044 [US4] En la migración: `change_pet_status` con `republish` termina la adopción (R6); `applications_close_on_block` y `applications_close_on_suspension` escriben `contact_cut_at` (R4); `db reset` y `db:types`
- [ ] T045 [US4] `src/actions/pet-status.ts`: `adoption_ended` al volver a publicar un adoptado con persona
- [ ] T046 [P] [US4] `src/components/adoptions/end-adoption-dialog.tsx` en `PetStatusActions` con `endsAdoption`; textos `adoptions.end.*`; «La adopción de … terminó» en `AdoptionPanel` y `HandoverSummary`

**Checkpoint**: las cuatro user stories se prueban solas.

---

## Fase 7: Pulido

- [ ] T047 [P] `docs/06-i18n.md`: glosario y §Qué se traduce (plan.md §Docs)
- [ ] T048 [P] `docs/10-design-system.md` §Componentes: los componentes nuevos y los que cambian (plan.md §Docs)
- [ ] T049 Cargar `vercel:react-best-practices` y revisar los TSX nuevos y cambiados
- [ ] T050 Capturas a 390 y 1280: `node scripts/walk.mjs --story entrega-compromiso-adopcion --user /mis-animales /mis-animales/{id}/adoptado /mis-solicitudes/{id} /solicitudes/{id}`
- [ ] T051 `pnpm gates:affected` en cada ronda y `pnpm verify` una vez al cerrar el build

---

## Dependencias y orden

- Fase 1 → Fase 2 → US1 → US2 → US3 → US4 → Pulido. La migración es una sola: cada US suma sus
  funciones al mismo archivo y corre `db reset` y `db:types`.
- Dentro de cada US: los tests primero (fallan), después la migración, la lógica pura, la acción y
  las pantallas.
- US3 y US4 se apoyan en `AdoptionPanel` (US2); US4 en `HandoverLine` (US1).

## Paralelo, por ejemplo

- En US1: T011, T012, T013, T014 y T015 juntos; después T017 y T019.
- En US2: T025, T026 y T027 juntos; T029 y T032 en paralelo.

## Estrategia

MVP = US1 (marcar adoptado eligiendo, con el teléfono solo para el par). Después cada US en orden,
con `pnpm gates:affected` verde al cerrar cada una.
