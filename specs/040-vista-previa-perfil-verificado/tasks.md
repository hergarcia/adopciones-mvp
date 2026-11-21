---
description: "Tareas de la historia #280 — Que la vista previa del enlace de mi perfil diga qué tengo verificado"
---

# Tasks: Que la vista previa del enlace de mi perfil diga qué tengo verificado

**Input**: `specs/040-vista-previa-perfil-verificado/` — spec.md, plan.md (§Diseño, §Cómo se
construye), research.md (R1–R8), data-model.md, contracts/link-preview.md,
contracts/analytics-events.md, quickstart.md

**Tests**: sí, y solo los de research R8; no se agrega ninguno fuera de ahí ni se saca ninguno de
ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se carga
`frontend-design:frontend-design` y se abre `docs/10-design-system.md`; todo texto visible, con
`sin-slop`; después de varios TSX, `vercel:react-best-practices`. No hay migración (data-model.md).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: el nivel como valor con el que trabajan la vista previa y la medición.

- [X] T001 `src/lib/profile/share-metadata.ts`: `ShareLevel` (`1 | 2 | 3`), `parseShareLevel(segment)` (solo `'1'`, `'2'`, `'3'`; cualquier otra cosa es `null`) y `profileLevelImagePath(level, version)` → `/perfil/nivel/<n>/imagen?v=<version>` (research R1, data-model.md)

**Checkpoint**: hay una sola forma de decir qué nivel tiene imagen y dónde está.

---

## Fase 2: User Story 1 — Que del otro lado vean qué tengo verificado antes de tocar mi enlace (P1) 🎯 MVP

**Goal**: la vista previa del perfil dice el nivel en el texto y en una imagen; sin nada verificado o
sin perfil, la de hoy.

**Independent Test**: spec.md US1.

### Tests de US1

- [X] T002 [P] [US1] `src/lib/profile/share-metadata.test.ts`: `parseShareLevel` con `'1'`, `'2'`, `'3'` y con `'0'`, `'4'`, `'x'`, `'2.5'`, `' 2'`, `''`; `profileLevelImagePath(2, 'abc')` exacto (research R8)
- [X] T003 [US1] Casos de `profileShareMetadata` en `src/lib/profile/share-metadata.test.ts`: con 1, 2 y 3 → `description` y `openGraph.description` con las palabras recibidas, `openGraph.images` con la ruta del nivel, 1200 × 630, `image/jpeg` y `alt` = las palabras, `twitter.card` `summary_large_image`; con 0 y con `null` → `{}`; lo que devuelve no tiene zona, localidad ni `/foto` (FR-001, FR-002, FR-005, FR-006, FR-008, FR-010, SC-001, SC-002, SC-004)
- [X] T004 [P] [US1] Casos de `profileLevelSize` en `src/lib/og/share-layout.test.ts`: «Identidad verificada y avalada», «Identidad verificada» y «Teléfono verificado» entran en dos renglones de 630 px con su palabra más larga en uno; nunca menos de 56 ni más de 96 (FR-003, SC-003)
- [X] T005 [P] [US1] `src/app/robots.test.ts`: la regla de los lectores de vista previa suma `/perfil`; la de `*` sigue `disallow: '/'` (research R4)
- [X] T006 [US1] `tests/e2e/aval.spec.ts`: «la vista previa de un enlace no lleva la foto, la zona ni el nivel» pasa a una persona con `level: 0` y conserva todas sus aserciones; uno nuevo con una persona de `level: 2` (con foto) y el agente de WhatsApp: `og:description` «Identidad verificada», `og:image` con `/perfil/nivel/2/imagen?v=`, sin `La Paloma`, `Rocha` ni `/foto`; pedir esa imagen → 200 `image/jpeg`; `/perfil/nivel/0/imagen` → 404; el `<head>` de Carla (nivel 3 en el seed) dice «Identidad verificada y avalada»; el «no existe» de una cuenta borrada sigue sin `og:image` (US1-AS1, AS2, AS4, AS8; research R8)

