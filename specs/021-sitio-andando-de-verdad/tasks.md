---
description: "Tareas de la historia #169 — El sitio andando de verdad en una dirección provisoria"
---

# Tasks: El sitio andando de verdad en una dirección provisoria

**Input**: `specs/021-sitio-andando-de-verdad/` — spec.md, plan.md (§Qué se testea), research.md
(R1–R17), data-model.md, contracts/servicios.md, quickstart.md

**Tests**: sí, y solo los de plan.md §Qué se testea; no se agrega ninguno fuera de esa tabla ni se
saca ninguno. Lo que tiene test hermano se sostiene al 100 % de mutación (`pnpm mutation`).

**Organización**: por user story, en orden de prioridad. Ninguna pantalla cambia (plan §Diseño); antes
de tocar TSX se abre `docs/10-design-system.md` igual, y después de varios TSX se corre
`vercel:react-best-practices`. Antes de la migración y de los tests de base se carga
`supabase:supabase-postgres-best-practices`; antes de tocar la configuración de Auth,
`supabase:supabase`.

**`[CUENTAS]`**: la tarea necesita las cuentas de `quickstart.md` §A (Supabase en la nube, Vercel,
Twilio, PostHog, Sentry), que crea Hernán (docs/09 §Quién decide qué). Build no las espera: hace todo
lo demás, deja estas sin marcar y Ship estaciona la historia con el aviso de qué crear (plan §Para
Ship). Si las cuentas existen, se hacen en orden.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US6). Preparación, base y pulido no llevan etiqueta

---

## Fase 1: Preparación

**Propósito**: el entorno que usan todas las user stories, sin cambiar conducta.

- [X] T001 Sumar `SUPABASE_DB_URL`, `POSTHOG_PROJECT_KEY` y `SENTRY_DSN` a `.env.example` con su comentario (para qué, que van solo en Production de Vercel, que sin ellas no sale nada; research R16) y como opcionales a `src/lib/env.ts`
- [X] T002 [P] Sumar `.env.cloud` a `.gitignore` (research R15)

**Checkpoint**: `pnpm lint && pnpm typecheck` verdes.

---

## Fase 2: Base compartida

**Propósito**: mandar algo afuera después de responder, y solo donde corresponde. Lo usan US3, US4 y
US5.

- [X] T003 Escribir primero `src/lib/delivery/should-deliver.test.ts` según plan §Qué se testea (`shouldDeliver`: sin `VERCEL_ENV` no aunque haya clave; con `VERCEL_ENV` sin clave no; con las dos sí)
- [X] T004 Implementar `shouldDeliver(env)` en `src/lib/delivery/should-deliver.ts` y `deliver(send)` en `src/lib/delivery/deliver.ts` (`after()` de `next/server` dentro de un pedido, `void task()` si `after` lanza; cada envío con `AbortSignal.timeout(3000)` y su error tragado; research R9) hasta que T003 pase

**Checkpoint**: `pnpm test --project unit` verde.

---

## Fase 3: User Story 1 — El sitio de verdad en la dirección provisoria, fuera de los buscadores (P1) 🎯 MVP

**Goal**: el sitio corre en Vercel con su base en la nube, sin direcciones de prueba ni sembrados, y
nada es guardable por un buscador.

**Independent Test**: quickstart.md §B US1.

### Tests

- [X] T005 [P] [US1] Escribir primero `src/lib/seo/robots-headers.test.ts` según plan §Qué se testea
- [X] T006 [P] [US1] Escribir primero `scripts/deploy/build.test.mjs` según plan §Qué se testea (los comandos como lista, sin ejecutarlos)
- [X] T007 [P] [US1] Escribir `tests/db/phone-sign-in.test.ts`: como visitante, `signInWithOtp({ phone: '+59899123456' })` da error y no aparece ninguna persona con ese teléfono (data-model §Pruebas de base; research R14)

### Implementation

