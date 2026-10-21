# Tasks: «Nosotros»: para qué existe el sitio, en qué se diferencia y qué quiere decir su marca

**Input**: `specs/024-nosotros-para-que-existe/` — `spec.md`, `plan.md`, `research.md`, `quickstart.md`

**Tests**: `src/lib/footer/groups.test.ts` (ampliado), `src/lib/about/page.test.ts` y
`src/app/robots.test.ts`, todos al 100 % de mutación sobre lo que prueban (research R8). Sin e2e y
nada para componentes que pintan. Que la cuenta suspendida no lea la página ya lo cuida
`src/lib/auth/session-gate.test.ts`.

**Antes de escribir JSX o CSS**: cargar `frontend-design:frontend-design` y leer docs/10 §Marca,
§Pantallas anchas (página de contenido), §Textos, §Antipatrones y las filas de `QuestionLayout`,
`QuestionFooter`, `CheckList` y `BrandMark`. Antes de escribir textos, el skill `sin-slop`. Después
de editar varios TSX, `vercel:react-best-practices`.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Crear `src/lib/about/page.ts` con `ABOUT_PATH = '/nosotros'`, `ABOUT_UPDATED_ON` (el día en que se escribe el texto, `YYYY-MM-DD`), `ABOUT_SECTIONS` (las cuatro partes en orden: `why`, `different` con `items: 5`, `promise`, `brand`, cada una con su cantidad de párrafos) y `ABOUT_FACTS = { followUpDays: FOLLOW_UP_DAYS }` (research R2)

## Phase 2: Foundational

- [X] T002 [P] Hacer opcional `related` en `src/components/questions/question-footer.tsx` (`QuestionFooterTexts.related?`): sin él no se pinta `RelatedQuestions`; las preguntas se ven igual (research R1)
- [X] T003 [P] Sumar a `PublicErrorCopy` en `src/app/[locale]/_components/public-error-copy.tsx` el campo opcional `exit?: { href: string; label: string }` (research R7)

**Checkpoint**: `pnpm typecheck` verde; las páginas de preguntas sin cambios visibles.

---

## Phase 3: User Story 1 - Leer para qué existe el sitio y en qué se diferencia (Priority: P1) 🎯 MVP

**Goal**: desde el pie de cualquier pantalla, sin sesión, se llega a `/nosotros` y se leen las tres
primeras partes, la fecha y la tirita al listado; el enlace compartido arma su tarjeta.

**Independent Test**: quickstart.md §2, §3, §5, §6 y §7.

### Tests for User Story 1

- [X] T004 [P] [US1] Ampliar `src/lib/footer/groups.test.ts` antes del cambio: con `scope: 'site'`, el grupo `trust` es exactamente `[levels, questions, about]` con `about.href === ABOUT_PATH` y `external: false`; con `scope: 'help'`, ningún enlace `about` (FR-018, FR-019)
- [X] T005 [P] [US1] Escribir `src/lib/about/page.test.ts` antes de los textos, contra `messages/es.json`: `parseDay(ABOUT_UPDATED_ON)` no lanza; las partes de `ABOUT_SECTIONS` son `['why','different','promise','brand']` en ese orden; cada una tiene `title` y exactamente `p1…pN`, sin `pN+1`; `different` tiene `i1…i5` y no `i6`; `brand` tiene `image` y `levels`; existen `title`, `card`, `lead`, `updated`, `action`, `error.body`, `error.to_home`; ningún texto de `about` contiene un dígito ni `APP_NAME`; `different.i4` contiene `{followUpDays}` y `ABOUT_FACTS.followUpDays === FOLLOW_UP_DAYS` (FR-002, FR-005, FR-007, FR-015–FR-017; research R8)
- [X] T006 [P] [US1] Escribir `src/app/robots.test.ts`: con `INDEXING_ENABLED` en `false`, la regla `*` tiene `disallow: '/'` y la de `LINK_PREVIEW_AGENTS` incluye `ABOUT_PATH` en `allow` junto a las que ya tenía (FR-021, FR-022, SC-007)

### Implementation for User Story 1

