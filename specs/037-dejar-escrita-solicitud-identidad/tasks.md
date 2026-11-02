---
description: "Tareas de la historia #289 — Dejar escrita la solicitud mientras revisan mi identidad, y que salga sola al aprobarse"
---

# Tasks: Dejar escrita la solicitud mientras revisan mi identidad, y que salga sola al aprobarse

**Input**: `specs/037-dejar-escrita-solicitud-identidad/` — spec.md, plan.md (§Diseño, §Cómo se
construye), research.md (R1–R12), data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: sí, y solo los de research R12; no se agrega ninguno fuera de ahí ni se saca ninguno de
ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se carga
`frontend-design:frontend-design` y se abre `docs/10-design-system.md`; antes de tocar la migración o
sus tests, `supabase:supabase-postgres-best-practices`; todo texto visible (pantallas y correos), con
`sin-slop`; después de varios TSX, `vercel:react-best-practices`. La migración es un solo archivo;
después de cada cambio, `pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: lo que se guarda, las funciones que lo escriben, sueltan, cierran y leen, y los tipos
que usan las cuatro partes.

- [X] T001 Crear `supabase/migrations/20261108120000_held_applications.sql` con `private.held_ttl()`, la tabla `public.held_applications` (columnas, los dos `check` de estado, índices, RLS sin políticas, `revoke all`, `comment on table`) y `public.held_application_moments` con `public.claim_held_application_moments(p_limit)` (data-model.md, research R1, R2, R10)
- [X] T002 En la misma migración: `private.queue_new_application_notice(p_app)` con la regla de #65/#257; `public.submit_application` redefinida sobre la de `20261030120000_identity_asks.sql` con `has_held`, el límite que cuenta las que esperan y la regla extraída; `public.hold_application` con los candados teléfono → identidad, la delegación con nivel 2 y `needs_identity` sin pedido en revisión (research R3)
- [X] T003 En la misma migración: `private.release_held_applications(p_user)` con la normalización de las respuestas, el aviso, el momento y el borrado de la fila; `public.held_applications_tick()` (vence con respuestas en nulo y suelta por usuario con su candado de identidad) y su `cron.schedule('held-applications', '*/5 * * * *', …)` con `task_ran`; `public.pet_lifecycle_tick()` redefinida con la condición de momentos sin tomar (research R4, R5)
- [X] T004 En la misma migración: `public.resolve_identity_request` (`drop` + `create`, mismos permisos) que suelta al aprobar antes de `resolve_identity_asks`, pasa a `capped` las que esperan cuando `identity_retry_on` no es nulo y devuelve `held jsonb`; `public.claim_identity_expiry_notices` redefinida con `held jsonb` (research R5, R6, R9)
- [X] T005 En la misma migración: `private.lapse_held_applications(p_ids, p_reason)`; los cuatro triggers de cierre (`held_applications_lapse_on_pet_change`, `…_on_pet_delete`, `…_on_block`, `…_on_suspension`) que pasan a `lapsed` con el motivo, el nombre y la camada, respuestas en nulo y su momento; `public.withdraw_held_application(p_user, p_id)` (research R6)
- [X] T006 En la misma migración: `public.my_held_applications()`, `public.my_held_application(p_id)` y `public.apply_context` redefinida sobre la de `20261105120000_limit_screen_litter.sql` con `my_held_id`, `identity_in_review`, `active_count` con las que esperan, la lista del límite con su marca y `last_answers` que toma la más reciente de las dos tablas; `grant` y `revoke` de cada función (research R7)
- [X] T007 `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T008 [P] `src/lib/applications/rules.ts` (`HELD_TTL_DAYS = 14`) y `types.ts`: `ApplyContext.myHeldId`, `identityInReview`; `HeldApplication`; `ApplicationSummary` con `kind: 'application' | 'held'` y los campos de la que espera (data-model.md)
- [X] T009 [P] `src/lib/applications/paths.ts`: `HOLD_FLAG`, `applyHoldPath(code, litterCode)`, `heldSentPath(code, id)` (contracts §Rutas)
- [X] T010 [P] `tests/db/held-applications-support.ts`: sembrar sobre `identity-support.ts` y el soporte de solicitudes una rescatista con un animal que pide identidad, una camada que la pide y un animal que pide solo el teléfono; un solicitante con el teléfono y el pedido en revisión, otro sin pedido, otro con dos rechazos en 30 días, otro con la identidad aprobada sin teléfono; quien administra; leer las dos tablas, las solicitudes y los avisos con el cliente de servicio
- [X] T011 Agregar `held-applications` a la lista de tareas vigiladas (`src/lib/cron/route-tasks.ts` o la que lee `task_watch`) y su paridad de 14 días al test de base que compara constantes

**Checkpoint**: la base existe, los tipos están generados y todo compila.

---