- [X] T008 [US1] Comprobar en la documentación vigente de Vercel si Node 26.x está para construcciones y funciones (research R4). Si está, anotarlo en research R4 y seguir. Si no, aplicar la decisión de R4: `engines.node` a `">=24"` en `package.json` (el campo `scripts` no se toca), correr `pnpm verify` con Node 24 en la máquina antes, y dejar la **Decisión (2026-10-10, enjambre)** en `docs/07-stack.md` y la KL en `docs/known-limitations.md`
- [X] T009 [P] [US1] Implementar `robotsHeaders(indexing)` en `src/lib/seo/robots-headers.ts` hasta que T005 pase, y usarla en `headers()` de `next.config.ts` con `INDEXING_ENABLED` (research R12)
- [X] T010 [US1] Implementar `scripts/deploy/build.mjs` hasta que T006 pase, con `buildSteps(env)` pura y exportada (lo que prueba T006) y un `main` que la ejecuta: con `VERCEL_ENV=production`, exige `SUPABASE_DB_URL` (nombra la que falta), corre `pnpm exec supabase db push --db-url "$SUPABASE_DB_URL"` (nunca `--include-seed`) y después `pnpm build`; en cualquier otro caso, solo `pnpm build` (research R3)
- [X] T011 [US1] Crear `vercel.json` con `$schema`, `buildCommand: "node scripts/deploy/build.mjs"`, `regions: ["fra1"]` y `git.deploymentEnabled: { "**": false, "main": true }` (contracts §6; el `crons` lo suma T056)
- [X] T012 [US1] Crear `docs/puesta-en-marcha.md` desde `quickstart.md` §A (con «Si algún día se prenden las direcciones de prueba») y su línea en `docs/README.md`
- [ ] T013 [US1] [CUENTAS] Puesta en marcha, pasos 1 a 7 y 11 de `docs/puesta-en-marcha.md` (Supabase en São Paulo, Auth con Google y teléfono apagado, primera migración a mano, Vercel con las variables, Vault, quien administra, Resend)
- [ ] T014 [US1] [CUENTAS] Comprobar US1 en vivo según quickstart.md §B US1 (incluye 8 días sin visitas, que se anota cuando se cumplan)

**Checkpoint**: `pnpm gates:affected` verde; con las cuentas, US1 se ve andando en el teléfono.

---

## Fase 4: User Story 2 — El código llega por mensaje de texto (P2)

**Goal**: el código sale por Twilio de verdad, con las reglas de #10.

**Independent Test**: quickstart.md §B US2.

- [X] T015 [US2] Leer `src/lib/sms/send-sms.ts` y `src/lib/sms/transport.ts` y confirmar que, con las tres `TWILIO_*` y contra una base que no es la local, el mensaje sale por Twilio con el texto de `messages/es.json` y que el número uruguayo y los topes se comprueban antes (FR-010, FR-011). Si algo depende de que la base sea la local de otra forma, corregirlo ahí; si no, no cambia nada
- [ ] T016 [US2] [CUENTAS] Paso 8 de `docs/puesta-en-marcha.md` (Twilio: Messaging Service con remitente para Uruguay, *Geographic Permissions* solo Uruguay, protección contra el bombeo prendida, las tres variables en Vercel)
- [ ] T017 [US2] [CUENTAS] Comprobar US2 en vivo según quickstart.md §B US2; con el primer mensaje real, cerrar KL-010 en `docs/known-limitations.md`

**Checkpoint**: con la cuenta, un celular del equipo llega a nivel 1.

---

## Fase 5: User Story 3 — La medición llega a su herramienta, con el origen de cada visita a una ficha (P3)

**Goal**: cada momento llega a PostHog EU sin datos de nadie, y la visita a una ficha dice de cuál de
ocho orígenes llegó.

**Independent Test**: quickstart.md §B US3.

### Tests

