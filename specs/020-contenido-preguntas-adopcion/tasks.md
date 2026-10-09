---
description: "Tareas de la historia #8 — Contenido que responde las preguntas que frenan una adopción"
---

# Tasks: Contenido que responde las preguntas que frenan una adopción

**Input**: `specs/020-contenido-preguntas-adopcion/` — spec.md, plan.md (§Diseño, §Tests),
research.md (R1–R13), data-model.md, contracts/preguntas.md, quickstart.md

**Tests**: sí, y solo los de plan.md §Tests; no se agrega ninguno fuera de esa tabla ni se saca
ninguno. Lo que tiene test hermano se sostiene al 100 % de mutación (`pnpm mutation`).

**Organización**: por user story, en orden de prioridad. Antes de escribir TSX se carga
`frontend-design:frontend-design` y se abre `docs/10-design-system.md` (T000); después de varios
TSX, `vercel:react-best-practices`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Preparación, base y pulido no llevan etiqueta

---

## Fase 1: Preparación

**Propósito**: extraer lo compartido sin cambiar conducta.

- [X] T000 Cargar el skill `frontend-design:frontend-design` y abrir `docs/10-design-system.md` antes de cualquier TSX (CLAUDE.md regla 4, constitución VII). Si la sesión no tiene el skill, abrir un issue `aviso` que lo diga y deje como control compensatorio la revisión del design-reviewer a 390 y 1280 (T042), y seguir

- [X] T001 Extraer de `src/app/[locale]/(public)/page.tsx` el armado de `openGraph` + `twitter` con la imagen del sitio a `siteShareMetadata({ title, description })` en `src/lib/og/site-share-metadata.ts`; la portada lo usa y sus metadatos no cambian (research R5)
- [X] T002 [P] Escribir `src/lib/og/site-share-metadata.test.ts` según plan.md §Tests (la `?v=` con `siteShareVersion` y que cambia con el nombre, `og:site_name` = `APP_NAME`, `summary_large_image` con la misma URL, título y descripción) y dejarlo verde contra T001
- [X] T003 [P] Extraer `ConsentBody` de `src/components/verification/identity-consent.tsx` como `IdentityConsentBody` exportado, sin directiva ni hooks, con `headingLevel?: 2 | 3` (por omisión 2); `IdentityConsent` lo usa y el pedido se ve igual (research R8, plan §Componentes)
- [X] T004 [P] Extraer `identityConsentTexts()` de `identityRequestFormTexts()` en `src/app/[locale]/_components/identity-texts.ts`; `identityRequestFormTexts()` la usa y devuelve lo mismo (research R2)
- [X] T005 [P] Sumar `headingLevel?: 2 | 3` (por omisión 2) a `src/components/verification/level-step.tsx`; `/niveles` se ve igual (plan §Componentes)

**Checkpoint**: `pnpm lint && pnpm typecheck && pnpm test` verdes; la portada, el pedido y `/niveles` sin cambios visibles.

---

## Fase 2: Base compartida

**Propósito**: el registro, sus reglas puras, los textos base y la medición que usan las tres user
stories. Bloquea las fases 3 a 5.