## Fase 2: User Story 1 — Dejar escrita la solicitud mientras revisan la identidad (P1) 🎯 MVP

**Goal**: con el pedido en revisión, la persona deja escrita la solicitud desde la pantalla de
identidad pedida, la ve en «Mis solicitudes» como «Espera tu identidad», ocupando un lugar, la puede
retirar, y quien publicó no ve nada.

**Independent Test**: spec.md US1.

### Tests de US1

- [X] T012 [P] [US1] `tests/db/held-applications-privacy.test.ts`: como quien publicó, `pet_applications`, `publisher_application`, `publisher_inbox` y la función de los números de «Mis animales» no traen nada de una que espera ni cambian sus cuentas; como quien administra, ni la tabla ni la cola de revisión ni las funciones `admin_*` la muestran; como visitante, como quien publicó y como otra persona, `select` sobre las dos tablas falla y `my_held_applications` / `my_held_application` no traen nada ajeno; `hold_application`, `withdraw_held_application` y `claim_held_application_moments` no se llaman sin el rol de servicio; la fila se borra con la cuenta de quien la escribió; los momentos no tienen columnas de persona ni de animal
- [X] T013 [P] [US1] `tests/db/held-applications-rules.test.ts` (dejarla escrita): `held` con el pedido en revisión; `needs_identity` sin pedido, con el pedido vencido, rechazado o retirado; `sent` (delegó) con nivel 2, con su aviso; `needs_phone`; `limit` contando las que esperan, también desde `submit_application` a un animal de solo teléfono; `has_held` para el mismo animal desde las dos funciones; `has_active` con una enviada; `rejected` con una no aceptada; `unavailable` y `not_receiving`; dos llamadas con el mismo intento, también en paralelo, dejan una fila (`already`); una cría y un animal de la misma persona conviven; `last_answers` toma la que espera si es la más reciente
- [X] T014 [P] [US1] `src/lib/applications/apply-gate.test.ts`: `has_held` después de `has_active` y antes del límite; `needs_identity.canHold` verdadero solo con `identityInReview`; nada cambia para un animal de solo teléfono
- [X] T015 [P] [US1] `src/lib/applications/held-outcome.test.ts`: cada resultado de `hold_application` al `ActionResult` de contracts §holdApplication, y `null` como falla
- [X] T016 [P] [US1] `src/lib/applications/held-view.test.ts` (parte 1): una que espera con pedido en revisión da `waiting_identity` sin línea; `not_sent` con cada motivo da su clave; el día escrito en hora de Uruguay en el borde de la medianoche

### Implementación de US1

- [X] T017 [US1] `src/lib/applications/apply-gate.ts`: `has_held` y `canHold`
- [X] T018 [US1] `src/lib/applications/held-outcome.ts` y `held-view.ts` (sello, línea, motivo)
- [X] T019 [US1] `src/lib/supabase/queries/applications.ts`: `getApplyScreen` con `myHeldId`, `identityInReview` y la lista del límite; `holdApplicationRecord`; `withdrawHeldRecord`; `getMyHeldApplication`; `listMyApplications` que junta `my_applications` y `my_held_applications`; toda cuenta de activas que hoy se muestra (la confirmación de siempre incluida) suma las que esperan (FR-012, research R7)
- [X] T020 [US1] `src/actions/applications.ts`: `holdApplication` (schema del cuestionario, `held-outcome`, redirección a la confirmación o a la de siempre) y `withdrawHeldApplication` con sus cuatro resultados (contracts)
- [X] T021 [US1] `messages/es.json` con `sin-slop`: `applications.held.offer|offer_line|waiting|to_mine|form_note|submit|errors.*`, `applications.held.sent.*`, `applications.mine.stamps.waiting_identity|not_sent`, `applications.mine.written_on`, `applications.mine.reasons.withdrawn`, `applications.withdraw.held_body`, `applications.withdraw.errors.released`, `metadata.applications.held`
- [X] T022 [P] [US1] `src/components/applications/held-offer.tsx` (oferta · ya dejó una) y `identity-required.tsx` con el lugar de la oferta (plan §Diseño)
- [X] T023 [P] [US1] `src/components/applications/application-form.tsx`: `mode="hold"` con la nota arriba de cada paso, «Dejarla lista», la acción `holdApplication` y el error `no_review` con lo escrito a la vista
- [X] T024 [P] [US1] `src/components/applications/application-stamp.tsx` (`waiting_identity` `ink`, `not_sent` `muted`), `my-application-card.tsx` (sin enlace, «Retirar», líneas) y `application-sent.tsx` (variante `held`)
- [X] T025 [P] [US1] `src/components/applications/withdraw-application-dialog.tsx`: recibe la acción y el cuerpo; estado «ya salió»
- [X] T026 [US1] `src/app/[locale]/(app)/_components/identity-required-screen.tsx` (`canHold`, ya dejó una) y `limit-screen.tsx` (las que esperan con su sello y su retiro)
- [X] T027 [US1] `src/app/[locale]/(app)/solicitar/[code]/page.tsx`: `HOLD_FLAG`, `has_held` → la pantalla de identidad con «ya dejó una», el modo `hold` del cuestionario; textos en `src/app/[locale]/_components/application-texts.ts`
- [X] T028 [US1] `src/app/[locale]/(app)/solicitar/[code]/dejada/page.tsx` con `generateMetadata` (`noindex`), `loading.tsx` y `error.tsx`
- [X] T029 [US1] `src/app/[locale]/(app)/mis-solicitudes/page.tsx`: las dos listas juntas, el conteo con las que esperan, el orden por día