- [X] T018 [P] [US3] Escribir primero `src/lib/analytics/referrer-kinds.test.ts` según plan §Qué se testea
- [X] T019 [P] [US3] Escribir primero `src/lib/analytics/visit-origin.test.ts` según plan §Qué se testea
- [X] T020 [P] [US3] Escribir primero `src/lib/pets/share-url.test.ts` según plan §Qué se testea
- [X] T021 [P] [US3] Escribir primero `src/lib/analytics/posthog.test.ts` según plan §Qué se testea y contracts §1

### Implementation

- [X] T022 [P] [US3] Implementar `referrerKind(url)` y `hostMatches` con las tres listas de research R11 en `src/lib/analytics/referrer-kinds.ts` hasta que T018 pase
- [X] T023 [US3] Implementar `PET_VIEW_ORIGINS`, `PetViewOrigin`, `SHARE_MARK` y `petViewOrigin({ marked, referer, host, utmSource })` en `src/lib/analytics/visit-origin.ts` hasta que T019 pase (orden de research R11)
- [X] T024 [US3] Cambiar `pet_viewed` en `src/lib/analytics/events.ts` a `{ origin: PetViewOrigin }` de `visit-origin.ts`, y `petViewEvent` en `src/lib/analytics/listing-events.ts` a recibir `marked` y `utmSource` y usar `petViewOrigin` (sale la función privada `petViewOrigin` de ahí); actualizar los casos de `pet_viewed` en `src/lib/analytics/listing-events.test.ts` a los orígenes nuevos sin sacar ninguno; un lector de vista previa sigue dando `null` (FR-025)
- [X] T025 [US3] En `src/app/[locale]/(public)/animales/[code]/page.tsx`, leer `searchParams` (`desde`, `utm_source`) y pasarlos a `petViewEvent`; los metadatos (`canonical`, `og:*`) no leen la marca (contracts §4)
- [X] T026 [P] [US3] Implementar `?desde=compartir` en `shareUrl` de `src/lib/pets/share-url.ts` con `SHARE_MARK` hasta que T020 pase
- [X] T027 [US3] Actualizar `tests/e2e/animales.spec.ts` según plan §Qué se testea (el enlace copiado con la marca; el HTML con y sin la marca con la misma `canonical`, `og:url` y `og:image`)
- [X] T028 [US3] Implementar `posthogEvent({ event, props, visit, environment, now })` en `src/lib/analytics/posthog.ts` hasta que T021 pase
- [X] T029 [US3] En `record()` de `src/lib/analytics/track.ts`, con `shouldDeliver({ VERCEL_ENV, key: POSTHOG_PROJECT_KEY })`, mandar `posthogEvent(…)` con `deliver` a `https://eu.i.posthog.com/i/v0/e/`; sin eso, el `console.info` de hoy (research R5). Ningún punto de disparo cambia
- [X] T030 [US3] Escribir en `docs/03-mvp-features.md` §Métricas de éxito «Cómo se leen», una línea por métrica, con los nombres de momentos y propiedades confirmados contra `src/lib/analytics/events.ts` (plan §Docs que cambian)
- [ ] T031 [US3] [CUENTAS] Paso 9 de `docs/puesta-en-marcha.md` (PostHog EU, IP descartada, la clave en Vercel) y comprobar US3 en vivo según quickstart.md §B US3

**Checkpoint**: `pnpm gates:affected` verde (incluye el e2e de animales); `pnpm test` sin red.

---

## Fase 6: User Story 4 — El equipo se entera de cada error, sin los datos de la persona (P4)

**Goal**: cada falla que ve una persona, y la de un servicio o una tarea, llega a Sentry UE con
pantalla, paso y hora, sin datos de nadie.

**Independent Test**: quickstart.md §B US4.

### Tests

