---
description: "Tareas de la historia #73 — Administrar el sitio desde un solo lugar"
---

# Tasks: Administrar el sitio desde un solo lugar: lo que espera, desde cuándo y los antecedentes de cada persona

**Input**: `specs/019-administrar-sitio-solo-lugar/` — spec.md, plan.md (§Diseño, §Qué se testea),
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

**Propósito**: tipos, rutas y textos base.

- [ ] T001 [P] Crear `src/lib/admin/types.ts` (`QUEUE_KEYS` `identity` `pets` `reports`, `QueueKey`, `QueueCount` `{ others, oldest, own }`, `OwnPending`, `QueueStanding`, `PersonRecord` con `RecordIdentity` `RecordReport` `RecordSuspension` `RecordPet`, `PersonResult`, `DigestClaim`, `AdminOrigin`, `RecordOrigin`) y `src/lib/admin/paths.ts` (`ADMIN_PATH = '/administrar'`, `personRecordPath(publicId, from?)`, `adminPathFrom(origin)`)
- [ ] T002 [P] Textos base en `messages/es.json`: `admin.*` (`nav`, `home`, `search`, `record`, `back`), `emails.admin_digest.*`, `metadata.admin.home` y `metadata.admin.record` (contracts §Textos), con voseo y las esperas como dice la spec

---

## Fase 2: Base compartida

**Propósito**: la migración y las lecturas que todas las user stories usan. Bloquea las fases 3 a 6.

- [ ] T003 Escribir `supabase/migrations/<ts>_admin_home.sql`: `admin_digest_sends` con RLS sin policies y `revoke all`; `private.fold_name`; `private.admin_queue_rows`; `admin_queue_count`, `admin_pending_total`, `admin_recent_counts`, `admin_person_record`, `admin_search_people` (`grant execute` a `authenticated`, `is_admin()` adentro); `claim_admin_digests` y `admin_digest_tick` (solo `service_role`); `cron.schedule('admin-digest', '0 11 * * *', ...)`; `drop`/`create` de `pet_review_queue` con `publisher_public_id`; policy `avatars_select_admin` (data-model.md)
- [ ] T004 `pnpm exec supabase db reset` y `pnpm db:types` para regenerar `src/lib/supabase/types.ts`
- [ ] T005 [P] Test `tests/db/admin-privacy.test.ts` (plan.md §Qué se testea): las cinco funciones de lectura devuelven nada (o `null`) a `anon`, a una persona y a quien administra suspendida; `claim_admin_digests` y `admin_digest_tick` no se ejecutan con `anon` ni `authenticated`; `admin_digest_sends` no se lee ni escribe con sesión; las claves del documento de la ficha son exactamente las de data-model (sin teléfono, correo, imágenes, solicitudes, bloqueos, opiniones, `reporter`, `resolved_by`); la propia ficha trae `own_open` y ningún reporte; quien administra firma un avatar ajeno y una persona no
- [ ] T006 [P] Crear `src/lib/supabase/queries/admin.ts` con `adminQueueCount(queue)`, `adminPendingTotal()`, `adminRecentCounts()`, `personRecord(publicId)`, `searchPeopleRows(query, limit)` y `claimAdminDigests()`, que mapean las filas a los tipos de T001 y lanzan con mensaje si la base falla
- [ ] T007 [P] Crear `src/lib/analytics/admin-events.ts` (+ `admin-events.test.ts`) con `admin_opened`, `admin_queue_overdue`, `admin_digest_sent` (y `digestSentEvent`, que arma el del resumen desde un `DigestClaim`), `admin_record_opened`, `admin_search_done` (contracts §Eventos) y sumarlos a `src/lib/analytics/events.ts`; el test afirma horas enteras y que ninguno lleva texto, nombres ni ids

**Checkpoint**: la base existe, nadie que no administra lee nada por ella, y los tipos están.

---

## Fase 3: User Story 1 — Administrar: qué espera, desde cuándo y qué se pasó de plazo (P1) 🎯 MVP

**Goal**: quien administra ve las tres colas con su número, su espera y su atraso, lo suyo aparte y
las tres entradas; el menú y Mi perfil llevan a Administrar con el número; las seis listas vuelven a
Administrar.

**Independent Test**: spec §US1 Independent Test.