**Checkpoint**: US1 se recorre entera con quickstart pasos 1-4 y sus pruebas pasan.

---

## Fase 3: User Story 2 — Que salga sola al aprobarse la identidad (P2)

**Goal**: la aprobación suelta todas las que pueden salir, como solicitudes comunes con la fecha de
ese día y el aviso de siempre; las de un animal en pausa salen el día que vuelve; el correo aprobado
lo cuenta.

**Independent Test**: spec.md US2.

### Tests de US2

- [X] T030 [P] [US2] `tests/db/held-applications-rules.test.ts` (salir): la aprobación suelta dos (animal y cría), con `sent_at` del momento, el mismo `attempt_id`, sin fila en `held_applications`, y devuelve `held` con las dos; el aviso `new_application` sale con la regla de siempre y no sale con una nueva sin abrir de ese animal; una de un animal en pausa sigue esperando, sale con `held_applications_tick` al reanudarlo dentro del plazo y no sale después; la identidad aprobada sin teléfono no suelta y la tarea suelta al confirmarlo; la tarea no suelta a quien no tiene nivel 2; dejar de pedir identidad no suelta; aprobar y retirar en paralelo dejan una sola cosa; el compromiso de castración se saca si el animal pasó a castrado; una solicitud que salió se acepta y revela el contacto como cualquier otra
- [X] T031 [P] [US2] `src/lib/email/held-mail.test.ts` (aprobado): salieron, siguen esperando con su día, mezcla; vacío no agrega nada
- [X] T032 [P] [US2] `src/lib/email/identity-approved-link.test.ts`: con alguna que esperaba, «Ver mis solicitudes» gana sobre volver al animal y sobre «Mis animales»; sin ninguna, como hoy
- [X] T033 [P] [US2] `src/lib/applications/held-view.test.ts` (parte 2): con nivel 2 y el animal que no recibe por ahora, sello `unavailable` y la línea con el último día

### Implementación de US2

- [X] T034 [US2] `src/lib/supabase/queries/review.ts`: leer `held` de `resolve_identity_request`; `src/actions/review.ts`: pasarlo al correo
- [X] T035 [US2] `src/lib/email/held-mail.ts`, `send-identity-result.ts` (`held` en `IdentityResult`) e `identity-approved-link.ts`
- [X] T036 [US2] `messages/es.json` con `sin-slop`: `emails.identity_approved.held_released|held_waiting|my_applications_button`, `applications.held.unavailable_line`; `held-view.ts` y `my-application-card.tsx` con el sello de no disponible por ahora y su línea (FR-014)
- [X] T037 [US2] `tests/e2e/solicitud-en-espera.spec.ts`: con el pedido en revisión, dejarla escrita; quien publicó no la ve; quien administra aprueba; aparece en «Mis solicitudes» como «Esperando respuesta» con la fecha de hoy y en la bandeja de quien publicó como nueva

**Checkpoint**: quickstart pasos 5-6 andan y las pruebas de US1 y US2 pasan.

---

## Fase 4: User Story 3 — Lo que pasa cuando no sale (P3)

**Goal**: rechazo, vencimiento y retiro del pedido la dejan esperando con el último día a la vista;
el plazo, el retiro, los cierres, el bloqueo, la suspensión y el tope la cierran como «No salió», sin
respuestas y sin ocupar lugar; los correos de rechazo y vencido lo dicen.

**Independent Test**: spec.md US3.

### Tests de US3