- [X] T032 [P] [US4] Escribir primero `src/lib/errors/scrub.test.ts` según plan §Qué se testea
- [X] T033 [P] [US4] Escribir primero `src/lib/errors/screen-name.test.ts` según plan §Qué se testea (las dos formas de ruta)
- [X] T034 [P] [US4] Escribir primero `src/lib/errors/is-fault.test.ts` según plan §Qué se testea
- [X] T035 [P] [US4] Escribir primero `src/lib/errors/envelope.test.ts` según plan §Qué se testea y contracts §2
- [X] T036 [P] [US4] Escribir primero `src/lib/schemas/errors.test.ts` según plan §Qué se testea
- [X] T037 [P] [US4] Escribir primero `src/lib/email/deliverable.test.ts` según plan §Qué se testea

### Implementation

- [X] T038 [P] [US4] Implementar `scrub` en `src/lib/errors/scrub.ts` hasta que T032 pase (research R10)
- [X] T039 [P] [US4] Implementar `SCREENS` y `screenName(path)` en `src/lib/errors/screen-name.ts` con un patrón por cada `page.tsx` de `src/app/[locale]` y las claves `other_screen`/`no_screen`, hasta que T033 pase
- [X] T040 [P] [US4] Implementar `isFaultKey` en `src/lib/errors/is-fault.ts` hasta que T034 pase
- [X] T041 [US4] Implementar `failureEnvelope` en `src/lib/errors/envelope.ts` hasta que T035 pase, y `reportFailure({ screen, step, error })` en `src/lib/errors/report.ts` (con `shouldDeliver({ VERCEL_ENV, key: SENTRY_DSN })`; sin eso, `console.error` como hoy; `deliver` dentro de un pedido; una variante que se espera para `onRequestError`)
- [X] T042 [US4] Crear `src/instrumentation.ts` con `onRequestError` que espera `reportFailure` con `screenName(context.routePath)` y el paso según `context.routeType`, sin usar `request.path` ni `request.headers` (research R10 vía 1)
- [X] T043 [US4] Sumar `failed(key, step, cause?)` a `src/actions/result.ts` (reporta solo si `isFaultKey`, con la pantalla del `referer`) y reemplazar en `src/actions/*.ts` cada `return { ok: false, error: '<…_failed | …errors.unknown>' }` por `return failed(…)` con su paso en inglés; los rechazos por regla quedan como están (research R10 vía 2)
- [X] T044 [US4] Implementar `clientFailureSchema` en `src/lib/schemas/errors.ts` hasta que T036 pase; crear `reportScreenFailure` en `src/actions/errors.ts` (valida, `screenName(path)`, paso `open_screen`, solo el nombre del error, devuelve `ActionResult<null>`) y `src/components/errors/report-client-failure.tsx` (hoja cliente, `return null`, `useEffect` que llama la acción solo si no hay `digest`); `ErrorScreen` en `src/app/[locale]/_components/error-screen.tsx` recibe `error` y la monta; los 27 `error.tsx` que usan `ErrorScreen` le pasan `error`; los 3 de `src/app/[locale]/(app)/solicitudes/**/error.tsx` montan `ReportClientFailure` directo (research R10 vía 4). Nada de lo que se ve cambia
- [X] T045 [US4] Implementar `isDeliverable` en `src/lib/email/deliverable.ts` hasta que T037 pase; en `src/lib/email/*.ts`, cuando el correo sale por Resend, saltear en silencio una casilla `!isDeliverable`, y donde hoy hay `console.error('[correo] …')` llamar además a `reportFailure` (pantalla de quien lo pidió o `no_screen` desde una tarea; paso `send_email`); en `src/lib/sms/send-sms.ts`, cuando el mensaje no sale, `reportFailure` con `phone_verification` / `request_code`, sin el número; en `src/app/api/cron/{publicaciones,identidad,resumen}/route.ts`, lo que hoy va a `console.error` también a `reportFailure` (`no_screen`, paso = la tarea) (research R10 vía 3, R15)
- [ ] T046 [US4] [CUENTAS] Paso 10 de `docs/puesta-en-marcha.md` (Sentry UE, IP no guardada, alerta al equipo, el DSN en Vercel) y comprobar US4 en vivo según quickstart.md §B US4

