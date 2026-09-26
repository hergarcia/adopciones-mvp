---
description: "Tareas de la historia #25 — Recuperar un número verificado en otra cuenta"
---

# Tasks: Recuperar un número verificado en otra cuenta

**Input**: `specs/004-recuperar-numero-otra-cuenta/` — spec.md, plan.md (§Diseño + 15 decisiones),
data-model.md, contracts/actions.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Base compartida

**Propósito**: lo que las tres user stories necesitan. **Sin dependencias nuevas** (plan.md
§Technical Context).

- [X] T001 Crear la migración con `pnpm exec supabase migration new phone_claims`: la tabla `public.phone_claims` de data-model.md (`user_id` PK con `on delete cascade`, `number` con el check E.164, `valid_until`), índice `(number)`, RLS habilitada **sin policies**, `revoke all` a `anon` y `authenticated`, y los `comment on` con el porqué
- [X] T002 En la misma migración, `phones`: `add column number_lost_on date`, el check `phones_lost_or_verified`, y `drop trigger phones_touch_updated_at` + `drop column updated_at` (plan.md §8). `touch_updated_at()` queda
- [X] T003 En la misma migración, las funciones nuevas de data-model.md —`get_phone_claim`, `claim_phone_number` (dos candados de cuenta en orden de id, después el del número, relectura, pasos 3 y 5 en un mismo `begin … exception when unique_violation` que devuelve `no_claim`, `verified_at` al comienzo del día y `number_lost_on` en `p_time_zone`, borrado de la prueba propia y de las ajenas del número, códigos vivos de la cuenta reemplazados) y `drop_phone_claim`—, `security invoker`, `set search_path = ''`, `revoke` a `public, anon, authenticated` y `grant execute` a `service_role`
- [X] T004 En la misma migración, las funciones que cambian: `check_phone_code` con `drop` + `create` (rama `in_use`: candado del número y upsert de la prueba; rama verificada: candado del número, `number_lost_on = null`, `was_lost`, borrado de pruebas ajenas del número; el `delete` de fila vacía con `and number_lost_on is null`) y **sus `revoke`/`grant` repetidos** (plan.md §15); `reserve_phone_code` (rama `skip`) y `settle_phone_code` (cierre `sent`) borran la prueba de la cuenta; `cancel_pending_phone` y `purge_phone_records` respetan `number_lost_on`, y la purga borra las pruebas vencidas
- [X] T005 Correr `pnpm exec supabase db reset` y `pnpm db:types` para regenerar `src/lib/supabase/types.ts`
- [X] T006 [P] `src/lib/verification/phone-status.ts` y `src/lib/supabase/queries/phones.ts`: `PhoneRow` suma `numberLostOn: string | null` (el `date` tal cual, sin `Date`); `getMyPhone` lo lee
- [X] T007 [P] `src/lib/supabase/queries/phone-claims.ts`: `getMyClaim()` (sesión + `get_phone_claim` con la clave de servicio, nulo si no vale), `claimPhoneNumber(userId)` (con `URUGUAY_TIME_ZONE` de `rules.ts`; nulo si la base no respondió) y `dropClaim(userId)`; `src/lib/supabase/queries/phone-codes.ts`: `checkPhoneCode` lee `was_lost`
- [X] T008 [P] `src/lib/analytics/events.ts`: `phone_claim_chosen`, `phone_claimed`, `phone_number_lost`, `phone_reverified_after_loss`, con el comentario de cuándo se dispara cada uno (plan.md §10)
- [X] T009 [P] `messages/es.json`: `verification.claim.*` (los caminos, la aclaración de «Entrar con esa cuenta», la confirmación, la hora límite, «Pedí un código nuevo», errores `expired` y `check_failed`), `verification.lost.*` (aviso del perfil y sello «Sin verificar»), `emails.number_lost.*` (junto a `emails.login_link`, el namespace de los correos), `verification.notice.sign_out_failed`, `metadata.phone_in_use` y `metadata.phone_claim`; borrar `verification.errors.number_in_use_ways` (KL-028)
- [X] T010 [P] `src/lib/email/notice-email-template.ts` y `src/lib/email/send-email.ts`: sacar la plantilla y el envío de `login-link-template.ts` y `send-login-link.ts` (plan.md §3), con el idioma como parámetro para `lang`; el enlace de ingreso pasa a usarlos sin cambiar lo que manda
- [X] T011 [P] `src/components/verification/form-submit.tsx`: extraer `FormSubmit` (`variant`, `label`) de `CancelPendingSubmit`, que pasa a usarlo (`ghost`)
- [X] T012 [P] `src/lib/verification/gate.ts`: `inUsePath(gate, opts?)`, `claimPath(gate)` y `signInPath(gate)`

