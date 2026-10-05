---
description: "Tareas de la historia #13 — Reportar, bloquear y suspender"
---

# Tasks: Reportar, bloquear y suspender

**Input**: `specs/013-reportar-bloquear-suspender/` — spec.md, plan.md (§Diseño, §Qué se testea),
research.md (R1–R12), data-model.md, contracts/routes.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí. Todo lo
que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola. Antes de escribir JSX o CSS se carga `frontend-design:frontend-design` y se abre
`docs/10-design-system.md`; antes de la migración y de sus tests,
`supabase:supabase-postgres-best-practices`; antes de la puerta de sesión, `supabase:supabase`;
después de varios TSX, `vercel:react-best-practices`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Preparación, base y pulido no llevan etiqueta

---

## Fase 1: Preparación

**Propósito**: las constantes, los tipos y el componente que se mueve.

- [X] T001 [P] Crear `src/lib/moderation/rules.ts` (`REPORT_DETAILS_MAX = 1000`, `SUSPENSION_REASON_MAX = 1000`, `WITHHELD_MONTHS = 12`), `src/lib/moderation/types.ts` (`ReportReason` con las seis claves de research R5, `ReportResolution`, `AccountStanding` `active` `suspended` `unknown`, `ProfileView`, `ReportQueueItem`, `ReportHistoryEntry`, `SuspendedAccount`, `MyBlock`) y `src/lib/moderation/paths.ts` (`MY_BLOCKS_PATH`, `REPORTS_PATH`, `SUSPENDED_LIST_PATH`, `SUSPENDED_SCREEN_PATH`, `WITHHELD_PATH`, los flags `reportar`, `bloquear`, `bloqueo`)
- [X] T002 [P] Mover `src/components/pets/character-count.tsx` a `src/components/forms/character-count.tsx` y actualizar sus importaciones (`TakedownSheet`, `PetDescriptionField`) — research R11

---

## Fase 2: Base compartida

**Propósito**: la migración con la suspensión, el bloqueo y el reporte como datos, la puerta de
sesión y los textos que todas las user stories leen. Bloquea las fases 3 a 6.