- [X] T006 [P] Escribir primero `src/lib/questions/sentences.test.ts` según plan.md §Tests (1–4 oraciones con `.`, `?`, `!`; la lista cerrada de abreviaturas de research R13; números con punto o coma; siglas con puntos; vacío = 0; espacios finales)
- [X] T007 Implementar `sentenceCount` en `src/lib/questions/sentences.ts` hasta que T006 pase (research R13)
- [X] T008 [P] Escribir primero `src/lib/questions/sources.test.ts` (HTTPS y host exacto de `OFFICIAL_SOURCE_HOSTS`; `http://`, un host parecido, una nota de prensa y un texto que no es URL, no) e implementar `OFFICIAL_SOURCE_HOSTS` e `isOfficialSource` en `src/lib/questions/sources.ts` hasta que pase (research R11)
- [X] T009 [P] Escribir primero `src/lib/questions/dates.test.ts` (reloj fijo en `2026-10-09T23:30:00-03:00`, `es-UY`, días inválidos lanzan) e implementar `formatUpdatedOn` en `src/lib/questions/dates.ts` hasta que pase (research R13)
- [X] T010 [P] Escribir primero `src/lib/questions/paths.test.ts` e implementar `QUESTIONS_PATH`, `questionPath(slug)`, `isQuestionPath(pathname)` y `questionSlugOf(pathname)` en `src/lib/questions/paths.ts` hasta que pase (data-model §Reglas puras)
- [X] T011 Crear el registro `src/lib/questions/pages.ts` (tipos, `QUESTION_PAGES` con la tabla de data-model —slug, grupo, acción, relacionadas, `shared`; las `sections` y el `updatedOn` de cada página los completan T021–T024 al escribir su texto—, `PUBLISHED`, `GROUP_ORDER`, `ACTION_PATH` desde `IDENTITY_PATH`, `PUBLISH_PATH` y `LISTING_PATH`, `questionBySlug`) y `src/lib/questions/facts.ts` (`QUESTION_FACTS` desde `lib/verification/rules.ts` y `lib/follow-ups/rules.ts`) (research R1, R2)
- [X] T012 [P] Escribir primero `src/lib/questions/groups.test.ts` (orden de grupos venga como venga, grupos vacíos fuera, `[]` sin publicadas; `relatedFor` nunca la propia, solo publicadas, en orden, `[]` cuando se retiraron las dos) e implementar `questionGroups` y `relatedFor` en `src/lib/questions/groups.ts` hasta que pase
- [X] T013 Sumar a `messages/es.json` el namespace `questions` con las claves de data-model §Claves que no son de una página (`index.*`, `page.*`, `actions.*`, `not_found.*`, `error.*`, `footer.*`, `example.*`, `levels_title`, `identity_title`, `sources.*` vacío por ahora) y `verification.levels.more` e `identity.request.learn_more`; crear `src/app/[locale]/_components/question-texts.ts` (`questionPageTexts(slug)`, `questionIndexTexts()`, con plantillas tipadas sobre el registro y `QUESTION_FACTS` como parámetros) (research R1, plan §Textos)
- [X] T014 [P] Escribir primero `src/lib/analytics/question-events.test.ts` según plan.md §Tests (cada origen de `question_viewed`, `questions_index_viewed` `footer`/`link`, `question_action_used` solo cuando la acción de la página es el destino, lector de vista previa → `null`)
- [X] T015 Implementar `questionViewEvent`, `questionsIndexViewEvent` y `questionActionEvent` en `src/lib/analytics/question-events.ts` y sumar `question_viewed`, `questions_index_viewed` y `question_action_used` con sus props (y el comentario de cuándo se disparan) a `src/lib/analytics/events.ts` hasta que T014 pase (research R7)
- [X] T016 Sumar `QUESTIONS_PATH` a la lista `allow` de `LINK_PREVIEW_AGENTS` en `src/app/robots.ts` (research R5)
- [X] T017 [P] Crear `src/app/[locale]/(public)/preguntas/layout.tsx` (`PublicErrorCopyProvider` con `questions.error.*` y `exits: { index, listing }`), sumar `exits?` a `PublicErrorCopy` en `src/app/[locale]/_components/public-error-copy.tsx`, y `src/app/[locale]/(public)/preguntas/error.tsx` (`ErrorScreen` + `TextLink` a la salida elegida con `usePathname()`) (research R12)
- [X] T018 [P] Crear `src/components/questions/question-skeleton.tsx` y `src/app/[locale]/(public)/preguntas/loading.tsx` (plan §No está, cargando y error)

**Checkpoint**: `pnpm lint && pnpm typecheck && pnpm test` verdes.

---

## Fase 3: User Story 1 — Leer la respuesta a una pregunta, de punta a punta (P1) 🎯 MVP

**Objetivo**: las cinco páginas, con la respuesta en el primer párrafo, el detalle, la fecha, dos
relacionadas y una acción; la página que no está; la tarjeta compartida; la medición de apertura y
de la acción.

