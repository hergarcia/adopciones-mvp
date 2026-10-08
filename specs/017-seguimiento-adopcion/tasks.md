---
description: "Tareas de la historia #69 — Seguimiento a los 30 días de cada adopción y adopciones con seguimiento en el perfil"
---

# Tasks: Seguimiento a los 30 días de cada adopción y adopciones con seguimiento en el perfil

**Input**: `specs/017-seguimiento-adopcion/` — spec.md, plan.md (§Diseño, §Qué se testea),
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

**Propósito**: tipos, reglas y textos base.

- [X] T001 [P] Crear `src/lib/follow-ups/types.ts` (`FollowUpStatus` `requested` `answered` `closed`; `SkipReason`; `FollowUpRow` de `follow_up_of`; `PetFollowUp` de `my_pet_follow_ups`; `FollowUpHistory` `{ given, adopted }`; `FollowUpOutcome`) y `src/lib/follow-ups/rules.ts` (`FOLLOW_UP_MAX_PHOTOS = 3`, `FOLLOW_UP_TEXT_MAX = 500`, `FOLLOW_UP_DAYS = 30`)
- [X] T002 [P] Ampliar `src/lib/applications/types.ts`: `NoticeKind` suma `follow_up_requested` y `follow_up_answered`
- [X] T003 [P] Textos base en `messages/es.json`: `follow_ups.answer.*`, `follow_ups.line.*`, `follow_ups.history.*` con plural ICU, `follow_ups.errors.*` (plan.md §Textos)

---

## Fase 2: Base compartida

**Propósito**: las tablas, el bucket, la marca de bloqueo, el cierre y las lecturas que todas las
user stories usan. Bloquea las fases 3 a 6.

- [X] T004 Escribir `supabase/migrations/<ts>_follow_ups.sql` (después de `20261008120000`): `follow_ups`, `follow_up_photos`, `follow_up_photo_purges` con sus checks, índices, RLS encendida sin políticas y `revoke all`; `follow_ups_forward_only`; `follow_up_photos_queue_purge`; el bucket privado `follow-up-photos` sin políticas; `adoptions.blocked_at` con `adoptions_forward_only` recreado, `adoptions_mark_blocked` sobre `blocks` y el relleno de los bloqueos de hoy; `adoptions_close_follow_up`; los dos `kind` en `application_notices_kind_valid` (data-model.md)
- [X] T005 En la misma migración: `follow_up_of`, `follow_up_photo_paths`, `my_pet_follow_ups`, `my_open_follow_ups` (data-model.md §lectura)
- [X] T006 `pnpm exec supabase db reset` y `pnpm db:types` → `src/lib/supabase/types.ts` (nunca a mano)
- [X] T007 [P] `tests/db/follow-ups-support.ts`: publicadora, persona que adoptó (adopción `site` marcada con el servicio y `marked_at` movido a mano), otra solicitante del mismo animal, otra persona, quien administra; correr la vuelta; lecturas como `anon`, cada persona y quien administra
- [X] T008 [P] `src/lib/supabase/queries/follow-ups.ts`: `followUpOf`, `myPetFollowUps`, `myOpenFollowUps`, `signFollowUpPhotos` (servicio, después de `followUpOf`) — las de escritura llegan con cada US
- [X] T009 [P] `src/lib/follow-ups/follow-up-view.ts` + test: `followUpView(row, side)` y `followUpLine(row)` (plan.md §Qué se testea)

**Checkpoint**: lo de #63, #65 y #67 sigue verde (`pnpm test`).

---

## Fase 3: User Story 1 — El sitio pide el seguimiento a los 30 días (P1) 🎯 MVP

**Objetivo**: la vuelta horaria que pide o no pide, el correo «¿Cómo va …?» y el pedido a la vista
en Mis animales, Mi solicitud y Mis solicitudes.

**Prueba independiente**: spec.md §US1.

### Tests de US1 (fallan primero)