**Punto de control**: `pnpm lint && pnpm typecheck && pnpm test` en verde; los tests de la #10
siguen pasando sin cambiar sus aserciones, salvo la lista de funciones de `phones.test.ts`.

---

## Fase 2: US1 — Quedarse con un número que figura en otra cuenta (P1) 🎯 MVP

**Meta**: con una prueba vigente, la cuenta elige «Es mío…», confirma y queda en nivel 1 con el
número; la cuenta anterior lo pierde.

**Prueba independiente**: spec.md §US1 Independent Test.

### Tests

- [X] T013 [P] [US1] `tests/db/phone-claims.test.ts`, parte de US1: la prueba no la lee ni la escribe `anon`, otra cuenta ni la dueña; el número pasa de A a B; B con `verified_at` al comienzo del día y A sin verificado; B queda sin número a medias, con sus códigos vivos reemplazados, con `was_change` si tenía otro verificado y ese otro libre; sin prueba, vencida, reemplazada por un pedido que sale o que el tope por número frena en silencio, y de otra cuenta → `no_claim` sin cambios; un pedido frenado por la espera o el tope, o que falla al salir, **no** borra la prueba; número libre → `verified_free` sin tocar a nadie; dos reclamos en paralelo con dueño y sin dueño, un reclamo en paralelo con la verificación común del número en una tercera cuenta, reclamos cruzados, y un reclamo en paralelo con A terminando un cambio y con A cancelando: uno gana, nada se traba, el número en una sola cuenta; verificar el número en otra cuenta borra las pruebas ajenas; la purga borra las vencidas y deja las vigentes; borrar la cuenta borra la prueba; `drop_phone_claim` borra solo la prueba de esa cuenta; `claim_phone_number` devuelve en `lost_on` el mismo día que escribió; `phones` sin `updated_at`; el día sale de `p_time_zone` (`Pacific/Kiritimati`, plan.md §Qué se testea)
- [X] T014 [P] [US1] `tests/db/phones.test.ts`: la aserción de que `anon` y `authenticated` no ejecutan las funciones del teléfono suma `get_phone_claim`, `claim_phone_number`, `drop_phone_claim` y la firma nueva de `check_phone_code`
- [X] T015 [P] [US1] `src/lib/verification/claim-outcome.ts` + test: `claimOutcome` (cada fila de plan.md §9, con eventos exactos; `claimed` y `verified_free` con el mismo resultado), `claimScreen` (cada fila de §4, «Seguir» solo con prueba vigente, nivel 1 y destino; sin prueba nunca marca de confirmación) y `claimReadback` (§14: `owned` solo si el verificado es el número de la pantalla)
- [X] T016 [P] [US1] `src/lib/verification/claim-deadline.ts` + test: `{ label, msLeft }` con los bordes de plan.md §Qué se testea
- [X] T017 [P] [US1] `src/lib/verification/gate.test.ts`: `inUsePath`, `claimPath` y `signInPath` conservan la puerta; `signInPath` solo con un `next` válido; `inUsePath(gate, { error: 'salir' })`
- [X] T018 [P] [US1] `src/lib/verification/code-check.ts` + test: `in_use` sin `continueTo`

### Acciones y pantallas