**Prueba independiente**: sin sesión, con sesión y con sesión suspendida, abrir cada página por su
enlace; contar oraciones; mirar el cierre; tocar la acción; abrir las fuentes de «Qué exige
Uruguay»; abrir `/preguntas/no-existe`; mirar la tarjeta con `curl -A WhatsApp`.

### Tests de US1

- [X] T019 [US1] Escribir primero `src/lib/questions/pages.test.ts` según plan.md §Tests: `questionBySlug` (cinco slugs y los casi iguales → `null`) y el registro contra la tabla escrita a mano y contra `messages/es.json` (oraciones y largo de `answer`, largo y «?» de `title`, `card` ≤ 160, `updatedOn` válido y no futuro, fuentes oficiales con etiqueta, secciones con sus `pN` y ninguna clave sin usar, ninguna copia de las claves compartidas, `example_note` donde va `commitment`) — falla hasta T021–T024
- [X] T020 [US1] Escribir `src/lib/questions/shared-texts.test.ts` (no en `tests/questions/`: el proyecto `unit` de Vitest solo incluye `src/**`, y sumar la carpeta es tocar `vitest.config.ts`): por página, el hash de las claves compartidas y de `QUESTION_FACTS` junto a su `updatedOn` (research R2)

### Contenido de US1

- [X] T021 [P] [US1] Escribir en `messages/es.json` `questions.como-se-verifica.*` (título, `answer` con lo que spec §Casos borde «Qué responde cada primer párrafo» pide, `card`, secciones propias) y su `updatedOn` en el registro; los niveles y la cédula no se escriben: son los bloques compartidos (spec FR-009, research R2)
- [X] T022 [P] [US1] Escribir `questions.antes-de-entregar.*` siguiendo spec §Casos borde («Qué aconsejan las páginas», «Qué responde cada primer párrafo»), con las cifras como parámetros de `QUESTION_FACTS`
- [X] T023 [P] [US1] Investigar en IMPO, el Parlamento y gub.uy (research R11: pistas, no hechos) y escribir `specs/020-contenido-preguntas-adopcion/sources.md` (dato, URL, cita textual, fecha de consulta); después escribir `questions.que-exige-uruguay.*` y `questions.sources.*` y declarar las fuentes en el registro: solo lo que `sources.md` respalda; un tema sin norma dice que no se encontró una que lo exija (spec §Casos borde); si la fuente contradice la fila «chip / RENAC» de `docs/06-i18n.md`, corregir esa fila
- [X] T024 [P] [US1] Escribir `questions.reconocer-una-estafa.*` y `questions.compromiso-y-seguimiento.*` (el compromiso con lo de spec §Casos borde «El compromiso no es un contrato» y «Los 30 días», las cifras desde `QUESTION_FACTS`, los nombres de ejemplo en `questions.example.*`)

### Implementación de US1

- [X] T025 [P] [US1] Crear `src/components/questions/source-link.tsx` y `src/components/questions/question-section.tsx` (plan §Componentes)
- [X] T026 [P] [US1] Crear `src/components/questions/related-questions.tsx` (la lista o el enlace al índice) y `src/components/questions/question-footer.tsx` (la fecha en `time`, las relacionadas y la acción `LinkButton` `tirita` `lg`)
- [X] T027 [US1] Crear `src/components/questions/question-article.tsx` (la respuesta en `--text-lg`, las secciones y los bloques compartidos como `ReactNode`) y `src/components/questions/question-layout.tsx` (`heading`, `article`, `closing`; una columna, y desde 1024 la grilla de plan §Diseño con el cierre `sticky`)
- [X] T028 [P] [US1] Crear `src/components/questions/question-json-ld.tsx` (`BreadcrumbList` + `Article`, research R6)
- [X] T029 [P] [US1] Crear `src/components/questions/question-not-found.tsx` y `src/app/[locale]/(public)/preguntas/[slug]/not-found.tsx` (research R4)
- [X] T030 [US1] Crear `src/app/[locale]/(public)/preguntas/[slug]/page.tsx`: `generateMetadata` (contracts §`/preguntas/<slug>`, con `siteShareMetadata`, y solo `APP_NAME` para un slug desconocido), `notFound()`, `redirectIfSuspended()`, `question_viewed`, y la composición con los bloques compartidos: `LevelStep` `headingLevel={3}` y `IdentityConsentBody` `headingLevel={3}` con `identityConsentTexts()` en «Cómo se verifica», `CommitmentText` con `commitmentTexts()` sobre los nombres de ejemplo y la nota en «El compromiso y los 30 días»; ≤ 50 líneas de JSX (plan §Diseño)
- [X] T031 [US1] Disparar `question_action_used` con `questionActionEvent` en `src/app/[locale]/(app)/verificar-identidad/page.tsx` (antes de `requireProfile`), `src/app/[locale]/(app)/mis-animales/publicar/page.tsx` (junto a `homePublishTapEvent`) y `src/app/[locale]/(public)/animales/page.tsx` (junto a `listingViewEvent`) (research R7)
- [ ] T032 [US1] Sumar `/preguntas` y `/preguntas/reconocer-una-estafa` a las URLs de `.lighthouserc.json` (plan §Performance Goals) — **trabada**: `.lighthouserc.json` es una compuerta y `guard-rules` no deja que la sesión del enjambre la escriba (docs/09 §Las reglas no se tocan solas); va en el `aviso` de la historia para que la cambie Hernán con `reglas-aprobadas`

