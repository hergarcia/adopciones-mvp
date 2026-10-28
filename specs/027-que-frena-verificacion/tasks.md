---
description: "Tareas de la historia #234 — Preguntar qué frena a quien deja la verificación a mitad de camino"
---

# Tasks: Preguntar qué frena a quien deja la verificación a mitad de camino

**Input**: `specs/027-que-frena-verificacion/` — spec.md, plan.md (§Diseño, §Cómo se construye),
research.md (R1–R10), data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: sí, y solo los de research R10; no se agrega ninguno fuera de ahí ni se saca ninguno de
ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se carga
`frontend-design:frontend-design` y se abre `docs/10-design-system.md`; antes de tocar la migración o
sus tests, `supabase:supabase-postgres-best-practices`; antes de tocar la cookie y la sesión en las
acciones, `supabase:supabase`; todo texto visible, con `sin-slop`; después de varios TSX,
`vercel:react-best-practices`. La migración es un solo archivo; después de cada cambio,
`pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: lo que se guarda, las funciones que lo escriben y las reglas puras que usan los dos
niveles y Encuestas.

- [ ] T001 Crear `supabase/migrations/<ts>_verification_exits.sql`: `private.verification_exit_option_valid`, las tablas `verification_exit_asks`, `verification_exit_tickets`, `verification_exit_answers` y `verification_exit_counts` (con sus seis filas), checks, índices, RLS sin políticas y `revoke all` (data-model.md, research R1, R6)
- [ ] T002 En la misma migración: `private.verification_exit_eligible`, `verification_exit_due`, `ask_verification_exit`, `answer_verification_exit` (CTE `delete ... returning` + insert), `skip_verification_exit`, con `security definer`, `set search_path = ''` y `execute` solo a `authenticated` (research R2, R3)
- [ ] T003 `pnpm exec supabase db reset` y `pnpm db:types`
- [ ] T004 [P] `src/lib/verification/exit-question.ts`: `EXIT_LEVELS`, `EXIT_ORIGINS`, `EXIT_OPTIONS`, tipos, `exitOrigin`, `exitDestination` (research R5, R6)
- [ ] T005 [P] `src/lib/verification/exit-cookie.ts`: nombre por nivel y opciones de la cookie (contracts §Cookies)
- [ ] T006 [P] `src/lib/schemas/verification-exit.ts`: `verificationExitAnswerSchema` (research R7)
- [ ] T007 [P] Los tres eventos en `src/lib/analytics/events.ts` (con su comentario de disparador) y `src/lib/analytics/verification-exit-events.ts` (research R9)
- [ ] T008 [P] `tests/db/verification-exits-support.ts`: sembrar una persona sin teléfono, con teléfono verificado, con número perdido, con la identidad aprobada y suspendida, sobre `identity-support.ts`; leer las cuentas con el cliente de servicio

**Checkpoint**: la base existe, los tipos están generados y la lógica pura compila.

---

## Fase 2: User Story 1 — Decir qué frena al dejar la verificación de identidad (P1) 🎯 MVP

**Goal**: «Ahora no» en el pedido de identidad hace la pregunta una vez, una opción la manda y vuelve
al animal o a Mi perfil, «Seguir sin contestar» sale sin mandar nada.

**Independent Test**: spec.md US1.

### Tests de US1

- [ ] T009 [P] [US1] `src/lib/verification/exit-question.test.ts`: `exitOrigin` de identidad con y sin el animal, con un código inválido; `exitDestination` de identidad; las listas de opciones por nivel (cinco cada una, `other` última)
- [ ] T010 [P] [US1] `src/lib/schemas/verification-exit.test.ts`: opción de otro nivel, texto sin `other`, recorte y vacío a nulo, 300 sí y 301 no en puntos de código, teléfono y correo con su fragmento
- [ ] T011 [P] [US1] `src/lib/analytics/verification-exit-events.test.ts`: los tres eventos con sus props y sin texto ni id
- [ ] T012 [P] [US1] `tests/db/verification-exits-privacy.test.ts`: visitante y persona no leen ni escriben ninguna de las cuatro tablas; `verification_exit_answers` y `verification_exit_tickets` no tienen ninguna columna que apunte a una persona; nadie llama a las funciones sin sesión (SC-004)
- [ ] T013 [P] [US1] `tests/db/verification-exits-rules.test.ts` (identidad): `ask` una sola vez por nivel, también con dos llamadas en paralelo; nulo con la identidad aprobada o la cuenta suspendida; `asked` suma 1 por (nivel, origen); `answer` → `answered` y después `already`; opción de otro nivel y texto de 301 o sin `other` → `invalid` y el ticket sigue; `skip` → `skipped` una vez; recibir la del teléfono no impide la de la identidad; una encuesta de #71 pendiente no impide `ask` ni cambia por él (FR-006); la lista de opciones de la base es la de `EXIT_OPTIONS`
- [ ] T014 [US1] `tests/e2e/verificacion-salida.spec.ts`: desde la ficha de un animal que pide nivel 2, «Ahora no» en el pedido → la pregunta → «No quiero mandar fotos de mi cédula» → la ficha; repetir «Ahora no» → la ficha sin pregunta

### Implementación de US1

- [ ] T015 [US1] `src/lib/supabase/queries/verification-exits.ts`: `verificationExitDue`, `askVerificationExit`, `answerVerificationExit`, `skipVerificationExit` (contracts)
- [ ] T016 [US1] `src/actions/verification-exit.ts`: `leaveVerification`, `answerVerificationExit`, `skipVerificationExit`, con la cookie y los eventos (contracts)
- [ ] T017 [P] [US1] Textos en `messages/es.json` (`verification.exit`: las dos preguntas y sus opciones palabra por palabra, «Seguir sin contestar», la bajada, «Otra cosa», su etiqueta, «Enviar», los errores de contacto, largo y conexión), escritos y revisados con `sin-slop`; `src/app/[locale]/_components/verification-exit-texts.ts` los arma por nivel
- [ ] T018 [P] [US1] `src/components/verification/not-now-button.tsx` (`FormSubmit` `ghost` en un `<form action={leaveVerification}>` con `level` y `from`)
- [ ] T019 [US1] `src/components/verification/exit-question.tsx`: las cinco opciones como `Button` `secondary` a lo ancho con `aria-pressed`, «Otra cosa» en `Disclosure` con `CountedTextarea` de 300 y «Enviar», `SaveFailedStrip`, «Seguir sin contestar» en `ghost`, el foco al `h1` al aparecer, navegar con `router.replace(destination)` (plan §Diseño)
- [ ] T020 [US1] `src/components/verification/identity-request-form.tsx`: «Ahora no» como `NotNowLink` o `NotNowButton` según una prop
- [ ] T021 [US1] `src/app/[locale]/(app)/verificar-identidad/page.tsx`: `verificationExitDue('identity')` elige el «Ahora no»; con `pregunta=1` y la cookie, `ExitQuestion` en lugar del formulario, con el destino de `exitDestination`

**Checkpoint**: US1 se prueba sola de punta a punta.

---

## Fase 3: User Story 2 — Decir qué frena al dejar la verificación del teléfono (P2)

**Goal**: la misma pregunta con las opciones del teléfono en «Ahora no» (verificar y escribir el
código) y en «Cancelar la verificación», solo la primera vez; nada en «Cancelar el cambio».

**Independent Test**: spec.md US2.

### Tests de US2

- [ ] T022 [P] [US2] Ampliar `src/lib/verification/exit-question.test.ts`: `exitOrigin` del teléfono para cada puerta (`publish`, `apply`, `identity` con `from` en una ficha y fuera de ella, `vouch`, `accept`, sin puerta); `exitDestination` con y sin puerta
- [ ] T023 [P] [US2] Ampliar `tests/db/verification-exits-rules.test.ts` (teléfono): `verification_exit_due('phone')` verdadero sin teléfono y con un número a medias por primera vez; falso con el teléfono verificado, con un cambio a medias, con el número perdido (#25) y con la marca

### Implementación de US2

- [ ] T024 [US2] `src/actions/phone.ts`: `cancelPendingPhone` pregunta si la cancelación salió bien y `verificationExitDue('phone')` (contracts)
- [ ] T025 [US2] `src/components/verification/verify-phone-screen.tsx` y `code-entry-screen.tsx`: «Ahora no» como enlace o botón por prop; con la pregunta, `ExitQuestion` toma el lugar del contenido; las pantallas de #25 y «Ese número no se puede usar» siguen con `NotNowLink` (FR-004)
- [ ] T026 [US2] `src/app/[locale]/(app)/verificar-telefono/page.tsx` y `codigo/page.tsx`: `verificationExitDue('phone')`, `pregunta=1` con la cookie, destino con `exitDestination` (sin puerta, Mi perfil)

**Checkpoint**: US1 y US2 andan cada una por su lado.

---

## Fase 4: User Story 3 — Leer en Encuestas por qué no se verificaron (P3)

**Goal**: el apartado nuevo con un bloque por nivel: cuentas, barras, tabla por origen y textos.

**Independent Test**: spec.md US3.

### Tests de US3

- [ ] T027 [P] [US3] `src/lib/surveys/exit-summary.test.ts`: `exitSummaryBlocks` suma asked y skipped de los tres orígenes, answered de las opciones, total y por origen de cada opción, un nivel sin preguntas, el orden de las opciones
- [ ] T028 [P] [US3] Ampliar `tests/db/verification-exits-privacy.test.ts`: `admin_verification_exit_summary` y `admin_verification_exit_texts` vacías para una persona que no administra; quien administra lee las 30 combinaciones y los textos sin ninguna columna de persona
- [ ] T029 [P] [US3] Ampliar `tests/db/verification-exits-rules.test.ts`: borrar la cuenta de quien contestó borra su marca y deja igual `asked`, `skipped`, las respuestas y los textos (SC-005); los textos del más nuevo al más viejo con el cursor

### Implementación de US3

- [ ] T030 [US3] En la migración: `admin_verification_exit_summary` y `admin_verification_exit_texts` (research R8); `db reset` y `db:types`
- [ ] T031 [P] [US3] `src/lib/surveys/exit-summary.ts` (`exitSummaryBlocks`)
- [ ] T032 [US3] Queries `verificationExitSummary` y `verificationExitTexts` en `src/lib/supabase/queries/verification-exits.ts`
- [ ] T033 [P] [US3] `src/components/surveys/exit-origin-table.tsx` (plan §Diseño)
- [ ] T034 [P] [US3] Textos `surveys.exits` en `messages/es.json` (título, nivel, cuentas en ICU plural, encabezados de la tabla, `caption`, los tres vacíos), con `sin-slop`
- [ ] T035 [US3] `src/app/[locale]/(app)/revision/encuestas/_components/verification-exits.tsx` arma los dos bloques con `SurveySummary`, `SurveyOptionBars`, `ExitOriginTable` y `SurveyAnswerList`; `survey-moments.tsx`: `moreHref` conserva todas las cuentas de la página; `page.tsx` suma la sección y lee `salida_phone`/`salida_identity`
- [ ] T036 [US3] `src/app/[locale]/(app)/revision/encuestas/loading.tsx`: la forma de la sección nueva

**Checkpoint**: las tres user stories andan.

---

## Fase 5: Pulido

- [ ] T037 [P] Filas de `NotNowButton`, `ExitQuestion` y `ExitOriginTable` en la tabla de componentes de `docs/10-design-system.md`
- [ ] T038 [P] `docs/03-mvp-features.md` §Métricas de éxito, «Cómo se leen», punto 2: una línea con los tres eventos nuevos al lado de `apply_stopped`
- [ ] T039 Capturas a 390 y 1280 con `node scripts/walk.mjs --story que-frena-verificacion --user` de la pregunta (los dos niveles, «Otra cosa» abierta con error) y de Encuestas (con datos y vacía)
- [ ] T040 `vercel:react-best-practices` sobre los TSX tocados; `pnpm gates:affected` verde, Stryker al 100 % en lo que tiene test

---

## Dependencias

- Fase 1 bloquea todo. US1 → US2 (reusa `ExitQuestion`, `NotNowButton`, las acciones). US3 depende
  solo de la Fase 1 y de que existan respuestas sembradas en sus pruebas; se puede empezar en
  paralelo con US2.
- Dentro de cada US: los tests primero, en rojo; después la implementación.
