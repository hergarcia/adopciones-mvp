# Tasks: Un solo tamaño de hoja y el menú quieto al navegar

**Input**: `specs/022-un-solo-tamano-hoja/` — `spec.md`, `plan.md`, `research.md`, `quickstart.md`

**Tests**: ninguno nuevo (research R7, docs/09 §Qué vale la pena testear: son layouts y páginas).
Cada user story cierra con su verificación: `pnpm gates:affected`, las capturas de `walk.mjs` y la
medición de `quickstart.md`.

**Antes de escribir JSX o CSS**: cargar `frontend-design:frontend-design` y leer docs/10
§Pantallas anchas (decisión 2026-10-17, ya en esta rama). Después de editar varios TSX,
`vercel:react-best-practices`.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

Nada: sin dependencias, sin datos, sin textos nuevos. La decisión de docs/10 (FR-030) ya está
escrita en esta rama.

## Phase 2: Foundational

- [X] T001 Agregar la variante `wide` a `PageShell` (`max-w-[var(--measure)] lg:max-w-none`), con una línea en el comentario de arriba que diga para qué es (en `--measure` debajo de 1024 y a lo ancho de la hoja desde 1024), en `src/app/[locale]/_components/page-shell.tsx` (research R4)

**Checkpoint**: `PageShell` acepta `width="wide"`; nada lo usa todavía, nada cambia en pantalla.

---

## Phase 3: User Story 1 - La hoja y el menú quietos al navegar (Priority: P1) 🎯 MVP

**Goal**: desde 1024, toda pantalla con menú en la misma hoja de 1200 (o la ventana si es menor),
el menú en el mismo lugar entre pantallas, también entre una corta y una larga; la cuenta
suspendida conserva la hoja angosta; debajo de 1024 nada cambia.

**Independent Test**: quickstart.md §1 y §3 a 1280, 1100 y 1920.

### Implementation for User Story 1

- [X] T002 [US1] En `src/app/[locale]/_components/paper-frame.tsx`: el `cva` `sheet` pasa de la variante `size` (`handbill` `working` `wall`) a una variante booleana `menu` (`true` → `max-w-listing`, `false` → `max-w-[var(--measure)]`), alimentada por la prop `menu` que ya existe (por omisión `true`); borrar `size` de `Props` y de la firma, y `VariantProps` si queda sin uso; reemplazar el comentario «El tamaño del papel es una propiedad de la zona…» por uno que diga por qué el ancho sale del menú (el menú es el mismo en todas las pantallas; docs/10 §Pantallas anchas, decisión 2026-10-17) (research R1, FR-001, FR-002, FR-008)
- [X] T003 [P] [US1] Sacar `size="wall"` de `src/app/[locale]/(public)/layout.tsx`
- [X] T004 [P] [US1] Sacar `size="working"` de `src/app/[locale]/(app)/layout.tsx`
- [X] T005 [P] [US1] Sacar `size="handbill"` de `src/app/[locale]/(auth)/layout.tsx`
- [X] T006 [P] [US1] Sacar `size="handbill"` de `src/app/[locale]/(open)/layout.tsx` y cambiar «Un volante, como el ingreso.» del comentario: Opinar va en la hoja con menú, como todo lo demás
- [X] T007 [P] [US1] Sacar `size="handbill"` de `src/app/[locale]/(suspended)/layout.tsx`, conservando `menu={false} questions={false}`; el comentario dice que es la hoja angosta del flujo de foco, porque no tiene menú
- [X] T008 [US1] En `src/styles/globals.css`, en la capa base y solo en `@media (width >= 1024px)`: `html { scrollbar-gutter: stable; }` y `body { background-color: var(--color-surface); }`, con un comentario de una línea con el porqué (la barra clásica corre la hoja centrada media barra entre una pantalla corta y una larga) (research R2, FR-004)
- [X] T009 [US1] En `src/app/[locale]/(auth)/entrar/enlace/page.tsx`, `PageShell` pasa a `width="wide"`: el bloque centrado de «El enlace no sirve» queda centrado en la hoja desde 1024 y como hoy debajo (FR-027)
- [X] T010 [US1] `rg -n "size=\"(wall|working|handbill)\"|max-w-page" src` no devuelve nada; `pnpm typecheck` verde (FR-002)
- [X] T011 [US1] Verificar con quickstart.md §1 (1280, 1100, 1920; Opinar contra el listado para la barra) y §3 (390 sin cambios; cuenta suspendida angosta y sin menú); `pnpm gates:affected` verde

**Checkpoint**: la hoja mide lo mismo en todas las pantallas con menú y el menú no se corre;
Opinar en un renglón. Las pantallas de una sola tarea todavía son una columna a la izquierda.

---

## Phase 4: User Story 2 - Las pantallas de una sola tarea en dos partes (Priority: P2)