- [X] T038 [P] [US3] `tests/db/held-applications-rules.test.ts` (no salir): el rechazo y el vencimiento dejan `waiting` y devuelven `held` con el último día; un pedido nuevo aprobado dentro del plazo la suelta; el plazo la pasa a `expired` con `answers` nulo; cada trigger da su motivo (`adopted`, `unpublished` por baja, por borrado del animal y por borrado de la cuenta de quien publicó, `not_receiving` por bloqueo de quien publicó, `you_blocked`, `suspended`, `unpublished` por suspensión de quien publicó); el tercer rechazo da `capped` a todas; cada cierre libera el lugar y anota su momento; una que no salió no frena volver a dejarla escrita ni mandarla; ningún cierre escribe un aviso de correo (FR-032); `withdraw_held_application` da `withdrawn`, `released` con el id si ya salió, `closed` si ya no salió y `not_found` ajena
- [X] T039 [P] [US3] `src/lib/applications/held-view.test.ts` (parte 3): sin pedido en revisión ni nivel 2, la línea del plazo con el último día y el camino a verificar; los motivos de siempre usan sus claves de siempre (`not_receiving` también para el bloqueo de quien publicó)
- [X] T040 [P] [US3] `src/lib/email/held-mail.test.ts` (rechazado, vencido, tope): el nombre y hasta qué día; con el tope, que no van a salir

### Implementación de US3

- [X] T041 [US3] `src/lib/supabase/queries/identity.ts`: leer `held` de `claim_identity_expiry_notices`; `src/app/api/cron/identidad/route.ts`: pasarlo al correo de vencido
- [X] T042 [US3] `held-mail.ts` y `send-identity-result.ts` para rechazado, vencido y tope; `held-view.ts` con la línea del plazo
- [X] T043 [US3] `messages/es.json` con `sin-slop`: `applications.mine.reasons.expired|capped`, `applications.held.deadline_line|verify`, `emails.identity_rejected.held_waiting|held_capped`, `emails.identity_expired.held_waiting`
- [X] T044 [US3] `my-application-card.tsx` y `mis-solicitudes/page.tsx`: la línea del plazo con el camino a verificar, el sello «No salió» con el motivo entre las cerradas

**Checkpoint**: quickstart paso 6 (el plazo) anda y las pruebas de US1 a US3 pasan.

---

## Fase 5: User Story 4 — Medir lo que pasa con las solicitudes que esperan (P4)

**Goal**: la marca en el freno, los tres momentos y la lectura 13.

**Independent Test**: spec.md US4.

### Tests de US4

- [X] T045 [P] [US4] `src/lib/analytics/application-events.test.ts`: `applyStoppedEvent` lleva `hold_offered` solo con `by = 'identity'`; `application_held` con sus propiedades; de cada momento de la base, `held_application_released` más `application_sent` con `after: 'identity'` y `held: true`, y `held_application_lapsed` con los cinco motivos agrupados (research R10); ninguno lleva ids
- [X] T046 [P] [US4] `tests/db/held-applications-rules.test.ts` (momentos): salir y no salir anotan un momento con los niveles y `litter`; `claim_held_application_moments` los devuelve una sola vez

### Implementación de US4

- [X] T047 [US4] `src/lib/analytics/events.ts` y `application-events.ts`: los eventos nuevos, `hold_offered`, `held`
- [X] T048 [US4] `solicitar/[code]/page.tsx`: el freno por identidad con `holdOffered`; `holdApplication`: `application_held` con `deliver`
- [X] T049 [US4] `src/lib/supabase/queries/held-moments.ts` y `src/app/api/cron/publicaciones/route.ts`: tomar los momentos y mandarlos (con `taskFailed`, sin frenar el resto de la vuelta)
- [X] T050 [US4] `docs/03-mvp-features.md` §Métricas de éxito: la lectura 13 (de las veces que se ofreció, cuántas se dejaron, cuántas salieron y por qué no salió el resto; la lectura 2 antes y después, con `held` aparte), escrita con `sin-slop`

**Checkpoint**: las cuatro partes andan y todas las pruebas pasan.

---

## Fase 6: Pulido

- [ ] T051 [P] `docs/10-design-system.md`: fila de `HeldOffer` y las variantes nuevas de `ApplicationStamp`, `ApplicationForm`, `ApplicationSent`, `MyApplicationCard`, `IdentityRequired`, `LimitReached` y `WithdrawApplicationDialog`
- [ ] T052 [P] Revisar con `sin-slop` todos los textos nuevos de `messages/es.json` y los párrafos de los correos
- [ ] T053 `vercel:react-best-practices` sobre los TSX tocados
- [ ] T054 `node scripts/walk.mjs --story 289-dejar-escrita-solicitud-identidad --user` sobre la pantalla de identidad pedida, el cuestionario en modo `hold`, la confirmación, «Mis solicitudes» y el límite, a 390 y 1280 px
- [ ] T055 `pnpm gates:affected` verde (la migración corre la suite entera) y Stryker al 100 % sobre lo que tiene test

---

## Dependencias

- Fase 1 bloquea todo. US1 → US2 → US3 → US4 en ese orden: US2 necesita lo que US1 guarda, US3 los
  correos de US2 y US4 los momentos que anotan las tres.
- Dentro de cada fase, los tests [P] se escriben primero y fallan; después la implementación.
- `messages/es.json` se toca en una tarea por fase para no pisarse.
