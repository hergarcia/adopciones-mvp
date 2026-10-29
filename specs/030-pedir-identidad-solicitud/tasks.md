---
description: "Tareas de la historia #257 — Pedirle a quien solicitó que verifique su identidad antes de decidir"
---

# Tasks: Pedirle a quien solicitó que verifique su identidad antes de decidir

**Input**: `specs/030-pedir-identidad-solicitud/` — spec.md, plan.md (§Diseño, §Cómo se construye),
research.md (R1–R12), data-model.md, contracts/server-actions.md, quickstart.md

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

**Propósito**: lo que se guarda, las funciones que lo escriben y leen, y los tipos que usan las
cuatro partes.

- [X] T001 Crear `supabase/migrations/20261030120000_identity_asks.sql` con la tabla `public.application_identity_asks` (PK en la solicitud, `asked_at`, `resolved_at`, su `check`), RLS sin políticas, `revoke all` y `comment on table`; el trigger `application_identity_asks_on_publisher_gone` sobre `applications` (data-model.md, research R1, R11)
- [X] T002 En la misma migración: `application_notices_kind_valid` con `identity_asked` e `identity_verified`; los `check` de origen de `verification_exit_tickets`, `verification_exit_answers` y `verification_exit_counts` con `asked`, las filas `(phone, asked)` e `(identity, asked)` y `ask_verification_exit` redefinida (research R6, R8)
- [X] T003 En la misma migración: `public.ask_identity` con el candado de la solicitud y sus resultados (research R2); `private.resolve_identity_asks` con la regla del aviso (data-model.md §regla); `public.resolve_identity_request` con `asker_levels` (`drop` + `create`, mismos permisos); `public.open_application` con `opened_first` falso tras un pedido resuelto (research R4, R5)
- [X] T004 En la misma migración: `publisher_application`, `pet_applications` y `my_application` (sobre la versión de la #206) con las columnas nuevas, `drop` + `create` y los mismos `grant` (research R10)
- [X] T005 `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T006 [P] `src/lib/applications/types.ts`: `NOTICE_KINDS` con las dos clases; `PublisherApplication.identityAsk` y `applicantIdentityVerified`; `PetApplicationRow.identityAsked`; `MyApplication.identityAsk` (data-model.md §Tipos). `MyIdentityAsk` queda definido; sumarlo a `ApplicationDetail` con su mapeo es T032
- [X] T007 [P] `src/lib/applications/paths.ts`: `APPLICATION_FLAG`, `identityForApplicationPath`, `MY_APPLICATION_PATTERN` (contracts §Rutas)
- [X] T008 [P] `tests/db/identity-asks-support.ts`: sembrar sobre `application-responses-support.ts` e `identity-support.ts` una rescatista con un animal y una camada, solicitantes de nivel 1, de nivel 2, con la identidad aprobada sin teléfono, con un pedido de verificación en revisión, una segunda rescatista y quien administra; leer la tabla y los avisos con el cliente de servicio

**Checkpoint**: la base existe, los tipos están generados y todo compila.

---

## Fase 2: User Story 1 — Pedirle la identidad a quien solicitó (P1) 🎯 MVP

**Goal**: quien publicó pide la identidad desde una solicitud que espera respuesta de alguien sin
identidad, con la confirmación, una sola vez, y ve «Le pediste la identidad el <día> · Todavía no la
verificó»; quien solicitó recibe un solo correo.

**Independent Test**: spec.md US1.

### Tests de US1

- [X] T009 [P] [US1] `tests/db/identity-asks-rules.test.ts` (pedir): `asked` deja una fila y un aviso `identity_asked` a quien solicitó; dos llamadas, también en paralelo, dejan una fila y un aviso (la segunda `already` con el mismo `asked_at`); `verified` con la identidad aprobada, también sin teléfono; `not_waiting` con aceptada y rechazada; `gone`, `you_blocked` y `closed` con retirada, bloqueada y cerrada; `not_found` para otra persona; una cría devuelve `in_litter`; pedir no toca `first_response_at`, ni las preguntas, ni `opened_at`; pedir sin el teléfono de quien publicó funciona; `pet_applications.identity_asked` es verdadero con el pedido abierto y falso resuelto o con la solicitud fuera de `sent`
- [X] T010 [P] [US1] `tests/db/identity-asks-privacy.test.ts`: la tabla no se lee ni se escribe como visitante, como quien solicitó, como quien publicó ni como quien administra; `publisher_application` y `pet_applications` de un animal ajeno no traen nada; `ask_identity` no se puede llamar sin el rol de servicio; ninguna función de quien administra (la cola, la ficha de una persona, las de `admin_*`) devuelve una columna del pedido; `publisher_application` no trae nada del pedido de verificación de quien solicitó (estado, motivo, fechas) más que `applicant_identity_verified` (FR-012); el pedido se borra al borrar la cuenta de quien solicitó (cascada) y al borrar la de quien publicó (trigger)
- [X] T011 [P] [US1] `src/lib/applications/identity-ask.test.ts` (`publisherIdentityAskView`): `offer` solo con `sent`, sin pedido y sin identidad; `waiting` con el día del pedido; `asked_only` con la solicitud cerrada sin resolver; `none` sin pedido en cualquier otro estado; los días en hora de Uruguay en el borde de la medianoche
- [X] T012 [P] [US1] `src/lib/applications/publisher-actions.test.ts`: `identityAsk` es `offer` solo esperando respuesta, con la identidad sin aprobar y sin pedido; `null` con identidad aprobada, con pedido o con cualquier otro estado; no cambia aceptar ni preguntar
- [X] T013 [P] [US1] `src/lib/applications/response-outcome.test.ts`: `identityAskOutcome` para cada resultado de la base y para `null` (contracts §askIdentity)
- [X] T014 [P] [US1] `src/lib/applications/notices.test.ts`: `identity_asked` va a Mi solicitud de quien solicitó
- [X] T015 [P] [US1] `src/lib/analytics/identity-ask-events.test.ts` (`identity_ask_sent`): con nivel y `litter`, sin nivel cuando no se pudo leer, sin ids

### Implementación de US1

- [X] T016 [US1] `src/lib/applications/identity-ask.ts`: `publisherIdentityAskView` (research R10)
- [X] T017 [US1] `src/lib/applications/publisher-actions.ts`: `identityAsk: 'offer' | null` (FR-001)
- [X] T018 [US1] `src/lib/applications/response-outcome.ts`: `IDENTITY_ASK_OUTCOMES`, `IdentityAskResult`, `identityAskOutcome`
- [X] T019 [P] [US1] `src/lib/analytics/events.ts` (`identity_ask_sent` con su comentario de disparador) y `src/lib/analytics/identity-ask-events.ts`
- [X] T020 [US1] `src/lib/supabase/queries/application-response-records.ts`: `askIdentityRecord`; `src/lib/supabase/queries/application-responses.ts`: mapear `identityAsk`, `applicantIdentityVerified` e `identityAsked`
- [X] T021 [US1] `src/actions/application-responses.ts`: `askIdentity` con la medición y `settle` (contracts §askIdentity)
- [X] T022 [P] [US1] Textos en `messages/es.json`: `inbox.identity_ask` (disparador, título, cuerpo, confirmar, cancelar, la línea «Le pediste la identidad el {date}» y «Todavía no la verificó», la marca de la fila, «ya verificó su identidad», el error) y `emails.applications.identity_asked` (asunto, título, cuerpo, botón, alternativa, pie), escritos y revisados con `sin-slop`; `src/app/[locale]/_components/identity-ask-texts.ts` los arma
- [X] T023 [US1] `src/components/applications/identity-ask-dialog.tsx`: `Dialog` + `ConfirmBody`, quieto · pidiendo · no llegó con «Reintentar» · ya verificó · ya no espera (los dos últimos cierran, refrescan y avisan con `ScreenToast`) (plan §Diseño)
- [X] T024 [P] [US1] `src/components/applications/identity-ask-line.tsx`: esperando · verificó · cerrado sin aprobar (plan §Diseño)
- [X] T025 [US1] `src/components/applications/response-actions.tsx`: el disparador `secondary` entre «Pedir más información» y «Rechazar» cuando `identityAsk` es `offer`; `src/app/[locale]/_components/publisher-application-texts.ts` le pasa sus textos
- [X] T026 [US1] `src/app/[locale]/(app)/solicitudes/[id]/page.tsx`: `IdentityAskLine` debajo del estado en el encabezado
- [X] T027 [P] [US1] `src/components/applications/application-card.tsx` y `src/app/[locale]/_components/inbox-texts.ts`: la línea «Le pediste la identidad» en la fila con un pedido abierto

**Checkpoint**: US1 se prueba sola: pedir, ver la línea y la marca, un solo correo en `.artifacts/mail/`.

---

## Fase 3: User Story 2 — Ver el pedido en mi solicitud y verificarme desde ahí (P2)

**Goal**: quien solicitó ve el pedido con las chapitas de quien publicó y el camino a verificar
según su pedido de verificación; al mandar las fotos o tocar «Ahora no» vuelve a su solicitud, y la
pregunta de por qué se va cuenta el origen «se la pidió quien publicó».

**Independent Test**: spec.md US2.

### Tests de US2

- [X] T028 [P] [US2] `src/lib/applications/identity-ask.test.ts` (`myIdentityAskView`): `verify` sin pedido de verificación o retirado; `retry` con rechazado y vencido (con cuál); `in_review`; `capped` con el día; `verified` con el pedido resuelto; `none` sin pedido o con la solicitud fuera de `sent`
- [X] T029 [P] [US2] `src/lib/verification/exit-question.test.ts`: `exitPlaceOf` lee `solicitud` (uuid sí, otra cosa no); `exitOrigin` de identidad con solicitud → `asked`, y del teléfono con `from` en una Mi solicitud → `asked`; `exitDestination` de identidad con solicitud → Mi solicitud
- [X] T030 [P] [US2] `src/lib/surveys/exit-summary.test.ts`: `byOrigin` lleva `asked` y los totales lo suman
- [X] T031 [P] [US2] `tests/db/identity-asks-rules.test.ts` (verlo): `my_application` trae `identity_asked` y `publisher_level` solo con pedido y `sent`, nada con la solicitud aceptada, rechazada, retirada o cerrada; `ask_verification_exit` acepta `asked` y suma en su fila de cuentas; `my_application` de otra persona no trae nada (en `identity-asks-privacy.test.ts`)

### Implementación de US2

- [X] T032 [US2] `src/lib/supabase/queries/applications.ts`: `getMyApplication` con `identityAsk` y `measuredLevelOf(publisher_level)`
- [X] T033 [US2] `src/lib/applications/identity-ask.ts`: `myIdentityAskView` (research R10)
- [X] T034 [US2] `src/lib/verification/exit-question.ts`: `asked` en `EXIT_ORIGINS`, `applicationId` en `ExitPlace`, `exitPlaceOf`, `exitOrigin`, `exitDestination` (research R8)
- [X] T035 [US2] `src/actions/verification-exit.ts`: `leaveVerification` confirma la solicitud con `getMyApplication` antes de contar `asked` (contracts §leaveVerification)
- [X] T036 [P] [US2] `src/lib/surveys/exit-summary.ts` suma `asked` a `byOrigin` (research R8); las columnas de `ExitOriginTable` ya salen de `EXIT_ORIGINS`; `surveys.exits.origins.asked` en `messages/es.json`
- [X] T037 [P] [US2] Textos en `messages/es.json`: `applications.identity_ask` (el título con el nombre del animal, quién lo pide con su nivel, qué se pide, «Verificar mi identidad», «Intentarlo de nuevo», las dos líneas de `retry`, «Puede tardar hasta 2 días.», el día del tope, «Quien publicó ya lo ve en tu solicitud.»), con `sin-slop`; sumarlos a `identity-ask-texts.ts`
- [X] T038 [US2] `src/components/applications/identity-ask-note.tsx`: `section` con `Card`, `h2`, la chapita `md` de quien publicó y el pie según la vista; `tirita` o `secondary` según haya una pregunta sin contestar (plan §Diseño)
- [X] T039 [US2] `src/app/[locale]/(app)/mis-solicitudes/[id]/page.tsx`: lee la identidad propia (`getMyIdentity` + `myVerification`, `verify` si falla) y pone `IdentityAskNote` primera en la columna ancha
- [X] T040 [US2] `src/app/[locale]/(app)/verificar-identidad/page.tsx`: lee `solicitud`, la valida con `getMyApplication` (suya, `sent`, pedido sin resolver), y con ella `hrefs.sent`, `newPath`, `leavePath` y la puerta del teléfono vuelven a la solicitud; sin ella, todo como hoy (research R7)

**Checkpoint**: US2 se prueba con un pedido sembrado: la nota en sus cinco variantes, la ida y la vuelta.

---

## Fase 4: User Story 3 — Enterarse cuando la identidad se aprueba (P3)

**Goal**: aprobar la identidad resuelve cada pedido abierto, la solicitud vuelve a figurar como
nueva con «Verificó su identidad el <día>» y quien publicó recibe el correo con la regla de las
nuevas.

**Independent Test**: spec.md US3.

### Tests de US3

- [ ] T041 [P] [US3] `tests/db/identity-asks-rules.test.ts` (aprobar): resuelve los pedidos abiertos de una y de dos rescatistas, pone `opened_at` en nulo y devuelve sus niveles en `asker_levels`; el aviso `identity_verified` sale sin otras nuevas y no sale con otra nueva sin abrir del mismo animal posterior a la visita (también una que volvió a ser nueva); una cría cuenta como su propio animal; no toca un pedido de una solicitud aceptada, rechazada, retirada o cerrada (ni su `opened_at`, ni avisos); rechazar, vencer o retirar el pedido de verificación no tocan nada; `open_application` no vuelve a dar `opened_first` tras resolver; un aceptar y una aprobación en paralelo terminan en uno de los dos estados enteros
- [ ] T042 [P] [US3] `src/lib/applications/identity-ask.test.ts` (`publisherIdentityAskView`): `verified` con los dos días
- [ ] T043 [P] [US3] `src/lib/applications/notices.test.ts`: `identity_verified` va a esa solicitud del lado de quien publicó
- [ ] T044 [US3] `tests/e2e/identidad-pedida.spec.ts`: quien publicó pide la identidad y ve la línea; quien solicitó ve la nota, va a verificar, manda las dos fotos y vuelve a su solicitud «en revisión»; quien administra aprueba; quien publicó ve la solicitud como nueva en «Solicitudes recibidas» y «Verificó su identidad»

### Implementación de US3

- [ ] T045 [US3] `src/lib/supabase/queries/review.ts`: `askerLevels` desde `asker_levels`
- [ ] T046 [US3] `src/actions/review.ts`: con `approved`, `drainApplicationNotices()` dentro del `after()` existente (contracts §resolveIdentityRequest)
- [ ] T047 [P] [US3] `src/lib/applications/notices.ts`: `identity_verified` en `TO_PUBLISHER`
- [ ] T048 [P] [US3] Textos en `messages/es.json`: `emails.applications.identity_verified` y «Verificó su identidad el {date}» en `inbox.identity_ask`, con `sin-slop`
- [ ] T049 [US3] `src/components/applications/identity-ask-line.tsx` y `src/lib/applications/identity-ask.ts`: la variante `verified` en `--color-primary`

**Checkpoint**: US3 se prueba de punta a punta con el e2e.

---

## Fase 5: User Story 4 — Medir los pedidos aparte de lo exigido (P4)

**Goal**: un momento por pedido resuelto con el nivel de quien pidió, y la lectura en docs/03.

**Independent Test**: spec.md US4.

### Tests de US4

- [ ] T050 [P] [US4] `src/lib/analytics/identity-ask-events.test.ts` (`identity_ask_resolved`): uno por nivel, ninguno con la lista vacía, sin nivel cuando no se pudo leer, sin ids

### Implementación de US4

- [ ] T051 [US4] `src/lib/analytics/events.ts` (`identity_ask_resolved` con su comentario) y `src/lib/analytics/identity-ask-events.ts`
- [ ] T052 [US4] `src/actions/review.ts`: un `identity_ask_resolved` por nivel de `askerLevels`, con `{ visit: false }`, después de aprobar
- [ ] T053 [US4] `docs/03-mvp-features.md` §Métricas de éxito, «Cómo se leen»: la lectura 7, «¿Verifican más cuando se lo pide una persona?», con `identity_ask_resolved` sobre `identity_ask_sent` por `publisher_level`, `verification_exit_*` con `origin` = `asked`, y `application_accepted` con `applicant_level` = 2 en esas solicitudes; aparte de la lectura 2 y con la advertencia de los números chicos (FR-037), escrita con `sin-slop`

**Checkpoint**: los cuatro US andan y los momentos llegan sin ids.

---

## Fase 6: Pulido y transversal

- [ ] T054 [P] `docs/10-design-system.md`: las filas de `IdentityAskDialog`, `IdentityAskLine` e `IdentityAskNote` en §Componentes, y la línea de la marca en `ApplicationCard` y la columna en `ExitOriginTable`
- [ ] T055 [P] Repasar con `sin-slop` todos los textos nuevos de `messages/es.json` juntos, los de los correos incluidos
- [ ] T056 `vercel:react-best-practices` sobre los TSX tocados; `"use client"` solo en `IdentityAskDialog`
- [ ] T057 `pnpm gates:affected` en verde (Stryker al 100 % sobre lo que tiene test; un mutante equivalente se anota en su línea con el motivo)
- [ ] T058 `node scripts/walk.mjs --story pedir-identidad --user` con la solicitud de quien publicó (con y sin pedido, verificó), la lista del animal, Mi solicitud en sus cinco variantes y la confirmación, a 390 y 1280 px, para el design-reviewer
- [ ] T059 Recorrer quickstart.md entero

---

## Dependencias

- Fase 1 bloquea todo. US1 → US2 (la nota necesita un pedido) → US3 (resolver necesita el pedido y
  la vista de las dos puntas) → US4 (el momento de resolver sale de la acción de US3).
- Dentro de cada fase, los tests [P] se escriben antes que la implementación y fallan primero.
- T053 puede escribirse en cualquier momento después de T051.

## Paralelo

- Fase 1: T006, T007 y T008 a la vez, después de T005.
- US1: T009–T015 a la vez; T019, T022, T024 y T027 a la vez con el resto.
- US2: T028–T031 a la vez; T036 y T037 en paralelo con T032–T035.
- US3: T041–T043 a la vez; T047 y T048 en paralelo.

## Estrategia

MVP = Fase 1 + US1: quien rescata ya puede pedir y el pedido llega por correo. Cada fase siguiente se
verifica sola antes de pasar a la otra; el PR lleva las cuatro.