### Tests de US1

- [ ] T008 [P] [US1] Test `tests/db/admin-rules.test.ts`, parte de las colas: cada cola cuenta lo de otras y deja lo propio en `own` (pedido, publicación con su nombre, reporte sin motivo); publicación de una suspendida y pedido vencido no cuentan; `oldest` es el más viejo de lo no propio; `admin_pending_total` es la suma; las cuentas de 7 días incluyen hoy y los 6 anteriores y no el séptimo
- [ ] T009 [P] [US1] Test `src/lib/admin/queues.test.ts` para `queueStanding` (sin pendientes, justo en el plazo, 1 ms después, por cola), `orderQueues` (atrasadas por cuánto se pasaron, empates, orden fijo) y `waitParts` (59 min, 1 h, 23 h 59, 24 h, 71 h 59, 72 h)
- [ ] T010 [P] [US1] Test `src/lib/admin/badge.test.ts` (`badgeCount`: 0, 1, 99, 100) y `src/lib/admin/origins.test.ts` (`parseAdminOrigin`: `menu`, `perfil`, `resumen`, otro, ausente, arreglo)

### Implementación de US1

- [ ] T011 [P] [US1] Crear `src/lib/admin/queues.ts` (`QUEUE_DEADLINE_HOURS`, `queueStanding`, `orderQueues`, `waitParts`), `src/lib/admin/badge.ts` y `src/lib/admin/origins.ts` (research R3, R9) hasta que T009 y T010 pasen con mutación al 100 %
- [ ] T012 [P] [US1] Crear `src/components/admin/admin-queue-row.tsx`, `admin-queue-board.tsx`, `own-pending-list.tsx` y `admin-entries.tsx` (plan.md §Diseño Administrar): reciben textos y datos por props, el renglón entero es enlace, el sello `warning` solo en la atrasada, «No se pudo contar» en la que falló
- [ ] T013 [US1] Crear `src/app/[locale]/(app)/administrar/_components/admin-texts.ts` (arma frases de cola, espera, atraso, lo propio y entradas con `messages/`) y `src/app/[locale]/(app)/administrar/page.tsx`, `loading.tsx` y `error.tsx`: `requireProfile(ADMIN_PATH)`, `notFound()` sin administrar, metadata `noindex` con el título escondido, `Promise.allSettled` de las tres colas y de las cuentas de 7 días, `admin_opened` y un `admin_queue_overdue` por cola atrasada; dos columnas desde 1024
- [ ] T014 [US1] Cambiar `src/app/[locale]/_components/account-menu.tsx`: con sesión, `adminPendingTotal()`; si no es `null`, `NavLink` «Administrar» con `badgeCount` y la etiqueta accesible, a `/administrar?desde=menu` sin precarga; en el teléfono, «Opinar» forma par con «Administrar» (plan.md §Diseño Menú)
- [ ] T015 [US1] Cambiar `src/app/[locale]/(app)/mi-perfil/_components/identity-section.tsx`: un solo `ReviewQueueLink` «Administrar (N)» a `/administrar?desde=perfil` en lugar de los seis; sin número si es 0 o si la cuenta falla
- [ ] T016 [US1] Crear `src/app/[locale]/(app)/_components/admin-back-link.tsx` y ponerlo arriba del título de `/revision`, `/revision/publicaciones`, `/revision/reportes`, `/revision/suspendidas`, `/revision/opiniones` y `/revision/encuestas`; los vacíos de `WorkQueue`/`ReviewQueueList`/`FeedbackList` vuelven a `ADMIN_PATH` con «Volver a Administrar»; `profileHref` de `ReviewDecision` en `/revision/[id]` pasa a `ADMIN_PATH`; borrar las claves `back_profile` que quedan sin uso

**Checkpoint**: Administrar funciona solo; el menú y Mi perfil llevan ahí; las seis listas vuelven ahí.

---

## Fase 4: User Story 2 — La ficha de una persona, con sus antecedentes y suspender o reactivar (P2)

**Goal**: desde cada lista se abre la ficha de una persona con sus cuatro partes, y desde ahí se la
suspende o reactiva con las reglas de #13.

**Independent Test**: spec §US2 Independent Test.

### Tests de US2