**Checkpoint**: T019 y T020 verdes; quickstart pasos 3, 6, 7 y 8 sobre las páginas.

---

## Fase 4: User Story 2 — El índice y el enlace del pie (P2)

**Objetivo**: `/preguntas` con los tres grupos en orden, el vacío, y el renglón del pie en todas las
pantallas salvo la de cuenta suspendida.

**Prueba independiente**: desde una pantalla pública, una privada y la de cuenta suspendida, mirar
el pie; abrir el índice con y sin sesión; tocar cada pregunta.

### Tests de US2

- [X] T033 [US2] Escribir en `tests/e2e/preguntas.spec.ts` el flujo (1) de plan.md §Tests: sin sesión a 390 × 844, el pie lleva al índice y el índice a una página; en las cinco páginas el `h1` y el primer párrafo dentro de los 844 px; los textos de los tres niveles iguales en `/niveles` y en «Cómo se verifica» (este último tramo pasa recién con T030). Y en `tests/e2e/suspension.spec.ts`, donde ya hay una persona suspendida con sesión: abrir `/preguntas` y `/preguntas/como-se-verifica` muestra la pantalla de cuenta suspendida, y su pie no tiene «Preguntas y respuestas» (SC-007)

### Implementación de US2

- [X] T034 [US2] Crear `src/components/questions/question-index.tsx` (los grupos con `h2` y `TextLink` `block` `medium`, tres columnas desde 1024 con divisores; o el `EmptyState` con «Ver animales en adopción») (plan §Diseño)
- [X] T035 [US2] Crear `src/app/[locale]/(public)/preguntas/page.tsx`: `generateMetadata` (contracts §`/preguntas`), `redirectIfSuspended()`, `questions_index_viewed`, `questionGroups(PUBLISHED)` y `QuestionIndex`
- [X] T036 [US2] Sumar `questions: Line | null` a `src/app/[locale]/_components/site-footer.tsx` (primer renglón) y `questions?: boolean` (por omisión `true`) a `src/app/[locale]/_components/paper-frame.tsx` con el `NavLink` `prefetch={false}` a `QUESTIONS_PATH`; `src/app/[locale]/(suspended)/layout.tsx` pasa `questions={false}` (research R9)

**Checkpoint**: T033 verde; quickstart pasos 3 y 4.

---

## Fase 5: User Story 3 — «Cómo se verifica», enlazada desde el pedido y desde los niveles (P3)

**Objetivo**: el enlace en el pedido de identidad antes de aceptar y en «Qué dice cada nivel», con la
ida y vuelta sin perder el paso.

**Prueba independiente**: con una persona sin pedido, una en revisión, una verificada y sin sesión,
abrir el pedido, tocar el enlace, volver atrás; abrir `/niveles` y tocar el enlace; tocar
«Verificar mi identidad» al final de la página en cada caso.