- [X] T010 [P] [US1] `tests/db/follow-ups-rules.test.ts` (pedido): 29 días no, 30 sí, por día de Uruguay (23:50 y 0:10); una de 35 días sin fila se pide en la vuelta siguiente (FR-003); dos vueltas → una fila y un aviso; `skipped` con cada motivo (terminada, deshecha, bloqueo vigente y desbloqueado, suspensión de cada lado, cuenta de quien adoptó borrada) y nunca después; por fuera del sitio, nada
- [X] T011 [P] [US1] Ampliar `src/lib/applications/notices.test.ts`: `follow_up_requested` va a Mi solicitud
- [X] T012 [P] [US1] `src/lib/analytics/follow-up-events.test.ts`: `follow_up_requested` y `follow_up_skipped { reason }`, sin ids

### Implementación de US1

- [X] T013 [US1] En la migración: `private.request_due_follow_ups()`, `private.purge_stale_follow_up_photos()`, `public.run_follow_up_tick()` (`service_role`), `claim_follow_up_events`, `cron.schedule('follow-ups', '10 * * * *', …)` y `pet_lifecycle_tick` recreado (R3, R11); `db reset` y `db:types`
- [X] T014 [P] [US1] `src/lib/applications/notices.ts`: los dos `kind`, con su destino; `src/lib/analytics/follow-up-events.ts` y `events.ts`
- [X] T015 [US1] `src/lib/email/send-application-notice.ts`: `follow_up_requested` con la portada (`getCommitmentForEmail` da código y portada) y `emails.applications.follow_up_requested.*` en `messages/es.json`
- [X] T016 [US1] `src/app/api/cron/publicaciones/route.ts`: `claimFollowUpEvents` → eventos (en `queries/follow-ups.ts`)
- [X] T017 [P] [US1] `src/components/follow-ups/follow-up-line.tsx` y su lugar en `src/app/[locale]/(app)/mis-animales/page.tsx` (debajo de `HandoverLine`, solo `adoption_current`)
- [X] T018 [P] [US1] `src/components/applications/my-application-card.tsx` con «Contá cómo va» y `src/app/[locale]/(app)/mis-solicitudes/page.tsx` con `myOpenFollowUps`
- [X] T019 [US1] `supabase/seed.sql`: dos adopciones `site` entre personas sembradas, marcadas hace 31 y 10 días

**Checkpoint**: quickstart pasos 1–4.

---

## Fase 4: User Story 2 — La persona que adoptó cuenta cómo va y quien lo dio lo ve (P2)

**Objetivo**: el formulario en Mi solicitud, las fotos, la respuesta con candado, el correo con la
primera foto y la respuesta en Mis animales y en Una solicitud.

**Prueba independiente**: spec.md §US2.

### Tests de US2 (fallan primero)

- [X] T020 [P] [US2] `tests/db/follow-ups-rules.test.ts` (respuesta): solo quien adoptó; solo `requested`; 1 a 3 fotos en espera de ese seguimiento; texto ≤ 500; dos veces → `already` y un aviso; suspensión de quien adoptó → `suspended` y sigue abierto; suspensión de quien lo dio → responde sin aviso; no cambia el compromiso; `decline_adoption` → `answered`; no se edita; `stage_follow_up_photo` con tope 9, reintento y `closed`
- [X] T021 [P] [US2] `tests/db/follow-ups-privacy.test.ts` (contenido): `follow_up_of` y `follow_up_answered_for_email` no devuelven nada a otra solicitante, otra persona, quien administra ni `anon`; las tablas y el bucket no se leen con ninguna sesión
- [X] T022 [P] [US2] `src/lib/schemas/follow-up.test.ts`, `src/lib/follow-ups/outcomes.test.ts`, `src/lib/adoptions/adoption-view.test.ts` (sin «Yo no adopté» con respuesta), `src/lib/pets/photo-list.test.ts` (`addPhotos` con `max`), `src/lib/email/notice-email-template.test.ts` (`inlineImage`), `src/lib/analytics/follow-up-events.test.ts` (`follow_up_answered`, `follow_up_viewed`)

### Implementación de US2