- [ ] T017 [P] [US2] Test `tests/db/admin-rules.test.ts`, parte de la ficha: rechazos dentro de 30 días y no el de 31; vencimiento en ventana; reportes sobre la persona con motivo, texto y cómo se cerraron; suspensiones con «una cuenta borrada» (quien suspendió borrada); publicaciones con su estado, «por revisar» y el motivo de baja, y la borrada ausente; nivel 0 sin teléfono; cuenta borrada → cero filas
- [ ] T018 [P] [US2] Test `src/lib/admin/origins.test.ts`, `parseRecordOrigin` (cada origen, otro, ausente)

### Implementación de US2

- [ ] T019 [P] [US2] Sumar `parseRecordOrigin` a `src/lib/admin/origins.ts` hasta que T018 pase con mutación al 100 %
- [ ] T020 [P] [US2] Crear `src/components/admin/person-record-header.tsx` (con el hueco `action`), `record-section.tsx` (con `ShowMoreLink`) y `record-entry.tsx` (con `href` y sello opcionales) (plan.md §Diseño Ficha)
- [ ] T021 [P] [US2] Crear `src/components/moderation/record-moderation.tsx` (cliente): «Suspender» abre `SuspendSheet` con `reportId: null`, o `ReactivateSheet` si está suspendida; al terminar, `router.refresh()`; lo que responde la base (`already`, `gone`, `not_admin`, `self`) con los textos de `moderation.errors`
- [ ] T022 [US2] Cambiar `src/lib/schemas/suspension.ts` (`origin?: 'record'`) y `src/actions/moderation.ts` (`account_suspended` con `from: 'record'`, `revalidatePath` de `ADMIN_PATH` y de la ficha en suspender y reactivar)
- [ ] T023 [US2] Crear `src/app/[locale]/(app)/administrar/personas/[publicId]/_components/record-texts.ts` y `page.tsx`, `loading.tsx`, `error.tsx`: `requireProfile`, `notFound()` sin administrar, `personRecord(publicId)`; sin fila, `HeadedEmptyState` «Esta cuenta ya no existe» con la vuelta; si no, cabecera (foto firmada con `signAvatarUrl`), las cuatro partes de a 20 con `shownCount`, `RecordModeration` salvo en la propia, `admin_record_opened`; dos columnas desde 1024
- [ ] T024 [US2] Nombres a la ficha: `listReviewQueue` suma `publicId` y `ReviewQueueList` lo enlaza; `pet-reviews.ts` lee `publisher_public_id` y Publicaciones por revisar lo enlaza; en Reportes, quien reportó y la reportada (salvo «una cuenta borrada» y lo propio); `SuspendedAccountRow` enlaza el nombre; cada enlace con su `?desde=`

**Checkpoint**: la ficha funciona sola desde cada lista y por su dirección.

---

## Fase 5: User Story 3 — El resumen de la mañana, solo si hay algo esperando (P3)

**Goal**: a las 8 de Uruguay, cada persona que administra con algo que puede resolver recibe un
correo sin datos de nadie, una sola vez por día.

**Independent Test**: spec §US3 Independent Test.

### Tests de US3

- [ ] T025 [P] [US3] Test `tests/db/admin-rules.test.ts`, parte del resumen: `claim_admin_digests` reclama a quien tiene algo, no a quien solo tiene lo suyo ni a una suspendida; la segunda llamada del día no reclama a nadie; purga lo de más de 7 días; `cron.job` tiene `admin-digest` con `0 11 * * *`
- [ ] T026 [P] [US3] Test `src/lib/admin/digest.test.ts` para `digestLines` (solo colas con algo, orden de `orderQueues`, «atrasada por», esperas con `waitParts`, ninguna línea con nombres); `digestSentEvent` (horas enteras, `overdue`) ya lo prueba T007

### Implementación de US3

- [ ] T027 [US3] Crear `src/lib/admin/digest.ts` (`digestLines`) hasta que T026 pase con mutación al 100 %
- [ ] T028 [US3] Crear `src/lib/email/send-admin-digest.ts` (`getAccountEmail`, `sendEmail` con `extras.lines`, `deliverNotice`, nunca lanza, el log sin dirección) y `src/app/api/cron/resumen/route.ts` (`isCronRequest`, `claimAdminDigests`, de a uno con 600 ms, `admin_digest_sent` por cada uno que sale, `204`) (contracts §Tarea, §Correo)