### Tests de US3

- [ ] T037 [US3] Escribir en `tests/e2e/preguntas.spec.ts` el flujo (2) de plan.md §Tests: persona de nivel 1 sin pedido, el enlace en la vista de pedir, `page.goBack()` a la vista sin aceptar, y que después de «Acepto y elijo las fotos» el enlace no esté

### Implementación de US3

- [ ] T038 [US3] Sumar `learnMore?: { label; href }` a `IdentityConsentTexts` y dibujarlo como `TextLink` `block` `prefetch={false}` en `IdentityConsent` solo sin aceptar; `identityRequestFormTexts()` lo llena con `identity.request.learn_more` y `questionPath('como-se-verifica')` (research R8)
- [ ] T039 [US3] Sumar `more: { label; href } | null` a `src/components/verification/levels-explanation.tsx` (entre la escalera y «Volver») y pasarlo desde `src/app/[locale]/(public)/niveles/page.tsx` con `verification.levels.more` (research R10)

**Checkpoint**: T037 verde; quickstart paso 5.

---

## Fase 6: Pulido y documentos

- [ ] T040 [P] Actualizar `docs/10-design-system.md`: las filas de los diez componentes de `questions` y de `IdentityConsentBody`; las de `SiteFooter` (el renglón de las preguntas, primero; deja de decir «las preguntas frecuentes son #8»), `LevelsExplanation`, `LevelStep` e `IdentityConsent`; y en §Pantallas anchas la decisión fechada de la grilla de dos columnas de una página de contenido
- [ ] T041 [P] Sumar a `docs/known-limitations.md` dos KL: el 410 de una página retirada (research R4, se reabre al retirar la primera) y el toque en «Animales en adopción» de la cabecera que cuenta como la acción de las dos páginas que proponen ver animales (research R7)
- [ ] T041b Confirmar que las nueve decisiones de la historia están en `docs/08-convenciones-codigo.md` §Encontrable (siete) y `docs/03-mvp-features.md` §7 (dos), palabra por palabra: se copiaron en Spec, en esta misma rama; no se copian dos veces
- [ ] T042 Correr `vercel:react-best-practices` sobre los TSX tocados y `node scripts/walk.mjs --story contenido-preguntas-adopcion` con las rutas de quickstart paso 2 (390 y 1280) para el design-reviewer
- [ ] T043 Con el texto y las fechas definitivos, anotar en `tests/questions/shared-texts.test.ts` los hashes y `updatedOn` finales; recorrer quickstart (pasos 3–8, incluidos los heredados: «Verificar mi identidad» y «Publicar un animal» sin sesión siguen en la acción después de ingresar, y la barra final); después `pnpm gates:affected` y `pnpm verify` una vez al cerrar el build (incluye `pnpm mutation` al 100 % sobre `lib/questions/*`, `question-events.ts` y `site-share-metadata.ts`)

---

Lo que las acciones hacen después del toque (ingresar y seguir, la puerta del teléfono, los estados
del pedido de identidad) es conducta heredada de #9, #10, #11 y #53, con sus propios e2e; esta
historia no la reimplementa y la recorre a mano en quickstart.

## Dependencias y orden

- Fase 1 → Fase 2 → US1 → US2 → US3 → Pulido. US2 y US3 dependen de US1 solo por las páginas a las
  que enlazan (T030); entre sí son independientes.
- Dentro de cada fase, los tests primero (T006, T008, T009, T010, T012, T014, T019, T020, T033,
  T037) y en rojo antes de su implementación.
- T023 (lo legal) puede correr en paralelo con todo US1 salvo T019, que necesita sus claves.

## Paralelo

- Fase 1: T002, T003, T004, T005 a la vez después de T001.
- Fase 2: T006/T008/T009/T010/T014 a la vez; T017 y T018 a la vez.
- US1: T021–T024 (texto) a la vez; T025, T026, T028, T029 a la vez.

## Estrategia

MVP = Fases 1–3: las cinco páginas existen, se comparten y miden. US2 las vuelve encontrables desde
el sitio; US3 pone «Cómo se verifica» en el momento de la fricción.