- [X] T023 [US2] En la migración: `stage_follow_up_photo`, `answer_follow_up`, `mark_follow_up_seen`, `follow_up_answered_for_email`, `claim_follow_up_photo_purges`, `forget_follow_up_photo_purges`; `adoption_of` y `decline_adoption` recreados; `db reset` y `db:types`
- [X] T024 [P] [US2] `src/lib/schemas/follow-up.ts` (`followUpAnswerSchema`, `followUpPhotoSchema`), `src/lib/follow-ups/outcomes.ts`, `src/lib/adoptions/adoption-view.ts` con `followUpAnswered`, `src/lib/pets/photo-list.ts` y `src/hooks/use-pet-photos.ts` con `max`
- [X] T025 [US2] `src/lib/supabase/queries/follow-ups.ts`: `stageFollowUpPhoto`, `uploadFollowUpPhotoFiles`, `followUpPhotoRowExists`, `answerFollowUp`, `markFollowUpSeen`, `purgeFollowUpPhotos`, `followUpAnsweredForEmail`; `adoptions.ts` con `followUpAnswered`
- [X] T026 [US2] `src/actions/follow-ups.ts`: `uploadFollowUpPhoto` y `answerFollowUp` (contracts/routes.md); `src/actions/profile.ts` y `src/actions/pet-status.ts` (`deletePet`) suman `purgeFollowUpPhotos()` después del borrado; la ruta de la tarea también
- [X] T027 [US2] `src/lib/email/send-email.ts` y `notice-email-template.ts` con `extras.inlineImage`; `src/lib/email/send-follow-up-answered.ts` (R8: `card` de la primera foto → JPEG 600 px con `sharp`); `send-application-notice.ts` lo deriva; `emails.applications.follow_up_answered.*`
- [X] T028 [P] [US2] `src/components/pets/pet-photos-field.tsx` variante `plain`; `src/hooks/use-follow-up-submit.ts`; `src/components/follow-ups/follow-up-form.tsx` (plan.md §Mi solicitud) y `follow_ups.form.*`, `follow_ups.toast.*`
- [X] T029 [P] [US2] `src/components/follow-ups/follow-up-photos.tsx`, `follow-up-answer.tsx`, `follow-up-summary.tsx`
- [X] T030 [US2] `src/app/[locale]/(app)/mis-solicitudes/[id]/page.tsx` (+ `loading.tsx`): `FollowUpForm` o `FollowUpAnswer` según `followUpView`; `AdoptionPanel` sin «Yo no adopté» con respuesta
- [X] T031 [US2] `src/app/[locale]/(app)/mis-animales/[id]/page.tsx` (+ `loading.tsx`) y `src/app/[locale]/(app)/solicitudes/[id]/page.tsx`: `FollowUpSummary`, `markFollowUpSeen` en `after` con el evento
- [X] T032 [US2] `tests/e2e/follow-up.spec.ts` (plan.md §E2E), primera parte: pedido, responder con 2 fotos y texto, el sello, Mis animales y el correo sin el texto

**Checkpoint**: quickstart pasos 5–6.

---

## Fase 5: User Story 3 — El historial en el perfil, la ficha y la solicitud (P3)

**Objetivo**: los dos números, públicos, sin cero, en tres lugares.

**Prueba independiente**: spec.md §US3.

### Tests de US3 (fallan primero)

- [X] T033 [P] [US3] `tests/db/follow-ups-privacy.test.ts` (historial): `follow_up_history` solo dos números; `0, 0` para una cuenta suspendida o inexistente; borrar la cuenta de quien adoptó, la de quien lo dio o el animal saca la adopción y deja las fotos en la cola; `tests/db/follow-ups-rules.test.ts`: una terminada después de responder sigue contando; pedidos sin responder y cerrados no cuentan
- [X] T034 [P] [US3] `src/lib/follow-ups/history.test.ts`: `historyLines` (0/0, solo dio, solo adoptó, los dos)

### Implementación de US3