- [X] T003 Escribir `supabase/migrations/<ts>_moderation.sql` (timestamp de hoy, después de `20260930235900`) con las cuatro tablas de data-model.md (checks, índices, RLS, `revoke all`, `grant select` y policies `to authenticated` donde dice), `private.is_suspended`, `private.withheld_lifetime`, el secreto `withheld_number_key` de Vault (`vault.create_secret(encode(gen_random_bytes(32), 'hex'), …)` si no existe), `private.number_hash` (HMAC-SHA-256), `private.number_withheld` y `public.my_account_standing()`, con sus `revoke`/`grant` explícitos
- [X] T004 En la misma migración, recrear lo que cambia por la regla de fondo (research R2): `private.has_level_two`, `private.pet_is_listed`, `private.is_admin`, `public.public_profile`, `public.my_vouches`, `public.pet_by_code` (cero filas con dueña suspendida para quien no es la dueña; `pet_share_card` y las fotos lo heredan de `pet_is_listed`), `pet_review_queue`, `count_pet_reviews`, `claim_pet_reminders`, `claim_pet_expiries`, `renew_by_link` (`invalid`), `renewal_link_view` (cero filas), y las policies `avatars_own` y `profiles_update_own` con `not private.is_suspended(...)` en su `with check` (research R4)
- [X] T005 `pnpm exec supabase db reset` y `pnpm db:types` → `src/lib/supabase/types.ts` (nunca a mano)
- [X] T006 [P] Test de `src/lib/moderation/standing-gate.ts` en `src/lib/moderation/standing-gate.test.ts`: `active` sigue; `suspended` y `unknown` van a la pantalla de suspendida; el inverso de la pantalla (`active` → «Mi perfil», `unknown` → error, sin sesión → ingresar)
- [X] T007 Implementar `src/lib/moderation/standing-gate.ts` hasta que T006 pase
- [X] T008 `getAccountStanding()` en `src/lib/supabase/queries/moderation.ts` (cacheada por pedido); `getSessionUser()` en `src/lib/supabase/queries/session.ts` aplica `standingGate` con `redirect`; `redirectIfSuspended()` en `src/lib/auth/redirect-if-suspended.ts`; `requireProfile` pasa por la puerta; `AccountMenu` lee con `lookupSession` (research R4)
- [X] T009 Llamar a `redirectIfSuspended()` al principio de cada `page.tsx` de `src/app/[locale]/(public)/` y `src/app/[locale]/(auth)/` y del Route Handler `src/app/[locale]/(public)/sigue-disponible/[token]/route.ts`; `src/actions/vouches.ts` aplica `standingGate` después de `lookupSession`
- [X] T010 [P] `src/lib/auth/session-gate.test.ts` (no en `tests/gates/`, que cambia solo con `reglas-aprobadas`; el `aviso` de Ship propone moverlo allí): la lista cerrada de quienes importan `lookupSession` y que cada `page.tsx` de `(public)`, `(app)` y `(auth)` y cada `route.ts` de `sigue-disponible` llama a `redirectIfSuspended(` o `requireProfile(` (plan.md §Compuerta)
- [X] T011 [P] `tests/db/moderation-support.ts`: personas con nivel 1, 2 y 3, quien administra, publicar, y suspender y bloquear **insertando las filas con el servicio** (así los tests de una fase no dependen de las funciones de otra), leer como `anon`, como otra persona y como quien administra
- [X] T012 [P] `tests/db/moderation-grants.test.ts` (plan.md §Permisos), la parte de esta fase: `anon` y `authenticated` no escriben en las cuatro tablas; una suspendida no sube avatar ni actualiza su perfil con su token. Cada fase siguiente suma a este archivo los permisos de sus funciones
- [X] T013 [P] Textos base en `messages/es.json`: `moderation.errors` y los `metadata.*` de las cinco pantallas nuevas (plan.md §Textos)
- [X] T014 [P] Sumar los seis eventos de research R10 a `src/lib/analytics/events.ts` con sus props tipadas; test de `src/lib/analytics/moderation-events.ts` en `src/lib/analytics/moderation-events.test.ts` (props exactas, un `report_closed` `suspended` por cada reporte que cierra una suspensión, y ninguna clave de identidad aunque la entrada la traiga); implementar hasta que pase

**Checkpoint**: la base sabe quién está suspendida y todo lo público lo respeta; la puerta corta;
`pnpm lint && pnpm typecheck && pnpm test` verde.

---

## Fase 3: User Story 1 — Reportar a una persona y que quien administra lo vea y lo cierre (P1) 🎯 MVP

**Objetivo**: quien ingresó reporta desde el perfil público; quien administra ve la lista con el
historial y cierra sin medidas.

**Prueba independiente**: spec.md §US1, «Independent Test».

### Tests de US1

