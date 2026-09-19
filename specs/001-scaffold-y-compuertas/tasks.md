# Tasks: Scaffold y compuertas

**Input**: Design documents from `specs/001-scaffold-y-compuertas/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: sí, los cuatro grupos que `plan.md` §Qué se testea justifica contra `docs/09` §Qué vale
la pena testear. Nada más: esta historia no deja ningún archivo con test bajo `src/`.

**Organization**: por user story en orden de prioridad (US1 → US6), cada grupo con sus tareas de
prueba, y una fase final de pulido. Cada user story cierra con su commit.

## Format: `[ID] [P?] [Story] Descripción`

- **[P]**: puede correr en paralelo con las otras `[P]` del mismo bloque (archivos distintos, sin
  dependencia entre ellas)
- Cada tarea nombra su archivo

---

## Fase 1: US1 — Un proyecto que arranca y una sola orden que lo valida (P1)

**Meta**: `pnpm verify` corre las siete etapas en orden y la CI corre las mismas siete.

- [X] T001 [US1] Verificar de nuevo cada versión de `research.md` con `npm view` antes de instalar;
      si alguna cambió, gana la del día y se anota (FR-048)
- [X] T002 [US1] `create-next-app@latest` en un directorio temporal del scratchpad: TypeScript, App
      Router, Tailwind, `src/`, alias `@/*`, pnpm, sin ESLint
- [X] T003 [US1] Mover el scaffold a la raíz comparando contra los archivos preexistentes; integrar
      o descartar lo que el generador agregue por su cuenta y anotar la decisión para el PR (FR-007)
- [X] T004 [US1] `tsconfig.json` en `strict`, con `tests/gates/fixtures/**` en `exclude`
- [X] T004b [US1] La estructura de `CLAUDE.md` §Estructura bajo `src/app/[locale]/`, **sin** crear
      `loading.tsx`, `error.tsx` ni los grupos de ruta `(public)`/`(auth)`/`(app)`: ninguna ruta
      carga datos y esos archivos llegan con sus historias (FR-001)
- [X] T005 [P] [US1] `src/lib/config.ts` con `APP_NAME` y `APP_URL` (FR-002)
- [X] T006 [P] [US1] `src/lib/env.ts`: lee el entorno y lanza nombrando la variable que falta y cómo
      obtenerla (FR-025, dueño de US3-AC6)
- [X] T007 [P] [US1] `.env.example` con las tres variables y su comentario (FR-009)
- [X] T008 [US1] `scripts/verify.mjs`: las siete etapas como datos, en orden, corte en la primera
      falla propagando su código, y resumen final leyendo `.verify-skips.json` (FR-004, FR-005)
- [X] T009 [US1] Los doce scripts de `package.json` con los nombres exactos de `CLAUDE.md`
      §Comandos, incluido `mutation:all` (FR-003)
- [X] T010 [US1] `ci.yml`: sacar «Detect the project» **y sus catorce condiciones** (doce simples y
      dos que conservan su `always()`), cambiar la acción de Lighthouse por `pnpm lighthouse`, sacar
      el condicional de Playwright, fijar la versión del Supabase CLI (FR-047). El resultado es la
      paridad que pide FR-006: mismas siete etapas, mismo orden, un paso por etapa, sin condicionales
- [X] T011 [US1] Correr `pnpm lint && pnpm typecheck && pnpm test` y commitear:
      `feat(scaffold): next.js project with the twelve verify stages`

**Checkpoint**: las siete etapas existen y corren, aunque casi todas no tengan nada que verificar.

---

## Fase 2: US2 — Las reglas del repo son checks, y se los vio fallar (P2)

**Meta**: las 14 filas mecanizables más la nueva, y las ocho reglas demostradas con la
configuración real.

- [X] T012 [US2] `oxlint --help` para confirmar la clave y el flag del lint con tipos antes de
      fijarlos; si no existen, es un hallazgo para Hernán, no un silencio (§Riesgos)
- [X] T013 [US2] `.oxlintrc.json`: plugins (typescript, react, next, jsx-a11y, import, vitest), las
      reglas de la tabla de `docs/09`, `max-lines` 150 como **warning**, y
      `typescript/no-floating-promises` y `no-misused-promises` nombradas explícitamente porque son
      opt-in (FR-010, FR-011)
- [X] T014 [US2] Los `overrides` de capas con globs `**/src/…` en los cuatro sentidos de la fila 4,
      con el del cliente acotado a `**/src/**` para que `tests/db/roles.ts` pueda importarlo
- [X] T015 [P] [US2] `tools/oxlint-rules/no-hex-color-in-component.mjs`
- [X] T016 [P] [US2] `tools/oxlint-rules/no-use-client-in-route-entry.mjs`
- [X] T017 [US2] `tools/oxlint-rules/index.mjs` y su registro en `jsPlugins`
- [X] T018 [P] [US2] Prettier y `.prettierignore`, con `tests/gates/fixtures/**` listado
- [X] T019 [P] [US2] `renovate.json`
- [X] T020 [P] [US2] `scripts/check-service-key.mjs`: recorre los archivos versionados y falla
      nombrando archivo, línea y cuál de las tres cosas encontró (FR-023)
- [X] T021 [US2] Script `lint`: `prettier --check .`, el check de la clave,
      `renovate-config-validator`, y `oxlint --type-aware src scripts tools tests
      --ignore-pattern "tests/gates/fixtures/**"` (FR-004, FR-012, FR-014, FR-018)
- [X] T022 [US2] Agregar a `docs/09` §Compuertas la fila de la clave de servicio y la segunda
      categoría de anotación de mutantes con su forma exacta (FR-046)
- [X] T023 [US2] `lefthook.yml`: formato con `stage_fixed`, y `oxlint` (excluyendo los fixtures de
      los archivos preparados), `tsc` y el subconjunto rápido de pruebas en paralelo (FR-015)
- [X] T024 [US2] Un fixture primero —`use-client-entry`— y verificar que los globs `**/src/…`
      matcheen su árbol antes de escribir los otros siete
- [X] T025 [US2] Los ocho pares `fixtures/<regla>/{bad,good}/src/…` espejando la ruta real que cada
      regla vigila
- [X] T026 [US2] `tests/gates/gates.test.ts`: por regla, invoca oxlint con la configuración real sin
      el `--ignore-pattern`, y afirma salida distinta de 0 **con al menos un diagnóstico que nombra
      la regla** sobre `bad/`, y verde sobre `good/` (FR-013)
- [X] T027 [US2] `vitest.config.ts` con `tests/gates/fixtures/**` fuera del `include`
- [X] T028 [US2] Correr `pnpm lint && pnpm typecheck && pnpm test` y commitear:
      `feat(gates): every mechanisable rule as a check, with its demonstration`

**Checkpoint**: apagar una regla en `.oxlintrc.json` pone la compuerta roja.

---

## Fase 3: US3 — Base local y arnés para probar privacidad (P3)

**Meta**: la base local sin tablas del producto, los tipos sin deriva, y los tres roles.

- [X] T029 [US3] `supabase init` y `supabase start` (la primera vez baja imágenes)
- [X] T030 [US3] Migración con `public.whoami()`: `security invoker`, `execute` a los roles anónimo
      y autenticado, y su registro para el PR como objeto no-producto (FR-022)
- [X] T031 [P] [US3] `supabase/seed.sql` con su línea de propósito y ninguna persona (FR-019,
      FR-042: esta historia no guarda datos de ninguna persona real)
- [X] T032 [P] [US3] `src/lib/supabase/client.ts`: fábrica de clientes, sin sesión de app (FR-020)
- [X] T033 [US3] `scripts/db-types.mjs` y el script `db:types`: captura la salida del CLI y la
      escribe con LF, sin redirección de shell (FR-021)
- [X] T034 [US3] `tests/setup/env-report.ts`: carga `.env.local` en `process.env`, sondea la base
      una vez, omite con aviso en la máquina, falla en CI, y escribe `.verify-skips.json`
      (FR-024, FR-025)
- [X] T035 [US3] `tests/db/roles.ts`: `anonClient()`, `asNewUser()` con su `cleanup`, y
      `serviceClient()` (FR-022)
- [X] T036 [US3] `tests/db/roles.test.ts`: llama `whoami()` con cada rol y afirma las tres
      identidades; `cleanup` en `afterEach` para que corra también al fallar
- [X] T037 [US3] `tests/db/types-drift.test.ts`: genera a un temporal, normaliza los finales de
      línea de los dos lados, compara
- [X] T038 [US3] Verificar los cuatro estados de la tabla de `quickstart.md`: con todo, sin base ni
      `.env.local`, con base y sin `.env.local`, y el caso de CI
- [X] T039 [US3] Correr `pnpm lint && pnpm typecheck && pnpm test` y commitear:
      `feat(db): local database and the privacy test harness`

**Checkpoint**: `pnpm verify` sigue verde con y sin base, y dice en voz alta qué omitió.

---

## Fase 4: US4 — El sistema de diseño y el idioma existen como código (P4)

**Meta**: los 47 tokens, la tipografía propia, el idioma, y las once primitivas.

- [X] T040 [US4] `src/styles/globals.css`: los 47 tokens una sola vez, con los de namespace de
      Tailwind en `@theme` y el resto como custom properties, más `--spacing: 4px` (FR-026, FR-027)
- [X] T041 [US4] `.lift`, `.press`, `.shimmer`, los keyframes de entrada y salida de `Sheet`,
      `Dialog` y `Toast`, y el bloque `prefers-reduced-motion` que apaga todo (FR-032)
- [X] T042 [US4] `tests/gates/tokens.test.ts`: lee `docs/10` §Tokens y falla por nombre faltante,
      valor distinto o token de más (SC-005)
- [X] T043 [P] [US4] `src/lib/i18n/routing.ts` y `request.ts`, y `src/proxy.ts`, con español sin
      prefijo (FR-028)
- [X] T044 [P] [US4] `messages/es.json` con el namespace `common`, y el tipo `IntlMessages` para que
      una clave inexistente falle `typecheck` (FR-029, US4-AC7)
- [X] T045 [US4] `layout.tsx`: Bricolage Grotesque por `next/font/google` como `--font-sans`, y
      `metadata` con `title` desde `APP_NAME` y `metadataBase` desde `APP_URL`. Sin
      `NextIntlClientProvider` (FR-027, constitución §VII)
- [X] T046 [US4] ~~`pnpm dlx shadcn@4.21.0` para las ocho con equivalente~~ **No se hizo, a
      propósito**: ver `plan.md` §Desvíos al construir. Las primitivas están a mano sobre Radix
- [X] T047 [US4] Reescribir las ocho con tokens y `cva`: `button`, `input`, `textarea`, `select`,
      `card`, `sheet`, `dialog`, `skeleton` (FR-030, FR-031)
- [X] T048 [P] [US4] `chip.tsx` a mano
- [X] T049 [P] [US4] `empty-state.tsx` a mano, con su SVG inline
- [X] T050 [US4] `toast.tsx` sobre `@radix-ui/react-toast`, con `success` y `error`
- [X] T051 [US4] Que ninguna primitiva resuelva texto ni nombre accesible por su cuenta: todo por
      props ya traducido (FR-033)
- [X] T052 [US4] Correr `vercel:react-best-practices` sobre los TSX tocados (regla de `build.md`)
- [X] T053 [US4] Correr `pnpm lint && pnpm typecheck && pnpm test` y commitear:
      `feat(design-system): tokens, self-hosted type and the eleven ui primitives`

**Checkpoint**: los 47 tokens coinciden con `docs/10` y una compuerta lo verifica.

---

## Fase 5: US5 — Se puede ver la app y capturarla (P5)

**Meta**: las dos rutas y el driver cumpliendo su parte del contrato.

- [X] T054 [P] [US5] `src/app/[locale]/page.tsx`: la portada provisoria del wireframe, sin acento,
      sin datos (FR-034)
- [X] T055 [US5] Los once bloques privados en `muestra/_components/`, uno por primitiva, con todas
      las variantes y estados de la tabla (FR-030)
- [X] T056 [US5] `muestra/_components/toast-block.tsx` con `"use client"`: el disparador de `Toast`,
      recibiendo sus textos ya traducidos. `sheet-block.tsx` y `dialog-block.tsx` son Server
      Components (era un solo `overlay-triggers.tsx` hasta la ronda 1 de revisión)
- [X] T057 [US5] `muestra/page.tsx`: compone los bloques y llama `notFound()` en producción; sin
      detalle visual, bajo las ~50 líneas de JSX (FR-035)
- [X] T058 [P] [US5] `scripts/walk/args.mjs` + `args.test.mjs`: opciones y los códigos 0/1/2/3
      (FR-038, FR-040)
- [X] T059 [P] [US5] `scripts/walk/paths.mjs` + `paths.test.mjs`: ruta → nombre, raíz → `home`,
      sufijo `.desktop` (FR-037, FR-040)
- [X] T060 [P] [US5] `scripts/walk/noise.mjs` + `noise.test.mjs`: lista permitida vacía y el ruido
      del servidor de desarrollo que se ignora (FR-039, FR-040)
- [X] T061 [US5] `scripts/walk.mjs`: preflight con código 2 antes de abrir el navegador, limpieza de
      `.artifacts/<slug>/`, captura de página completa a 390 × 844, captura de hover y foco donde
      haya elemento interactivo, línea por ruta y rutas de archivos al final (FR-036)
- [X] T062 [P] [US5] `playwright.config.ts`, y el script `e2e` con `--pass-with-no-tests` (FR-017)
- [X] T063 [US5] La aserción de CLS en `.lighthouserc.json`, y nada más en ese archivo (FR-041)
- [X] T064 [US5] Correr el driver sobre `/` y `/muestra` y confirmar los tres archivos esperados y
      la ausencia de `home.hover.png` con su aviso (SC-008)
- [X] T065 [US5] Confirmar los cuatro códigos de salida, cada uno en su caso
- [X] T066 [US5] `pnpm build && pnpm start` y confirmar que `/muestra` responde "no encontrada"
- [ ] T067 [US5] `pnpm lighthouse` sobre la portada contra el presupuesto (SC-007). **Abierta a
      propósito**: en Windows la etapa no termina (KL-001), así que se observa en la CI del PR
      junto con T088
- [X] T068 [US5] Correr `pnpm lint && pnpm typecheck && pnpm test` y commitear:
      `feat(app): provisional home, dev-only primitives showcase and the walk driver`

**Checkpoint**: hay capturas para que `design-reviewer` mire, y el presupuesto se cumple.

---

## Fase 6: US6 — Queda registrado qué se instaló y cómo se corre (P6)

**Meta**: que la próxima corrida no tenga que redescubrir nada.

- [X] T069 [P] [US6] Una línea fechada por dependencia en `docs/07-stack.md`, incluidas la de los
      cuatro paquetes de Radix con su motivo frente al unificado, y la de `renovate` con el suyo
      (FR-044)
- [X] T070 [P] [US6] `docs/07-stack.md`: la línea fechada de por qué Stryker corre sin verificador
      de tipos y qué cuesta (FR-046)
- [X] T071 [P] [US6] `docs/known-limitations.md`: el `KL` de Stryker con su detección y su condición
      de reapertura (FR-046)
- [X] T072 [P] [US6] README: versiones instaladas con fecha, cómo levantar de cero, y el paso de
      preparación desde `quickstart.md` (FR-045)
- [X] T073 [US6] `run-app/SKILL.md`: la sección «Verified» con lo observado en Windows 11 /
      PowerShell 7, y el contrato marcado con qué cumple F00 y con qué historia llega cada parte
      pendiente (FR-046)
- [X] T074 [US6] `CLAUDE.md` §Estado y §Estructura, **sin podar** las entradas de lo que crean
      historias posteriores (FR-046)
- [X] T075 [US6] Correr `pnpm lint && pnpm typecheck && pnpm test` y commitear:
      `docs(stack): record what F00 installed and how the project runs`

---

## Fase 7: Pulido y compuerta completa

- [X] T076 Demostrar el mutante sobreviviente: romper una aserción de `paths.test.mjs`, ver
      `pnpm mutation` fallar por debajo del 100 % nombrándolo, anotarlo para ver que pasa, y
      **revertir todo**. El resultado va al PR, no al repo (US2-AC4)
- [X] T077 `/speckit-converge` y implementar lo que agregue, con las mismas reglas; hasta que diga
      "Converged" (tope 3 rondas). Corrió después de la ronda 2 de revisión: «Converged», sin
      tareas agregadas
- [X] T078 `pnpm verify` completo, con base local, y confirmar que nombra las siete etapas y que no
      omitió nada (SC-001)
- [X] T079 `pnpm verify` sin base local y confirmar el resumen de omisiones (SC-002)
- [X] T080 `node scripts/walk.mjs --story scaffold-y-compuertas / /muestra` para las capturas de la
      etapa Review
- [X] T081 Confirmar que `tasks.md` tiene todas las tareas en `[X]` y que no quedó ninguna
      dependencia sin su línea en `docs/07`. Quedan abiertas solo T067 y T088, las dos que se
      observan en la CI del PR y no antes

### Recorrida de criterios, uno por uno

Cada criterio de la spec que no se observa dentro de una fase se observa acá, con su evidencia
anotada para el cuerpo del PR.

- [X] T082 **SC-004**: contar las filas de `docs/09` §Compuertas con check (14 + la nueva = 15) y
      que las 3 no mecanizables estén nombradas con dónde corren; y que las ocho demostraciones
      corran dentro de la etapa `test`
- [X] T083 **SC-006** y **SC-009**: recorrer `/muestra` con mouse y teclado confirmando las once
      primitivas con todas sus variantes y estados, que ninguna resuelve texto o nombre accesible
      por su cuenta, y que no hay literal de texto fuera de `ui/` ni literal de diseño en ningún
      componente
- [X] T084 **SC-010** y **SC-011**: `supabase db reset` y confirmar que no quedan tablas del
      producto ni personas; y que el check de la clave de servicio falla si se la expone a propósito
      y pasa al revertirlo
- [X] T085 **SC-013**: confirmar el contrato del gancho en los dos sentidos: un cambio con falla de
      lint, tipos o pruebas no commitea; uno con solo un problema de formato commitea ya formateado
- [X] T086 **SC-012** y **SC-017** (FR-043): confirmar que cada dependencia del `package.json` tiene
      su línea fechada, que el contrato de `run-app/SKILL.md` no describe nada que no exista, y que
      nada de lo que produjo la corrida —`.artifacts/`, reportes, `.verify-skips.json`— entró a git
- [X] T087 **SC-014** y **SC-016** (FR-050): leer el diff completo de la rama y confirmar que no hay
      nada de la lista de FR-049, ninguna dependencia sin uso, y ningún cambio a los archivos
      protegidos más allá de los cuatro de `ci.yml` y la aserción de CLS
- [ ] T088 **SC-003**: después de abrir el PR, leer el registro del check `ci` y confirmar que
      **ejecutó** las siete etapas, sin pasos omitidos ni condicionales (se observa en la etapa
      Ship, no en el Build)

---

## Dependencias

- **US1 bloquea todo**: sin proyecto ni comandos no hay dónde poner un check.
- **US2 antes de US4 y US5**: las reglas existen antes del código al que aplican (constitución §IV).
- **US3 es independiente de US4 y US5**, pero va antes porque el arnés es lo que M1 necesita primero
  y porque `supabase start` tarda.
- **US4 antes de US5**: la muestra y la portada consumen los tokens y las primitivas.
- **US6 al final**: registra lo que las cinco anteriores decidieron.
- **T024 antes de T025**: un fixture verifica la forma de los globs antes de escribir los otros
  siete.
- **T030 antes de T035 y T036**: el arnés llama a la función de identidad.
- **T040 antes de T046**: las primitivas se reescriben contra tokens que ya existen.

## Paralelo

Dentro de un bloque, las `[P]` tocan archivos distintos y pueden ir juntas: T005–T007,
T015/T016, T018–T020, T031/T032, T043/T044, T048/T049, T058–T060, T069–T072.