**Checkpoint**: el resumen sale una vez por día y solo a quien tiene algo.

---

## Fase 6: User Story 4 — Buscar a una persona por nombre (P4)

**Goal**: desde Administrar se encuentra a una persona por su nombre y se abre su ficha.

**Independent Test**: spec §US4 Independent Test.

### Tests de US4

- [ ] T029 [P] [US4] Test `tests/db/admin-rules.test.ts`, parte de la búsqueda: pliega tildes y mayúsculas («marta suarez» → «Marta Suárez»); exige 3 caracteres sin espacios; quien empieza así va primero; incluye suspendidas con la marca; 21 filas con más de 20; una cuenta borrada no aparece
- [ ] T030 [P] [US4] Test `src/lib/schemas/admin-search.test.ts` (`adminSearchSchema`: 2 y 3 caracteres, los espacios del medio no cuentan, recorte, 60/61) y `src/lib/admin/search-outcome.test.ts` (`searchOutcome`: cada resultado de la acción a su clave de texto)

### Implementación de US4

- [ ] T031 [P] [US4] Crear `src/lib/schemas/admin-search.ts` y `src/lib/admin/search-outcome.ts` hasta que T030 pase con mutación al 100 %
- [ ] T032 [US4] Crear `src/actions/admin.ts` con `searchPeople` (contracts §Acción): schema, `isAdmin`, `searchPeopleRows(query, 20)`, fotos firmadas, `more`, `admin_search_done`; nunca lanza
- [ ] T033 [US4] Crear `src/hooks/use-person-search.ts` y `src/components/admin/person-search.tsx` (cliente) y `person-result.tsx` (plan.md §Diseño Buscar): menos de 3 sin llamar a la acción, buscando, resultados, vacío, error de la acción o de la red con lo escrito intacto, «Buscar» reintenta; montar `PersonSearch` en Administrar con la acción por props

**Checkpoint**: las cuatro user stories funcionan solas.

---

## Fase 7: Pulido y transversal

- [ ] T034 [P] E2E `tests/e2e/administrar.spec.ts` (plan.md §Qué se testea: los dos flujos y el resumen por la ruta de la tarea), sembrando en el propio test la segunda «Ana Pérez», el reporte y la publicación propia de quien administra
- [ ] T035 [P] `docs/06-i18n.md` (glosario y namespace `admin`), `docs/10-design-system.md` §Componentes (los nuevos, `AccountMenu` con la decisión del par «Opinar»/«Administrar», `ReviewQueueLink`, `WorkQueue`, `SuspendedAccountRow`), `docs/07-stack.md` (el resumen por `pg_cron`, con fecha) y `docs/known-limitations.md` (el resumen que no salió no se reintenta; el plegado cubre las letras del español)
- [ ] T036 `vercel:react-best-practices` sobre los TSX nuevos; revisar que el menú no suma JS para quien no administra
- [ ] T037 Capturas: `node scripts/walk.mjs --story 019-administrar-sitio-solo-lugar --user /administrar /administrar/personas/<public_id> /revision/reportes /mi-perfil`
- [ ] T038 `pnpm gates:affected` y, al cerrar, `pnpm verify`; recorrer quickstart.md

---

## Dependencias y orden

- Fase 1 → Fase 2 → US1, US2, US3, US4. US2 usa `ADMIN_PATH` y `AdminBackLink` de US1 (T016) para la
  vuelta; US3 usa `queueStanding`, `orderQueues` y `waitParts` de US1 (T011); US4 monta su búsqueda en
  la pantalla de US1 (T013) y enlaza a la ficha de US2 (T023). Cada una se prueba sola con datos
  sembrados en sus tests.
- Dentro de cada US: tests y funciones puras [P] → queries → acciones → componentes → páginas.

## Paralelo

- Fase 1: T001, T002.
- Fase 2: T005, T006 y T007 después de T004.
- US1: T008, T009, T010 juntos; T011 y T012 juntos. US2: T017, T018; T019, T020, T021. US3: T025,
  T026. US4: T029, T030; T031.

## Estrategia

MVP = Fases 1–3 (Administrar). Después US2, US3 y US4, cada una con su checkpoint y
`pnpm gates:affected`.