### Implementación de US1

- [X] T007 [US1] `profileShareMetadata({ level, title, levelText })` en `src/lib/profile/share-metadata.ts`, con `siteShareVersion({ siteName: APP_NAME, phrase: levelText })` como versión (research R3, contracts/link-preview.md)
- [X] T008 [P] [US1] `profileLevelSize(text)` en `src/lib/og/share-layout.ts`, con `EM_PER_CHARACTER` y el ancho del cuadrado del centro (research R7)
- [X] T009 [P] [US1] `src/components/profile/profile-share-image.tsx`: `ProfileShareImage({ levelText, siteName })` según plan §Diseño, con `OG_PALETTE`, `SHARE_FONT`, `SHARE_LAYOUT` y `profileLevelSize`
- [X] T010 [US1] `src/app/[locale]/(public)/perfil/nivel/[level]/imagen/route.tsx`: `runtime = 'nodejs'`; `parseShareLevel` → 404 sin cuerpo si es `null`; las palabras con `getTranslations({ locale, namespace: 'pets.page' })` y `publisherLevelLabel`; `ImageResponse` + `shareFont` + `smallJpeg`; `cache-control: public, max-age=31536000, immutable` (research R1, contracts/link-preview.md)
- [X] T011 [US1] `generateMetadata` en `src/app/[locale]/(public)/perfil/[id]/page.tsx`: con perfil, `publicLevel(profile)` y sus palabras, y se mezcla `profileShareMetadata` con lo de hoy (título, `robots` fijo, `openGraph` `profile`); sin perfil, igual que hoy. El comentario de FR-009 de #12 pasa a decir la regla nueva (research R3)
- [X] T012 [US1] `src/app/robots.ts`: `/perfil` en el `allow` de `LINK_PREVIEW_AGENTS`, con el porqué en el comentario (research R4)
- [X] T013 [US1] Fila de `ProfileShareImage` en `docs/10-design-system.md`, al lado de la de `PetShareImage`: medidas, colores, sin foto ni nombre, la versión por texto y la imagen por nivel (plan §Diseño)

**Checkpoint**: con el lector de WhatsApp, el perfil de una persona verificada trae su nivel y su
imagen; el de una sin nada verificado, el `<head>` de hoy.

---

## Fase 3: User Story 2 — Saber si quien verificó se presenta con su perfil y si su enlace trae gente (P2)

**Goal**: el enlace copiado o mandado y la visita a un perfil llevan el nivel de la dueña.

**Independent Test**: spec.md US2.

### Tests de US2

- [X] T014 [P] [US2] `src/lib/analytics/profile-events.test.ts`: `profileLinkProps('my_profile', 2)` → `{ from: 'my_profile', owner_level: 2 }`; con `0` → `owner_level: 0`; con `null` → `{ from }` sin la propiedad; las tres pantallas (FR-015, FR-017, FR-018)
- [X] T015 [P] [US2] Casos nuevos en `src/lib/analytics/view-origin.test.ts`: `profileViewProps` con nivel 0 y 3 suma `owner_level`, con y sin la tanda de animales; con `null` no la suma; los casos de hoy pasan el nivel y siguen con las mismas expectativas (FR-016, FR-017, FR-018)

### Implementación de US2