- [X] T019 [US1] `src/actions/phone-claim.ts` (aparte de `phone.ts`, que pasaba el tope de líneas del lint): `startPhoneClaim(gate)`, `confirmPhoneClaim(gate)` y `readPhoneClaim(number, gate)` según contracts/actions.md (el número de `readPhoneClaim` por `phoneNumberSchema`; purga en las tres; `revalidatePath('/mi-perfil')` al confirmar). El correo de `claimed` se engancha en T030
- [X] T020 [P] [US1] `src/components/verification/claim-deadline.tsx` (`"use client"`): solo el temporizador; recibe `children` y la vista vencida ya dibujada
- [X] T021 [P] [US1] `src/components/verification/claim-needs-new-code.tsx` (servidor, con lugar para la acción) y `claim-new-code-request.tsx` (`"use client"`, `requestPhoneCode` con el número, `useRetryCountdown` y `NextCodeHint`, a «Escribir el código» si salió)
- [X] T022 [US1] `src/components/verification/claim-choice.tsx` (`"use client"`): «Es mío…» en `secondary`, ocupado mientras `startPhoneClaim`; navega o muestra la vista vencida con el número
- [X] T023 [US1] `src/components/verification/number-in-use-ways.tsx`: los tres caminos del wireframe (tirita «Verificar otro número», o «Seguir» y los tres debajo), la hora límite del servidor, `ClaimChoice`, y un lugar para «Entrar con esa cuenta» (lo llena US3)
- [X] T024 [US1] `src/components/verification/claim-number-screen.tsx` y `claim-confirm-form.tsx` (`"use client"`): la confirmación del wireframe, la tirita ocupada, los errores de plan.md §Diseño, `readPhoneClaim` después de una falla de red, y la sesión vencida a «Entrar» con `next = claimPath(gate)`
- [X] T025 [US1] `src/app/[locale]/(app)/verificar-telefono/en-otra-cuenta/{page,loading}.tsx` y `quedarme/{page,loading}.tsx`: sesión y perfil como «Escribir el código», `getMyClaim`, `claimScreen`, `codeAvailability` para la vista vencida, `ClaimDeadline` alrededor; `generateMetadata` con `noindex`. Textos en `verification-texts.ts`
- [X] T026 [US1] `src/components/verification/phone-code-form.tsx`: con "número en uso", `router.replace(inUsePath)` (prop nueva) en lugar de montar `NumberInUseWays`; `code-entry-screen.tsx` y la página del código le pasan la ruta

**Punto de control**: el quickstart pasos 1 a 3 y 6 funcionan; los tests de T013 a T018 en verde.

---

## Fase 3: US2 — La cuenta anterior se entera y queda sin el número (P2)

**Meta**: la cuenta que pierde el número recibe el correo en el momento y ve el aviso en «Mi
perfil»; puede recuperarlo por el mismo camino.

**Prueba independiente**: spec.md §US2 Independent Test.

### Tests

- [X] T027 [P] [US2] `tests/db/phone-claims.test.ts`, parte de US2: A conserva su cambio a medias y su código vivo al perder el número; `number_lost_on` lo lee solo la dueña, y la dueña no puede actualizarlo ni borrar su fila; `check_phone_code` verificado lo limpia y devuelve `was_lost`; la purga, cancelar y "número en uso" no borran una fila con `number_lost_on`; recuperar el número de vuelta deja el aviso en la otra
- [X] T028 [P] [US2] `src/lib/verification/lost-notice.ts` + test: `lostNotice(row)` y `lostDayLabel(date)` con los casos de plan.md §Qué se testea
- [X] T029 [P] [US2] `src/lib/verification/code-check.ts` + test: `was_lost` agrega `phone_reverified_after_loss` a una verificación

### Correo y perfil

- [X] T030 [US2] `src/lib/supabase/queries/accounts.ts` (`getAccountEmail` con la clave de servicio) y `src/lib/email/send-number-lost.ts` (textos con el idioma explícito, `lostDayLabel`, enlace a `APP_URL/mi-perfil`, límite de 60 s con `Promise.race`, nunca lanza, log sin dirección ni id); `confirmPhoneClaim` lo llama en `after()` solo con `claimed`
- [X] T031 [P] [US2] `src/components/verification/number-lost-notice.tsx`: la nota con el sello «Sin verificar» y el día, con y sin el acceso a verificar
- [X] T032 [US2] `src/components/verification/phone-status-card.tsx` y `src/app/[locale]/(app)/mi-perfil/page.tsx`: sin teléfono con aviso, el aviso reemplaza el cuerpo; a medias con aviso, el aviso arriba del `PhoneNumberCard`; textos en `phone-status-texts.ts`
- [X] T033 [US2] `tests/e2e/telefono.spec.ts`: el flujo de plan.md §Qué se testea con dos cuentas nuevas por corrida (`uniqueEmail`, `uniqueNumber`), la segunda desde el aviso de la puerta hasta su destino (SC-007), incluida la privacidad del correo, el aviso de la primera cuenta al entrar con `linkFor`, y SC-008 en `/verificar-telefono/quedarme` con `tests/e2e/support/web-vitals.ts` (LCP, CLS y la tirita habilitada antes de 2,5 s)

