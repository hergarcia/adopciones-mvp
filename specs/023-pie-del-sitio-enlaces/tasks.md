# Tasks: Pie del sitio con los enlaces que más se buscan

**Input**: `specs/023-pie-del-sitio-enlaces/` — `spec.md`, `plan.md`, `research.md`, `quickstart.md`

**Tests**: `src/lib/footer/groups.test.ts` (la regla de orden y visibilidad, 100 % de mutación) y la
prueba del pie de la cuenta suspendida en `tests/e2e/suspension.spec.ts`, ampliada (research R10).
Nada para componentes que pintan.

**Antes de escribir JSX o CSS**: cargar `frontend-design:frontend-design` y leer docs/10 §Marca,
§Tipografía, §Piso de accesibilidad y la fila de `SiteFooter`. Después de editar varios TSX,
`vercel:react-best-practices`.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Agregar el namespace `footer` (`groups.animals|trust|help`, `links.listing|publish|levels|questions|feedback|support`) a `messages/es.json` con los textos de research R8; todavía no borrar las claves viejas, que `PaperFrame` usa hasta T010

## Phase 2: Foundational

- [X] T002 Extraer `useIsCurrentPath(href: string): boolean` (`usePathname() === href.split('?')[0]`) a `src/hooks/use-is-current-path.ts`, y hacer que `src/app/[locale]/_components/nav-link.tsx` lo use sin cambiar su conducta (research R3)
- [X] T003 [P] Extraer `BrandSignature` a `src/app/[locale]/_components/brand-signature.tsx` (`span.firma` con `BrandMark` `compacta` y `APP_NAME`, en `.afiche` `text-xl text-ink`) y hacer que `src/app/[locale]/_components/wordmark.tsx` la envuelva en su `Link`; la cabecera se ve igual (research R5)

**Checkpoint**: la cabecera y `NavLink` se ven y se comportan como antes; `pnpm typecheck` verde.

---

## Phase 3: User Story 1 - Llegar desde el pie a donde se suele querer ir (Priority: P1) 🎯 MVP

**Goal**: el pie de cada pantalla muestra Animales, Confianza y Ayuda, en orden, con sus seis enlaces
y la firma debajo, igual con sesión y sin ella; el enlace de la pantalla actual se ve marcado.

**Independent Test**: quickstart.md §1.

### Tests for User Story 1

- [X] T004 [US1] Escribir `src/lib/footer/groups.test.ts` antes de la función: con `scope: 'site'` y soporte, la lista exacta `[{animals: listing, publish}, {trust: levels, questions}, {help: feedback, support}]` con cada `href` igual a su constante (`LISTING_PATH`, `PUBLISH_PATH`, `LEVELS_PATH`, `QUESTIONS_PATH`, `FEEDBACK_PATH`, el `supportHref` recibido); sin soporte, Ayuda con solo `feedback`; con `scope: 'help'`, un único grupo `help`; `help` sin soporte, un grupo con un enlace; `external` es `true` solo en `support` (FR-001–FR-007, FR-014)

### Implementation for User Story 1

- [X] T005 [US1] Implementar `footerGroups({ scope, supportHref })` y sus tipos en `src/lib/footer/groups.ts` (plan §US1.1); un grupo sin enlaces no sale. T004 verde y `pnpm mutation` al 100 % sobre el archivo
- [X] T006 [P] [US1] Crear `FooterLink` (`'use client'`) en `src/app/[locale]/_components/footer-link.tsx`: `Link` con `textLink({ weight: 'medium', placement: 'block' })`, `prefetch={false}`, y con `useIsCurrentPath` `aria-current="page"` + `aria-[current=page]:decoration-4` (research R3, R4, R6; FR-010)
- [X] T007 [US1] Reescribir `src/app/[locale]/_components/site-footer.tsx` como server component async `SiteFooter({ scope })`: `getTranslations('footer')`, `supportWhatsAppHref(SUPPORT_WHATSAPP)`, `footerGroups`; cada grupo es un `FooterGroup` local (`h2` `.afiche text-lg` con `id={`footer-${group.id}`}` + `ul aria-labelledby`); internos con `FooterLink`, el de soporte con `SupportWhatsAppLink`; debajo `BrandSignature`; el `<footer>` conserva `border-t-2 border-line bg-surface px-gutter md:px-gutter-wide` y pasa a `py-8` (plan §Diseño; FR-008, FR-009, FR-019, FR-020)
- [X] T008 [US1] En `src/app/[locale]/_components/paper-frame.tsx`: prop `questions?: boolean` → `footer?: FooterScope` (por omisión `'site'`); deja de traducir y armar los renglones del pie y pasa `scope={footer}` a `SiteFooter`; el contenedor `flex-1` que deja el pie al fondo queda como está (FR-018); quitar los imports y traducciones que quedan sin uso; actualizar los comentarios de la prop y del pie (research R2)
- [X] T009 [US1] Acotar los localizadores de e2e que chocan con el pie (research R9): `tests/e2e/animales.spec.ts:88` y `:128` a `getByRole('navigation')`, `tests/e2e/portada.spec.ts:18` y `tests/e2e/enlace-no-sirve.spec.ts:54` a `getByRole('main')`; antes, `rg -n "Animales en adopción|Publicar un animal|Qué dice cada nivel|Preguntas y respuestas|'Opinar'|Escribinos por WhatsApp" tests/e2e` para no dejar ninguno suelto; ninguna aserción cambia
- [X] T010 [US1] Borrar `feedback.footer`, `support.footer` y `questions.footer` de `messages/es.json` después de comprobar con `rg` que nada más los lee (research R8)
- [X] T011 [US1] Verificar con quickstart.md §1, sin sesión y con sesión, a 390 y 1280; `pnpm gates:affected` verde