- [X] T016 [US2] `src/lib/analytics/events.ts`: `owner_level?: MeasuredLevel` en `profile_link_copied` y en `public_profile_viewed`, con el comentario de qué nivel es (contracts/analytics-events.md)
- [X] T017 [P] [US2] `src/lib/analytics/profile-events.ts`: `profileLinkProps(from, level)` (research R5)
- [X] T018 [P] [US2] `profileViewProps(origin, pets, level)` en `src/lib/analytics/view-origin.ts` (research R5)
- [X] T019 [US2] `getOwnPublicLevel(userId)` en `src/lib/supabase/queries/profiles.ts`: `findProfile` → `getPublicProfile(publicId)` → `measuredLevelOf(publicLevel(...))`; cualquier falla o ninguna fila → `null`, nunca lanza (research R5)
- [X] T020 [US2] `trackProfileMoment` en `src/actions/profile.ts`: después de validar `from`, `lookupSession` y `getOwnPublicLevel`, y `track('profile_link_copied', profileLinkProps(from, level))`; sin sesión, sin nivel; la firma y lo que devuelve no cambian (FR-019, contracts/analytics-events.md)
- [X] T021 [US2] La visita en `src/app/[locale]/(public)/perfil/[id]/page.tsx` pasa `publicLevel(profile)` a `profileViewProps`; cuándo se mide no cambia (FR-016, FR-021)
- [X] T022 [US2] Lectura 16 en `docs/03-mvp-features.md` §Métricas de éxito, «Cómo se leen»: `profile_link_copied` por `owner_level` y `from`; `public_profile_viewed` con `origin` = `link` por `owner_level`; antes y después del día en que llega la historia; un momento sin `owner_level` entra en los totales y no en ninguna categoría; con 3 a 5 rescatistas, señal al lado de las opiniones y las encuestas (FR-023, SC-008)

**Checkpoint**: en la consola del servidor (`[medición] …`), copiar desde las tres pantallas y abrir
un perfil traen `owner_level`.

---

## Fase 4: User Story 3 — Saber en «Mi perfil» que mi enlace muestra lo que verifiqué (P3)

**Goal**: la línea en «Tu perfil público» con nivel 1 o más.

**Independent Test**: spec.md US3.

### Implementación de US3

- [ ] T023 [P] [US3] `profile.public.preview_note` en `messages/es.json`, escrito con `sin-slop` desde el ejemplo de la historia (research R6)
- [ ] T024 [US3] `PublicProfileLinks` en `src/components/profile/public-profile-links.tsx`: `texts.note?: string`, un `<p>` en `text-base text-ink max-w-[var(--measure)]` entre el `h2` y `CopyProfileLink` (plan §Diseño)
- [ ] T025 [US3] `MyProfileSections` en `src/app/[locale]/(app)/mi-perfil/_components/my-profile-sections.tsx`: pasa `note: t('preview_note')` solo con `level >= 1` (FR-012, FR-013)
- [ ] T026 [US3] Fila de `PublicProfileLinks` en `docs/10-design-system.md`: la línea, cuándo está y que no tiene forma en el skeleton (research R6)

**Checkpoint**: «Mi perfil» de Carla con la línea; el de una persona sin teléfono verificado, como hoy.

---

## Fase 5: Pulido

- [ ] T027 Capturas a 390 y 1280 px de «Mi perfil» con y sin nivel (`node scripts/walk.mjs --story vista-previa-perfil-verificado --user`), y la imagen de los tres niveles recortada a su cuadrado central, para el design-reviewer
- [ ] T028 Recorrer quickstart.md de punta a punta
- [ ] T029 `pnpm gates:affected` en verde (lint, typecheck, las pruebas, la mutación al 100 % de lo tocado, el build y los e2e que lo tocan)

---

## Dependencias y orden

- **Base (T001)** bloquea US1 (T002, T007, T010, T011).
- **US1** no depende de US2 ni de US3. **US2** comparte con US1 solo la página del perfil (T011 y T021
  tocan `page.tsx`: hacerlas en orden). **US3** no depende de las otras.
- Dentro de cada US, las pruebas se escriben primero y fallan; después la implementación.
- **Pulido** al final.

## Paralelo

- T002, T004 y T005 en paralelo; T003 después de T002, en el mismo archivo.
- T008 y T009 en paralelo con T007.
- T014 y T015 en paralelo; T017 y T018 en paralelo.
- US3 entera en paralelo con US2.