- [X] T015 [P] [US1] Test de `src/lib/schemas/report.ts` en `src/lib/schemas/report.test.ts`: los seis motivos y uno inválido; «otro» sin texto, con espacios solo, con 1000 y con 1001; un motivo que no es «otro» guarda el texto vacío como nulo; `publicId` mal formado
- [X] T016 [P] [US1] Test de `src/lib/moderation/safety-actions.ts` en `src/lib/moderation/safety-actions.test.ts`: ninguno en el propio; reportar y bloquear con y sin sesión; suspender solo para quien administra; en el perfil bloqueado, desbloquear, reportar y suspender para quien administra
- [X] T017 [P] [US1] Test de `src/lib/moderation/report-actions.ts` en `src/lib/moderation/report-actions.test.ts`: propio, cuenta ya suspendida, cerrado por otra persona, cuenta que ya no existe, caso común
- [X] T018 [P] [US1] Test de `src/lib/moderation/report-age.ts` en `src/lib/moderation/report-age.test.ts`: horas redondeadas (59 min, 1 h, 23 h, 24 h, mismo minuto = 0). «Hace N horas/días» es `waitingFor` de `lib/pets/waiting-for.ts`, que ya existe con su test (#59)
- [X] T019 [P] [US1] `tests/db/moderation-reports.test.ts` (plan.md §Base): crear, duplicado, otro motivo, de nuevo después de cerrado, `self`, `not_found` y `created` con bloqueo para una suspendida, el check de «otro»; `report_queue` ordenada con historial y `reporter_suspended`, lo propio solo como contador; `close_report` `own`, `closed`, `gone`, `not_admin` (también suspendida que administra); borrar a quien reportó y a la reportada; privacidad en las dos caras, incluida quien administra reportada leyendo `reports` directo

### Implementación de US1

- [X] T020 [US1] En la migración: `create_report`, `report_queue`, `count_open_reports` y `close_report` (research R5); sumar sus permisos a `tests/db/moderation-grants.test.ts` (`create_report` no ejecutable por `anon` ni `authenticated`); `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T021 [P] [US1] `src/lib/schemas/report.ts`, `src/lib/moderation/safety-actions.ts`, `src/lib/moderation/report-actions.ts` y `src/lib/moderation/report-age.ts` hasta que T015–T018 pasen
- [X] T022 [US1] Queries en `src/lib/supabase/queries/moderation.ts`: `createReport`, `listReportQueue`, `countOpenReports`, `closeReport`
- [X] T023 [US1] `reportPerson` y `closeReport` en `src/actions/moderation.ts` (contracts/routes.md), con `person_reported` y `report_closed`
- [X] T024 [P] [US1] Componentes de `src/components/moderation/`: `profile-safety-actions.tsx` (cáscara + parte viva), `report-sheet.tsx`, `report-sent.tsx`, `anonymity-note.tsx` — plan.md §Perfil público y §Reportar
- [X] T025 [US1] `src/components/profile/public-profile-layout.tsx` gana el hueco `safety`; `src/app/[locale]/(public)/perfil/[id]/page.tsx` compone `ProfileScreen` (`_components/profile-screen.tsx`) con `ProfileSafetyActions`; `?reportar=1` abre el reporte al volver de ingresar
- [X] T026 [P] [US1] Componentes `report-item.tsx`, `report-history.tsx`, `report-decision.tsx`, `close-report-dialog.tsx`, `own-reports-line.tsx` en `src/components/moderation/` — plan.md §Reportes. La lista es `WorkQueue` y el aviso `AnnounceNotices` (`components/forms/`), extraídos de `PetReviewQueue` y `PetReviewNotices` en su segundo uso
- [X] T027 [US1] `src/app/[locale]/(app)/revision/reportes/page.tsx` · `loading.tsx` · `error.tsx` (sin administrar → `notFound()`, `generateMetadata` con `noindex`); el acceso «Revisar reportes (N)» en `src/app/[locale]/(app)/mi-perfil/_components/identity-section.tsx`
- [X] T028 [P] [US1] Textos `moderation.report` y `moderation.reports` en `messages/es.json`

**Checkpoint**: US1 se prueba sola con el «Independent Test» de la spec.

---

## Fase 4: User Story 2 — Suspender una cuenta y reactivarla (P2)

**Objetivo**: quien administra suspende con motivo desde un reporte o desde el perfil, la
suspendida ve solo su pantalla, y la reactivación devuelve todo como estaba.

**Prueba independiente**: spec.md §US2, «Independent Test».

### Tests de US2

- [X] T029 [P] [US2] Test de `src/lib/schemas/suspension.ts` en `src/lib/schemas/suspension.test.ts`: motivo vacío, solo espacios, 1000, 1001; `reportId` opcional y uuid
- [X] T030 [P] [US2] `tests/db/moderation-suspension.test.ts` (plan.md §Base): suspender cierra reportes y retira el pedido con sus imágenes; `self`, `already`; después, cada lectura de R2 sin la suspendida (perfil, listado con y sin sesión, ficha, vista previa, fotos, niveles, `my_vouches`, revisión, recordatorios, vencimientos, `renew_by_link`, `renewal_link_view`, `is_admin`); `not_admin` y `gone` en `suspend_account` y `reactivate_account` (FR-032); `my_account_standing` solo para ella; reactivar devuelve todo y corre el vencimiento lo que duró la suspensión (una vencida antes sigue vencida); `already`, `gone`; privacidad en las dos caras de `account_suspensions`
- [X] T031 [P] [US2] Test de `deliverNotice` en `src/lib/email/deliver-notice.test.ts` (su propio archivo: Stryker muta el archivo entero): con el envío fallando o pasando el plazo no lanza y devuelve `sent: false`; bien, `sent: true` (FR-031)

### Implementación de US2

- [X] T032 [US2] En la migración: `suspend_account` (devuelve los reportes que cerró con su `created_at`), `reactivate_account` (con el corrimiento de research R3) y `suspended_accounts`; `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T033 [P] [US2] `src/lib/schemas/suspension.ts` hasta que T029 pase
- [X] T034 [US2] Queries `suspendAccount`, `reactivateAccount`, `listSuspendedAccounts` en `src/lib/supabase/queries/moderation.ts`
- [X] T035 [US2] `src/lib/email/send-suspension-notice.ts` (los dos correos de contracts/routes.md, `withDeadline`, y `deliverNotice` hasta que T031 pase) y textos `emails.account_suspended` / `emails.account_reactivated`
- [X] T036 [US2] `suspendAccount` y `reactivateAccount` en `src/actions/moderation.ts` (el correo por `deliverNotice`, sin mirar su resultado), con `account_suspended`, `account_reactivated`, un `report_closed` `suspended` por cada reporte cerrado, y la revalidación de `/animales`, `/` y el perfil
- [X] T037 [P] [US2] Componentes `suspend-sheet.tsx`, `suspended-account-row.tsx` (la lista es `WorkQueue`), `reactivate-sheet.tsx`, `suspended-screen.tsx` en `src/components/moderation/` — plan.md §Suspender, §Cuentas suspendidas, §Cuenta suspendida
- [X] T038 [US2] `PaperFrame` gana `menu?: boolean`; grupo `src/app/[locale]/(suspended)/` con `layout.tsx` y `cuenta-suspendida/page.tsx` (`generateMetadata` con `noindex`) · `loading.tsx` · `error.tsx` (el inverso de la puerta, research R4), con `DeleteAccountDialog` y `SignOutForm`
- [X] T039 [US2] `src/app/[locale]/(app)/revision/suspendidas/page.tsx` (`generateMetadata` con `noindex`) · `loading.tsx` · `error.tsx`, con el `Toast` «Suspendiste a {nombre}» cuando llega `?suspendida=`; «Suspender» en `ProfileScreen` y en `ReportDecision` (en `BlockedScreen` llega con T050, que crea la pantalla); el acceso «Cuentas suspendidas» en `identity-section.tsx`
- [X] T040 [P] [US2] Textos `moderation.suspend`, `moderation.suspended_list`, `moderation.suspended_screen` en `messages/es.json`
- [X] T041 [US2] `tests/e2e/suspension.spec.ts` (plan.md §Flujo crítico): reporte → suspensión → Ana con sesión vieja navega sin recargar y cae en su pantalla → el enlace de un animal dice que no está publicado → reactivar → vuelve la ficha

**Checkpoint**: US1 y US2 se prueban solas; el flujo crítico pasa contra `next start`.

---

## Fase 5: User Story 3 — Bloquear y desbloquear a una persona (P3)

**Objetivo**: quien bloquea deja de ver el perfil y los animales de la otra persona, los avales
entre las dos se borran, y la bloqueada no se entera.

**Prueba independiente**: spec.md §US3, «Independent Test».

### Tests de US3

- [X] T042 [P] [US3] Test de `src/lib/moderation/profile-view.ts` en `src/lib/moderation/profile-view.test.ts`: `profile` · `blocked` · `not_found` para cada combinación de dueña, bloqueó, la bloquearon, suspendida, existe (FR-017, FR-017a)
- [X] T043 [P] [US3] Test de `src/lib/pets/pet-page-state.ts` (cambia) en `src/lib/pets/pet-page-state.test.ts`: `blocked` gana sobre `listed` para quien bloqueó y no para la dueña
- [X] T044 [P] [US3] `tests/db/moderation-blocks.test.ts` (plan.md §Base): bloquear borra avales de las dos direcciones sin escribir `vouch_blocks`; `give_vouch` `unavailable`; desbloquear permite avalar salvo una quita; `listed_pets` sin esos animales con total y páginas de 24 completas; la bloqueada ve los de quien la bloqueó; `pet_by_code` `blocked` sin datos; `blocked_profile` solo para quien bloqueó, también suspendida; borrar cualquiera borra el bloqueo; `pet_review_queue` y `report_queue` no cambian por un bloqueo de quien administra (FR-015a); privacidad en las dos caras de `blocks`

### Implementación de US3

- [X] T045 [US3] En la migración: `block_person`, `unblock_person`, `my_blocks`, `blocked_profile`; `vouch_standing` recreada con `viewer_blocked_target` y `target_blocked_viewer`; `give_vouch` con `unavailable`; `listed_pets` con el filtro de quien mira; `pet_by_code`: se edita la definición que escribió T004 (no se recrea otra) para sumar `blocked` para quien bloqueó (research R7); sumar sus permisos a `tests/db/moderation-grants.test.ts`; `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T046 [P] [US3] `src/lib/moderation/profile-view.ts` y el cambio de `src/lib/pets/pet-page-state.ts` hasta que T042 y T043 pasen
- [X] T047 [US3] Queries `blockPerson`, `unblockPerson`, `listMyBlocks`, `getBlockedProfile` en `src/lib/supabase/queries/moderation.ts`; `vouch_standing` en `src/lib/supabase/queries/vouches.ts`; `getPublicPet` con `blocked` en `src/lib/supabase/queries/listed-pets.ts`
- [X] T048 [US3] `blockPerson` y `unblockPerson` en `src/actions/moderation.ts` (`unblockPerson` devuelve `{ already: true }` con `absent`, que la pantalla dice «Ya estaba desbloqueada»), con `person_blocked` y `person_unblocked`; `reportPerson` ya lee `blockedAlready` de `create_report` (US1); `unavailable` → `vouches.errors.unavailable` en `src/actions/vouches.ts`
- [X] T049 [P] [US3] Componentes `block-dialog.tsx`, `blocked-profile.tsx`, `unblock-button.tsx`, `my-blocks-list.tsx`, `my-block-row.tsx`, `my-blocks-empty.tsx` en `src/components/moderation/`; `PetUnavailable` gana `blocked` — plan.md §Bloquear, §Animal de alguien que bloqueaste, §Mis bloqueos
- [X] T050 [US3] `perfil/[id]/page.tsx` elige con `profileView` entre `ProfileScreen`, `BlockedScreen` (`_components/blocked-screen.tsx`) y `notFound()`; `VouchSlot` `ninguno` para la bloqueada; `?bloquear=1` y `?bloqueo=hecho`; la ficha `/animales/{code}` con la rama `blocked`
- [X] T051 [US3] `src/app/[locale]/(app)/mis-bloqueos/page.tsx` (`generateMetadata` con `noindex`) · `loading.tsx` · `error.tsx`; «Mis bloqueos» en `PublicProfileLinks` de «Mi perfil»
- [X] T052 [P] [US3] Textos `moderation.block` (con «Ya estaba desbloqueada»), `moderation.my_blocks` y `vouches.errors.unavailable` en `messages/es.json`

**Checkpoint**: US1 a US3 se prueban solas.

---

## Fase 6: User Story 4 — El número de una cuenta suspendida no vuelve verificado en otra (P4)

**Objetivo**: el número de una suspendida, y el de una suspendida que se borró durante 12 meses, no
se verifica en ninguna otra cuenta.

**Prueba independiente**: spec.md §US4, «Independent Test».

### Tests de US4

- [X] T053 [P] [US4] `tests/db/withheld-numbers.test.ts` (plan.md §Base): `check_phone_code` → `withheld` sin prueba; `claim_phone_number` con prueba previa → `withheld`; borrar una suspendida guarda solo el hash (que no es el SHA-256 desnudo) y la fecha a 12 meses, nada si no estaba suspendida o no tenía número; con el secreto quitado la cuenta se borra igual; `until` vencido deja verificar; `purge_withheld_numbers`; reactivar vuelve a `in_use`; paridad de `withheld_lifetime()` con `WITHHELD_MONTHS`; nadie lee `withheld_numbers`

### Implementación de US4

- [X] T054 [US4] En la migración: `check_phone_code` recreada con `withheld`, `claim_phone_number` con `withheld`, el trigger `private.retain_suspended_number` en `auth.users` (nunca bloquea el borrado), `purge_withheld_numbers` y su `cron.schedule` diario (research R8); sumar el permiso de `purge_withheld_numbers` a `tests/db/moderation-grants.test.ts`; `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T055 [US4] `src/lib/supabase/queries/phones.ts` y `src/actions/phone.ts`: `withheld` redirige a `/verificar-telefono/no-se-puede-usar` con el `para` de siempre
- [X] T056 [P] [US4] `src/components/verification/number-withheld-screen.tsx` y `src/app/[locale]/(app)/verificar-telefono/no-se-puede-usar/page.tsx` (`generateMetadata` con `noindex`); textos `verification.withheld` — plan.md §Ese número no se puede usar

**Checkpoint**: las cuatro user stories se prueban solas.

---

## Fase 7: Pulido

- [ ] T057 [P] `docs/10-design-system.md`: las filas nuevas y las que cambian (plan.md §Docs que cambian)
- [ ] T058 [P] `docs/06-i18n.md` §Glosario: los términos de research R12
- [ ] T059 [P] `docs/07-stack.md`: las decisiones de research R4 y R8, con fecha
- [ ] T060 [P] `docs/known-limitations.md`: KL-13-1, KL-13-2, KL-13-3 con su condición de reapertura
- [ ] T061 Medir la puerta con `tests/e2e/perfil-rendimiento.spec.ts` y `animales-rendimiento.spec.ts` con sesión, y la portada `/` con sesión, contra el presupuesto de docs/07 (research R4, Costo)
- [ ] T062 `node scripts/walk.mjs --story reportar-bloquear-suspender` con las rutas nuevas y las que cambian, a 390 y 1280 px
- [ ] T063 Recorrer quickstart.md de punta a punta, contando los toques del reporte (SC-001: abrir, elegir, enviar)
- [ ] T064 `pnpm verify` completo y `pnpm mutation` al 100 % sobre los archivos con test

---

## Dependencias y orden

- Fase 1 → Fase 2 → Fases 3 a 6 en orden de prioridad (US1 → US2 → US3 → US4) → Fase 7.
- US2 usa el reporte de US1 para «cerrar suspendiendo», pero también se prueba desde el perfil.
- US4 depende de la suspensión de US2.
- Dentro de cada fase, los tests van antes de su implementación y deben fallar primero.
- [P] marca archivos distintos sin dependencias pendientes.