- [X] T007 [US1] Sumar `'about'` a `FooterLinkId` y agregarlo último en `trust` en `src/lib/footer/groups.ts`; `footer.links.about` = «Nosotros» en `messages/es.json`. T004 verde y mutación al 100 % (research R5)
- [X] T008 [US1] Escribir el namespace `about` en `messages/es.json` (plan §US1.2): `title`, `card`, `lead` (hasta tres oraciones), `sections.why`, `sections.different` (párrafo + `i1…i5` en el orden de FR-005, `i4` con `{followUpDays}`), `sections.promise`, `updated` («Actualizada el {date}»), `action` («Ver los animales en adopción»), `error.body` («No pudimos abrir esta página. Probá de nuevo.»), `error.to_home`; `{app}` donde vaya el nombre; voseo, sin cifras escritas, revisado con `sin-slop`. Cotejar cada diferencia con el sitio (plan §Verificación). T005 verde salvo `brand`
- [X] T009 [US1] Crear `src/app/[locale]/_components/about-texts.ts`: `aboutCardTexts()` (`title`, `card`) y `aboutTexts()` que lee `about` con `{ app: APP_NAME, ...ABOUT_FACTS }` y arma `title`, `lead`, las secciones `why`/`different`/`promise` en la forma de `QuestionSectionTexts` (con la lista de `different` aparte, para `CheckList`), y `footer` para `QuestionFooter` (`updated` con `formatUpdatedOn(ABOUT_UPDATED_ON, locale)`, sin `related`, `action` a `LISTING_PATH`)
- [X] T010 [US1] Crear `src/app/[locale]/(public)/nosotros/layout.tsx` (`PublicErrorCopyProvider` con `common.error_screen.title`, `about.error.body`, `common.error_screen.retry` y `exit: { href: '/', label: about.error.to_home }`) y `src/app/[locale]/(public)/nosotros/error.tsx` (`ErrorScreen` con el `exit` en `TextLink` centrado debajo, como `preguntas/error.tsx`) (FR-023)
- [X] T011 [US1] Crear `src/app/[locale]/(public)/nosotros/page.tsx`: `generateMetadata` (title, description = `card`, canónica `/nosotros`, `robots` desde `INDEXING_ENABLED`, `siteShareMetadata` con `home('hero.title')`); la página hace `setRequestLocale`, `redirectIfSuspended()`, `aboutTexts()` y compone `PageShell width="full"` › `QuestionLayout` con `QuestionArticle` (`answer` = `lead`; `sections` = why, different con `CheckList` de hijo, promise; `shared` = `null`) y `closing` = `QuestionFooter`. Sin eventos (FR-001–FR-008, FR-020, FR-021, FR-025)
- [X] T012 [US1] Sumar `ABOUT_PATH` al `allow` de `LINK_PREVIEW_AGENTS` en `src/app/robots.ts` y a su comentario. T006 verde
- [X] T013 [US1] Verificar quickstart.md §2, §3, §5, §6 y §7 a 390 y 1280; `pnpm gates:affected` verde

**Checkpoint**: «Nosotros» existe con tres partes y el cierre; la parte de la marca todavía falta.

---

## Phase 4: User Story 2 - Entender qué quiere decir la marca (Priority: P2)

**Goal**: la cuarta parte muestra el dibujo grande con su descripción, explica qué quiere decir,
en qué se distingue de la chapita y enlaza a «Qué dice cada nivel».

**Independent Test**: quickstart.md §4.

### Tests for User Story 2

- [X] T014 [US2] Sin test nuevo: `BrandMeaning` solo pinta (research R8). Las claves de `brand` ya las exige T005, que pasa a verde completo con T015

### Implementation for User Story 2

- [X] T015 [US2] Escribir `about.sections.brand` en `messages/es.json`: `title`, los párrafos (pata con huella digital en la almohadilla; el animal y la persona que el sitio sabe quién es; siempre el mismo dibujo, no cuenta niveles; firma al sitio, la chapita certifica a una persona), `image` («Una pata con una huella digital en la almohadilla» o equivalente) y `levels` («Qué dice cada nivel»); fiel a docs/10 §Marca, revisado con `sin-slop` (FR-011, FR-012, FR-014). T005 verde entero, mutación al 100 % sobre `src/lib/about/page.ts`
- [X] T016 [US2] Crear `src/components/about/brand-meaning.tsx` (`BrandMeaning({ texts: { title, paragraphs, image, levels }, levelsHref })`): `section` › `h2` como `QuestionSection` › `div.grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start` con `span role="img" aria-label={image}` + `BrandMark version="principal" className="h-32 w-auto text-ink"`, y la columna con los párrafos y `TextLink` `block` a `levelsHref` (plan §US2; FR-009, FR-010, FR-013, FR-024)
- [X] T017 [US2] En `about-texts.ts` sumar `brand` a `aboutTexts()`; en `page.tsx` sumar `BrandMeaning` como cuarta sección con `levelsHref={LEVELS_PATH}`
- [X] T018 [US2] Sumar la fila de `BrandMeaning` a la tabla de componentes de `docs/10-design-system.md` y actualizar la de `QuestionFooter` (relacionadas opcionales; la usa también «Nosotros»)
- [X] T019 [US2] Verificar quickstart.md §4 a 390, 768, 1024 y 1280 (el dibujo arriba hasta 1023, al lado desde 1024, siempre 128 px); `pnpm gates:affected` verde

**Checkpoint**: la página está entera.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T020 Releer todo `about` con `sin-slop` de punta a punta y contra docs/03 y docs/10 §Marca: ninguna afirmación que el sitio no cumpla hoy (FR-015)
- [ ] T021 `vercel:react-best-practices` sobre los TSX tocados
- [ ] T022 Capturas: `node scripts/walk.mjs --story nosotros-para-que-existe /nosotros /animales` (390 y 1280) para `design-reviewer`
- [ ] T023 `pnpm verify` verde en local

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → Polish. US2 depende de la página de US1.
- Dentro de US1: T004, T005, T006 en paralelo y antes de su implementación; T007 tras T004;
  T008 tras T005; T009 tras T008 y T002; T010 tras T003; T011 tras T009 y T010; T012 tras T006.
- Dentro de US2: T015 → T016 → T017 → T018 → T019.

## Parallel Example

```text
T002, T003 juntos (archivos distintos).
T004, T005, T006 juntos (tres archivos de test distintos).
```