**Punto de control**: el quickstart pasos 3 a 5 funcionan; T027 a T029 y T033 en verde.

---

## Fase 4: US3 — Entrar con la otra cuenta (P3)

**Meta**: «Entrar con esa cuenta» cierra esta sesión y lleva a «Entrar» con el destino.

**Prueba independiente**: spec.md §US3 Independent Test.

### Tests

- [ ] T034 [P] [US3] `src/lib/verification/notice.ts` + test: la marca `error=salir` da `verification.notice.sign_out_failed`

### Acción y pantalla

- [ ] T035 [US3] `src/lib/supabase/queries/session.ts`: `endSession(opts?)` devuelve `{ ok }` y acepta `scope`; `signOut` de `auth.ts` sigue igual
- [ ] T036 [US3] `src/actions/phone.ts`: `signInWithOtherAccount(form)` según contracts/actions.md (`scope: 'local'`, `dropClaim` solo con `ok` y con un reintento, `signInPath` o `inUsePath(gate, { error: 'salir' })`)
- [ ] T037 [US3] `number-in-use-ways.tsx`: el `<form action>` de «Entrar con esa cuenta» con `FormSubmit` `secondary`, la aclaración atada con `aria-describedby`, `onSubmit` que limpia el borrador del perfil, y `PhoneNotice` en la página `en-otra-cuenta` para el aviso de error

**Punto de control**: el quickstart paso 7 funciona; T034 en verde.

---

## Fase 5: Pulido

- [ ] T038 [P] `docs/10-design-system.md`: §Decisiones con el sello «Sin verificar» (2026-09-25); §Componentes con las filas de plan.md §Componentes y `NumberInUseWays` actualizado
- [ ] T039 [P] `docs/06-i18n.md` §Glosario: "quedarse con el número" (`claim`) y "prueba"
- [ ] T040 [P] `docs/known-limitations.md`: KL-028 resuelta por la historia #25
- [ ] T041 `node scripts/walk.mjs --user --story recuperar-numero-otra-cuenta /verificar-telefono/en-otra-cuenta /verificar-telefono/quedarme /mi-perfil` para el design-reviewer, a 390 y 1280
- [ ] T042 `pnpm mutation` al 100 % sobre los archivos con test tocados; cada mutante equivalente anotado en su línea con el motivo
- [ ] T043 `pnpm verify` en verde

---

## Dependencias

- Fase 1 antes que todo; dentro de ella, T001 → T004 → T005 en orden; T006 y T007 después de T005 (usan los tipos); T008 a T012 en cualquier momento.
- US1 (Fase 2) antes que US2 y US3: las dos se prueban sobre la pantalla y la prueba que construye.
- US2 y US3 no dependen entre sí; T033 (e2e) va al final de US2 porque recorre US1 y US2.
- Pulido al final.

## Paralelo

- Fase 1: T006 a T012 entre sí.
- US1: T013 a T018 entre sí; T020 y T021 entre sí. T021 → T022 → T023 en orden (`ClaimChoice` usa la vista vencida de T021, y `NumberInUseWays` usa `ClaimChoice` y `ClaimDeadline`).
- US2: T027 a T029 entre sí, y T031 con T030.

## Estrategia

MVP = Fase 1 + US1: con eso nadie queda trabado por un número que es suyo. US2 lo hace seguro
(que la cuenta anterior se entere) y US3 cierra KL-028. Se construye y verifica una user story por
vez, en ese orden, en el mismo PR.