- [X] T035 [US3] En la migración: `follow_up_history` (`grant anon, authenticated`); `db reset` y `db:types`; `followUpHistory` en `queries/follow-ups.ts`; `src/lib/follow-ups/history.ts`
- [X] T036 [P] [US3] `src/components/follow-ups/follow-up-history.tsx`; hueco `history` en `src/components/verification/owner-card.tsx` y `src/components/profile/public-profile-header.tsx`; hueco `history` en `src/components/applications/applicant-header.tsx`
- [X] T037 [US3] `src/app/[locale]/(public)/perfil/[id]/page.tsx`, `src/app/[locale]/(public)/animales/[code]/page.tsx` y `src/app/[locale]/(app)/solicitudes/[id]/page.tsx` piden `followUpHistory` en paralelo; `revalidatePath` del perfil y la ficha en `answerFollowUp`
- [X] T038 [US3] `tests/e2e/follow-up.spec.ts`, segunda parte: «1 adopción con seguimiento» en el perfil público de quien lo dio

**Checkpoint**: quickstart paso 7.

---

## Fase 6: User Story 4 — Cierre, bloqueo y adopción terminada (P4)

**Objetivo**: el pedido que se cierra, lo que deja de ver quien lo dio tras un bloqueo y el
seguimiento de una adopción terminada.

**Prueba independiente**: spec.md §US4.

### Tests de US4 (fallan primero)

- [ ] T039 [P] [US4] `tests/db/follow-ups-rules.test.ts` (cierre): `closed` con `ended`, `declined` y `blocked`; desbloquear no lo reabre; `answered` no cambia al volver a publicar; `tests/db/follow-ups-privacy.test.ts` (bloqueo después de responder, en las dos direcciones y después de desbloquear: quien lo dio `hidden`, quien adoptó todo; `my_open_follow_ups` deja de listarlo al cerrarse)

### Implementación de US4

- [ ] T040 [US4] Verificar que `adoptions_close_follow_up` y `adoptions_mark_blocked` (T004) cubren T039; `follow_up_of` con `hidden` (T005); ajustar si algún test falla
- [ ] T041 [US4] `FollowUpForm` con el rechazo `closed` («Ya no se puede contar cómo va …» y `router.refresh()`); `FollowUpAnswer` con `hidden` (solo el sello); la pantalla del animal muestra el seguimiento de la última adopción también después de volver a publicar (`my_pet_follow_ups` sin `adoption_current`)

**Checkpoint**: quickstart paso 8.

---

## Fase 7: Pulido

- [ ] T042 [P] `docs/06-i18n.md`: glosario y §Qué se traduce (plan.md §Docs)
- [ ] T043 [P] `docs/10-design-system.md` §Componentes: los componentes nuevos y los que cambian (plan.md §Docs)
- [ ] T044 Cargar `vercel:react-best-practices` y revisar los TSX nuevos y cambiados
- [ ] T045 Capturas a 390 y 1280: `node scripts/walk.mjs --story seguimiento-adopcion --user /mis-solicitudes/{id} /mis-solicitudes /mis-animales /mis-animales/{id} /solicitudes/{id} /perfil/{id}`
- [ ] T046 `pnpm gates:affected` en cada ronda y `pnpm verify` una vez al cerrar el build

---

## Dependencias y orden

- Fase 1 → Fase 2 → US1 → US2 → US3 → US4 → Pulido. La migración es una sola: cada US suma sus
  funciones al mismo archivo y corre `db reset` y `db:types`.
- Dentro de cada US: los tests primero (fallan), después la migración, la lógica pura, la acción y
  las pantallas.
- US2 se apoya en el pedido de US1; US3 en las respuestas de US2; US4 en `FollowUpForm` y
  `FollowUpAnswer` de US2.

## Paralelo, por ejemplo

- En US1: T010, T011 y T012 juntos; después T017 y T018.
- En US2: T020, T021 y T022 juntos; T028 y T029 en paralelo.

## Estrategia

MVP = US1 (el pedido a los 30 días, una sola vez). Después cada US en orden, con
`pnpm gates:affected` verde al cerrar cada una.