**Checkpoint**: `pnpm gates:affected` verde; la pantalla de error se ve igual (captura a 390 de una ficha que falla, para el design-reviewer).

---

## Fase 7: User Story 5 — Las tareas solas corren aunque nadie use el sitio (P5)

**Goal**: las dos limpiezas diarias, la vuelta anotada de cada tarea y el aviso de la que se atrasa.

**Independent Test**: quickstart.md §B US5.

### Tests

- [X] T047 [P] [US5] Escribir primero `src/lib/cron/stale-tasks.test.ts` según plan §Qué se testea
- [X] T048 [P] [US5] Escribir primero `src/lib/cron/is-cron-request.test.ts` según plan §Qué se testea (o ampliar el que exista, sin sacar casos)
- [X] T049 [US5] Escribir `tests/db/task-runs.test.ts` según data-model §Pruebas de base (después de T051)

### Implementation

- [X] T050 [P] [US5] Crear `TASKS` y `TaskName` en `src/lib/cron/tasks.ts` e implementar `staleTasks(runs, now)` en `src/lib/cron/stale-tasks.ts` hasta que T047 pase (data-model)
- [X] T051 [US5] Crear con `pnpm exec supabase migration new tareas_en_la_nube` la migración de data-model: `private.task_runs` y `private.task_alerts` con RLS sin políticas y la siembra de `TASKS`; las seis funciones con sus `revoke`/`grant`; la reagenda de los siete trabajos que existen (comandos copiados de sus migraciones + `select private.task_ran('<tarea>')`) y los cuatro nuevos. `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T052 [US5] Leer cada `*_tick` y cada `claim_*` que llaman las tareas (`pet_lifecycle_tick`, `expire_identity_requests`, `identity_expiry_mail_tick`, `run_follow_up_tick`, `admin_digest_tick`, `claim_pet_reminders`, `claim_pet_expiries`, `claim_follow_up_events`) y confirmar que toman lo vencido con `<= now()` y lo marcan antes de mandar (research R6, FR-042). Lo que no, se corrige en la migración de T051, con su caso en el test de base de esa tarea
- [X] T053 [US5] Ampliar `isCronRequest` en `src/lib/cron/is-cron-request.ts` a `Authorization: Bearer` hasta que T048 pase
- [X] T054 [US5] Crear `src/lib/supabase/queries/task-runs.ts` (`listTaskRuns`, `recordTaskRun`, `claimTaskAlert`, con el cliente de servicio)
- [X] T055 [US5] Crear `src/app/api/cron/limpieza/route.ts` y `src/app/api/cron/vigilancia/route.ts` según contracts §3 (la vigilancia con `POST` y `GET`, `staleTasks`, `claimTaskAlert` y `reportFailure`; con `GET`, además `recordTaskRun('vigilancia-diaria')`)
- [X] T056 [US5] Sumar a `vercel.json` `"crons": [{ "path": "/api/cron/vigilancia", "schedule": "0 10 * * *" }]` (contracts §6)
- [ ] T057 [US5] [CUENTAS] Comprobar US5 en vivo según quickstart.md §B US5 (la migración llega sola en el despliegue; el día sin vueltas y los 8 días se anotan cuando se cumplan)

**Checkpoint**: `pnpm gates:affected` verde (incluye la suite de base entera por la migración).

---

## Fase 8: User Story 6 — Privacidad y velocidad comprobadas contra el sitio de verdad (P6)

**Goal**: las mismas pruebas de privacidad y la misma medida de velocidad, contra la nube, con el
resultado en la historia.

**Independent Test**: quickstart.md §B US6.

- [X] T058 [US6] Leer los archivos de research R15 (`applications-privacy`, `application-responses-privacy`, `adoptions-privacy`, `phones`, `profiles`, `identity`, `phone-sign-in`) y confirmar que ninguno usa `sql()` por `/pg/query` ni cambia algo global; el que sí, sale de la lista con el motivo escrito en el script y su regla se cubre con otro archivo
- [X] T059 [US6] Crear `scripts/cloud/privacy-check.mjs` según research R15 (lee `.env.cloud`, se niega sin él o con una URL local, barre `prueba+…@example.test` antes y después, corre `vitest run --project db` con esos archivos y ese entorno, imprime la tabla regla por regla: pasó / falló / no corrió, más la fila manual de respaldos)
- [X] T060 [US6] Extraer la medida del peso de apertura de `tests/e2e/animales-rendimiento.spec.ts` a `tests/e2e/support/opening-weight.ts` sin cambiar lo que mide (el e2e la usa y sigue verde)
- [X] T061 [US6] Crear `scripts/cloud/speed-check.mjs <dirección> <código>` según research R15 (Lighthouse con los `settings` de `.lighthouserc.json`, tres corridas, mediana de LCP y nota; el peso de apertura con `opening-weight.ts`; tolera la salida de KL-001 si quedaron los resultados; imprime la tabla)
- [ ] T062 [US6] [CUENTAS] Correr los dos scripts contra el sitio de verdad y pegar las dos tablas, con la captura del plan del proyecto (gratuito, sin recuperación a un punto), como comentario en #169 (`gh issue comment 169`); si una regla falla o no corrió, la historia no se da por terminada (FR-051)

**Checkpoint**: los dos scripts corren en seco (sin `.env.cloud` se niegan con un mensaje claro).

---

## Fase 9: Pulido

- [X] T063 [P] `docs/07-stack.md`: filas «Analytics + feedback», «Errores» y «Tareas programadas» al día, y las **Decisión (2026-10-10, agente)** de plan §Docs que cambian (región UE, sin direcciones de prueba, migraciones en la construcción, sin SDK, la vigilancia)
- [X] T064 [P] `docs/known-limitations.md`: KL-016, KL-53-1 y KL-11-2 resueltas; KL-017 y KL-11-1 con la condición «se cierran con la comprobación de US6»; las nuevas de plan §Docs que cambian (momentos y avisos perdidos con el servicio caído, aplicación caída sin aviso de tareas, sin direcciones de prueba, fallas solo del navegador sin reportar)
- [X] T065 Correr `vercel:react-best-practices` sobre los TSX tocados (`error-screen.tsx`, `report-client-failure.tsx`, la ficha)
- [X] T066 `pnpm verify` una vez, al cerrar el build (sin red: nada sale a PostHog ni a Sentry); capturas con `node scripts/walk.mjs --story 169-sitio-andando-de-verdad` de una ficha y de la pantalla de error para el design-reviewer

---

## Dependencies & Execution Order

- **Preparación (F1)** → **Base (F2)** → user stories.
- **US1** no depende de otras. **US2** depende de US1 solo para la comprobación en vivo. **US3**
  depende de F2. **US4** depende de F2. **US5** depende de US4 (`reportFailure`) y de US1
  (`vercel.json`). **US6** depende de todas para la comprobación en vivo; sus scripts, solo de F1.
- Dentro de cada user story: los tests primero (fallan), después la implementación.
- Las `[CUENTAS]` van al final de su user story y, sin cuentas, quedan sin marcar (plan §Para Ship).

## Parallel Example

```text
# US3, los tests juntos:
T018 referrer-kinds.test.ts · T019 visit-origin.test.ts · T020 share-url.test.ts · T021 posthog.test.ts
# US4, las reglas puras juntas:
T038 scrub.ts · T039 screen-name.ts · T040 is-fault.ts
```

## Implementation Strategy

MVP = US1 (el sitio andando y fuera de buscadores). Después, en orden: US2, US3, US4, US5, US6.
Cada una cierra con `pnpm gates:affected` verde; `pnpm verify` una sola vez al final (T066). Sin
cuentas, todo lo que no es `[CUENTAS]` se construye y se prueba en local, y la historia se estaciona
con el aviso.