**Checkpoint**: el pie tiene los tres grupos con sus enlaces en todas las pantallas; la cuenta
suspendida todavía no pasa `footer="help"` y vería el pie entero.

---

## Phase 4: User Story 2 - El pie se acomoda al ancho y a cada situación (Priority: P2)

**Goal**: apilado debajo de 1024 y en tres columnas desde ahí; sin WhatsApp cuando no hay número;
solo Ayuda en la cuenta suspendida; entero en error, «no encontrado» y carga.

**Independent Test**: quickstart.md §2.

### Tests for User Story 2

- [X] T012 [US2] Ampliar la prueba del pie en `tests/e2e/suspension.spec.ts` (hoy líneas 77-79): dentro de `contentinfo`, el encabezado «Ayuda» visible; los encabezados «Animales» y «Confianza» con `toHaveCount(0)`; los enlaces «Animales en adopción», «Publicar un animal» y «Qué dice cada nivel» con `toHaveCount(0)`; se conservan las dos aserciones que ya están (FR-014, SC-005)

### Implementation for User Story 2

- [X] T013 [US2] En `src/app/[locale]/(suspended)/layout.tsx`: `questions={false}` → `footer="help"`, y el comentario dice que el pie muestra solo Ayuda (FR-014). Entró con US1: T008 quita la prop `questions`, y sin este cambio el layout no compilaba
- [X] T014 [US2] En `SiteFooter`, las clases responsivas de plan §Diseño: grupos en `flex flex-col gap-8` debajo de 1024 y `lg:grid lg:auto-cols-fr lg:grid-flow-col lg:gap-x-12` desde ahí (una columna por grupo: plan §US2.1), `gap-2` (o `mt-2` en la lista) entre el nombre y el primer enlace, la firma con `mt-10`; comprobar a 390 que no hay desplazamiento lateral y que cada enlace mide ≥ 44 px (FR-015–FR-017)
- [X] T015 [US2] Comprobar que `error.tsx`, `not-found.tsx` y `loading.tsx` de cada zona muestran el pie entero (quickstart.md §2.5): viven dentro de los layouts de grupo, así que no debería hacer falta código; si alguno no lo muestra, anotarlo y corregirlo en esa zona (FR-012, FR-013)
- [X] T016 [US2] Verificar con quickstart.md §2 (768, 1024, 1280, sin `SUPPORT_WHATSAPP`, cuenta suspendida en su pantalla y en Opinar, letra al 200 %); `pnpm gates:affected` verde

**Checkpoint**: el pie entero en cada ancho y en cada situación de la spec.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T017 docs/10 (FR-021): la fila de `SiteFooter` con la **Decisión (2026-10-20, historia #200)** —tres grupos con nombre en orden fijo, los enlaces sin la pregunta, la firma debajo sin enlace, lado a lado desde 1024, solo Ayuda en la cuenta suspendida, `--space-8` arriba y abajo en lugar de `--space-6`— y el motivo (Hernán pidió el pie con enlaces de interés el 2026-10-20); la fila de `PaperFrame` con `footer` en lugar de `questions`; filas nuevas de `BrandSignature` y `FooterLink`; la decisión del 2026-10-09 de la historia #8 sobre el primer renglón del pie a §Descartado con el motivo, en `docs/10-design-system.md`
- [X] T018 [P] Cargar `vercel:react-best-practices` y pasar su checklist por los TSX tocados
- [ ] T019 Capturas con `node scripts/walk.mjs --story 200-pie-del-sitio-enlaces` (quickstart.md §3) para la revisión de diseño
- [ ] T020 `pnpm verify` verde al cerrar el build

---

## Dependencies & Execution Order

- Setup (T001) → Foundational (T002, T003) → US1 (T004 → T005; T006 en paralelo; T007 necesita
  T005, T006 y T003; T008 necesita T007; T009 y T010 después de T008) → US2 (T012, T013, T014,
  T015) → Polish.
- US2 depende de US1: acomoda y recorta los grupos que US1 arma.
- [P]: T003 con T002; T006 con T004/T005; T018 con T017.