**Goal**: desde 1024, Opinar, Entrar, «Mirá tu correo», Completar el perfil y Cuenta borrada en dos
partes: la presentación a la izquierda, fija al desplazar, y la tarea a la derecha arrancando en
el mismo renglón, pasada la mitad de la hoja; debajo de 1024, como hoy.

**Independent Test**: quickstart.md §2 a 1280 y 1024, y §3 a 390.

### Implementation for User Story 2

- [ ] T012 [US2] Crear `src/app/[locale]/_components/single-task-layout.tsx`: `SingleTaskLayout({ presentation, task }: { presentation: React.ReactNode; task: React.ReactNode })`, Server Component, que renderiza `PageShell width="wide"` con un `div` `lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-16`, la presentación en un `div` `lg:sticky lg:top-6` y la tarea en un `div` `lg:[&>:first-child]:mt-0`; una línea de comentario con el porqué (columnas iguales para que la tarea arranque pasada la mitad; el margen del primer hijo se va para que las dos partes empiecen en el mismo renglón) (plan §US2, research R3, FR-020, FR-023, FR-024, FR-026)
- [ ] T013 [P] [US2] Opinar en `src/app/[locale]/(open)/opinar/page.tsx`: `SingleTaskLayout` con `presentation` = el `h1` y la bajada con `SupportReply` (el `div flex flex-col gap-2` de hoy) y `task` = `<div className="mt-6"><FeedbackForm … /></div>`; sin el `PageShell` con `flex gap-6`
- [ ] T014 [P] [US2] Entrar en `src/app/[locale]/(auth)/entrar/page.tsx`: `presentation` = `h1`, bajada y el aviso de `layout.notice` cuando lo hay; `task` = el `div mt-8 flex flex-col gap-6` de Google y el correo, sin cambios (FR-021, FR-022)
- [ ] T015 [P] [US2] «Mirá tu correo» en `src/app/[locale]/(auth)/entrar/revisa-tu-correo/page.tsx`: `presentation` = «Volver», el `h1` y «Te mandamos un enlace a …» con la dirección; `task` = la `Card mt-6` y `ResendLinkButton` (FR-021, FR-022)
- [ ] T016 [P] [US2] Completar el perfil en `src/app/[locale]/(auth)/completar-perfil/page.tsx`: `presentation` = `h1` y bajada; `task` = `ProfileForm` con todas sus props de hoy, `accountActions` incluido (FR-022, FR-024)
- [ ] T017 [P] [US2] Cuenta borrada en `src/app/[locale]/(auth)/cuenta-borrada/page.tsx`: `presentation` = el `h1` `afiche text-center text-2xl text-ink lg:text-left` y `EmptyState` con `title={t('done_body')}`, sin `action`, con `className="lg:items-start lg:px-0 lg:text-left"`; `task` = un `div` `flex flex-col items-center gap-6 lg:items-start` con «Crear otra cuenta» (`LinkButton` a `/entrar`) y «Volver al inicio» (`LinkButton` `ghost` a `/`); actualizar el comentario de FR-028c (research R5)
- [ ] T018 [US2] Verificar con quickstart.md §2 (1280 y 1024: la tarea pasada la mitad, el mismo renglón, el título fijo al bajar en Completar el perfil; Entrar con `?motivo=expired`) y §3 (390, mismas piezas, orden y alineación que en `main`); `pnpm gates:affected` verde

**Checkpoint**: las cinco pantallas en dos partes desde 1024, iguales que antes en el teléfono.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T019 Revisar que docs/10 (`docs/10-design-system.md`) describe lo construido: §Pantallas anchas (decisión 2026-10-17 y su tabla), Descartado (el papel por zona; la reapertura de «Una hoja de ancho único»), las filas de `PaperFrame`, `SingleTaskLayout`, `FeedbackForm` y `SuspendedScreen`; ajustar si el build cambió algo del plan (FR-030)
- [ ] T020 [P] Correr `vercel:react-best-practices` sobre los TSX tocados (T002–T017)
- [ ] T021 Capturas para el `design-reviewer`: `node scripts/walk.mjs --story un-solo-tamano-hoja / /animales /entrar /opinar /preguntas /cuenta-borrada "/entrar/enlace?motivo=expired"` y `node scripts/walk.mjs --story un-solo-tamano-hoja --user /mis-animales /mi-perfil` (390 y 1280)

---

## Dependencies & Execution Order

- **Foundational (T001)** antes de T009 y T012.
- **US1 (T002–T011)**: T002 antes de T003–T007 (sacan una prop que T002 borra; el typecheck falla
  en el medio, así que van en la misma tanda); T008 y T009 son independientes.
- **US2 (T012–T018)** depende de US1 (la hoja ancha) y de T001. T013–T017 en paralelo después de
  T012.
- **Polish (T019–T021)** al final.

### Parallel Opportunities

- T003–T007, juntas después de T002.
- T013–T017, juntas después de T012.

## Implementation Strategy

1. T001 → US1 → verificar (MVP: el menú quieto y Opinar en un renglón).
2. US2 → verificar.
3. Polish, capturas y revisión.
