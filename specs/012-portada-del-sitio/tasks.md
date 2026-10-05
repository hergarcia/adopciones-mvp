---
description: "Tareas de la historia #61 — Portada del sitio que invita a publicar un animal y a ver los que están en adopción"
---

# Tasks: Portada del sitio que invita a publicar un animal y a ver los que están en adopción

**Input**: `specs/012-portada-del-sitio/` — spec.md, plan.md (§Diseño, §Textos), research.md
(R1–R8), contracts/portada.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en research.md §R8; no se agrega ninguno fuera de ahí ni se saca ninguno de ahí. Lo que tiene test
unitario se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir TSX se abre
`docs/10-design-system.md` (y `frontend-design:frontend-design` si la sesión lo tiene); después de
varios TSX, `vercel:react-best-practices`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Preparación, base y pulido no llevan etiqueta

---

## Fase 1: Preparación

**Propósito**: mover lo compartido sin cambiar conducta.

- [X] T001 Mover `src/app/[locale]/(public)/animales/_components/listing-view.ts` a `src/app/[locale]/_components/listing-view.ts` sin cambiar su firma, y actualizar sus importadores (`src/app/[locale]/(public)/animales/page.tsx` y `src/app/api/animales/route.ts`) (research R1)
- [X] T002 [P] Extraer de `src/app/[locale]/(public)/animales/[code]/imagen/route.tsx` `smallJpeg()` a `src/lib/og/small-jpeg.ts` y la carga de la fuente a `src/lib/og/share-font.ts`, moviendo `BricolageGrotesque_Condensed-ExtraBold.ttf` y `OFL.txt` a `src/lib/og/`; la ruta de la ficha los importa y su imagen no cambia (research R5)

---

## Fase 2: Base compartida

**Propósito**: los textos y la medición que usan las tres user stories. Bloquea las fases 3 a 5.

- [X] T003 Sumar a `messages/es.json` el namespace `home` con las claves de plan.md §Textos (`hero.*`, `rescuer.*`, `adopter.*`, `recent.*`, `share.*`; la descripción es `hero.title`) y dejar `common.under_construction`, que usa el fixture de `tests/gates/typed-keys`; crear `src/app/[locale]/(public)/_components/home-texts.ts` (`homeTexts()`, como `listingTexts()`) (research R7)
- [X] T004 [P] Escribir primero `src/lib/analytics/home-events.test.ts`: `isHomeReferer(referer, host)` (portada del mismo host → sí; `/` con query → sí; otro host, otra ruta, `null`, una cadena que no es URL → no), `homeViewEvent({ userAgent })` (lector de vista previa → `null`), `homePublishTapEvent({ referer, host })` (research R6, R8)
- [X] T005 Implementar `src/lib/analytics/home-events.ts` hasta que T004 pase, y sumar `home_viewed` y `home_publish_tapped` (con su comentario de cuándo se disparan) a `src/lib/analytics/events.ts` (research R6)
- [X] T006 [P] Sumar a `src/lib/analytics/listing-events.test.ts` los casos de origen: `petViewEvent` con `referer` en la portada → `origin: 'home'`; `listingViewEvent` con `referer` en la portada → `{ origin: 'home' }`, en otro lado → `{ origin: 'elsewhere' }`, lector de vista previa → `null`; actualizar las expectativas existentes de `listing_viewed` a su forma con `origin` sin aflojar ninguna (research R6, R8)
- [X] T007 Implementar el origen en `src/lib/analytics/listing-events.ts` (`PetViewOrigin` suma `'home'`, `listingViewEvent` recibe `referer` y `host`) y en `EventProps` de `src/lib/analytics/events.ts`; pasar `referer` y `host` desde `src/app/[locale]/(public)/animales/page.tsx` hasta que T006 pase (research R6)

**Checkpoint**: `pnpm lint && pnpm typecheck && pnpm test` verdes; el listado y la ficha se ven igual.

---

## Fase 3: User Story 1 — La rescatista entiende el sitio y empieza a publicar desde la portada (P1) 🎯 MVP

**Objetivo**: `/` dice qué es el sitio, ofrece «Publicar un animal» como tirita y «Ver animales en
adopción» al lado, y cuenta los tres pasos; «Publicar un animal» lleva por la puerta de #9 y #10.

**Prueba independiente**: sin sesión, abrir `/`, ver la frase, las dos acciones y los tres pasos
con el nombre una vez; tocar «Publicar un animal», entrar como persona nueva, completar el perfil y
llegar a publicar; con teléfono verificado, directo; sin teléfono, el aviso.

### Tests de US1

- [X] T008 [US1] Escribir en `tests/e2e/portada.spec.ts` los escenarios de US1 (research R8 a y b): la frase como único `h1`, «Publicar un animal» y «Ver animales en adopción» con sus destinos, la `ol` de tres pasos con «7 días», «30 días» y «un toque», `APP_NAME` una sola vez en lo visible, sin «construyendo»; a 390 × 844, la frase y las dos acciones dentro de la primera pantalla (SC-001); «Publicar un animal» sin sesión → `/entrar` → enlace por correo de una dirección nueva → completar perfil → `/mis-animales/publicar`; con una persona con teléfono verificado → `/mis-animales/publicar` directo; con una sin teléfono → el aviso de verificación pendiente

### Implementación de US1

- [X] T009 [P] [US1] Crear `src/components/home/home-hero.tsx` (`h1` `.afiche` `text-4xl` con la frase; `LinkButton` `tirita` `lg` a `PUBLISH_PATH` y `LinkButton` `secondary` `lg` a `LISTING_PATH`, los dos con `prefetch={false}`, en columna y en fila desde 640) (plan §Diseño)
- [X] T010 [P] [US1] Crear `src/components/home/rescuer-steps.tsx` (`h2` `text-xl`, `ol` de tres pasos, número `.afiche` `text-2xl`, texto `text-base` en `--measure`, tres columnas con `gap-8` desde 1024) (plan §Diseño)
- [X] T011 [P] [US1] Crear `src/components/home/home-layout.tsx` (una columna; desde 1024, 12 columnas con la cabecera en 1–7 y el bloque de quien adopta en 8–12 de la primera fila, sin cambiar el orden del DOM) (plan §Diseño, §Orden)
- [X] T012 [US1] Reemplazar `src/app/[locale]/(public)/page.tsx`: `generateMetadata` con `title` absoluto `APP_NAME`, `description` = la frase, `canonical` `/` y `robots` según `INDEXING_ENABLED`; compone `HomeLayout`, `HomeHero` y `RescuerSteps` con `homeTexts()`; dispara `homeViewEvent` con el `user-agent`
- [X] T013 [US1] En `src/app/[locale]/(app)/mis-animales/publicar/page.tsx`, antes de `requireVerifiedPhone`, disparar `homePublishTapEvent` con `referer` y `host` (research R6)

**Checkpoint**: la parte de US1 de `portada.spec.ts` pasa contra `next start`.

---

## Fase 4: User Story 2 — Quien quiere adoptar ve animales reales y sabe que detrás hay alguien verificado (P2)

**Objetivo**: los 8 más recientes del listado con «Ver todos», lo que quiere decir verificado, y el
vacío y el error del bloque.

**Prueba independiente**: con 12 animales a la vista de la corrida, los 8 de la portada coinciden en
orden con los primeros 8 de `/animales`; uno pausado sale; el de «En proceso» lleva su sello; tocar
uno abre su ficha; «Ver todos» abre `/animales`.

### Tests de US2

- [X] T014 [US2] Sumar a `tests/e2e/portada.spec.ts` (research R8 a): publicar con `publishForRun` animales de la corrida (uno en proceso), comparar los `href` de la portada con los primeros 8 de `/animales` en orden, ver «En proceso» en el que corresponde, pausar uno de los 8 y ver que sale y entra el siguiente, abrir uno y llegar a su ficha, «Ver todos» → `/animales`; el texto de «Si querés adoptar»; limpiar con `removeRunOwner`

### Implementación de US2

- [X] T015 [P] [US2] Crear `src/components/home/recent-pets.tsx` (`h2` «Recién publicados», `PetWall` `wall` con `prefetch={false}`, «Ver todos» como `TextLink` `block` `medium` a la derecha del título desde 768 y debajo de la pared en el teléfono; con `cards` vacío, `EmptyState` «Todavía no hay animales publicados.» con `LinkButton` `secondary` «Publicá el primero» a `PUBLISH_PATH` y sin «Ver todos»; con `cards === null`, `RecentPetsFailed`) (plan §Los tres estados)
- [X] T016 [P] [US2] Crear `src/components/home/recent-pets-failed.tsx` (`EmptyState` «No pudimos cargar los animales.» y `LinkButton` `secondary` «Ver animales en adopción» a `LISTING_PATH`) (research R3)
- [X] T017 [P] [US2] Crear `src/components/home/adopter-promise.tsx` (`h2` «Si querés adoptar», las tres frases en `text-base` y `VerificationBadge` `md` nivel 1 con su enlace a la explicación de los niveles) (plan §Diseño)
- [X] T018 [US2] En `src/app/[locale]/(public)/page.tsx`, pedir `listingView(NO_FILTERS, null, 8).catch(() => null)` y componer `AdopterPromise` y `RecentPets` en `HomeLayout` (research R1, R2, R3)
- [X] T019 [US2] En `src/app/[locale]/(public)/animales/[code]/page.tsx`, confirmar que `petViewEvent` recibe `referer` y `host` y da `origin: 'home'` desde la portada (sin cambio si ya los pasa) (research R6)

**Checkpoint**: `portada.spec.ts` de US1 y US2 pasa; capturas de `walk.mjs` con animales, sin
animales y con la base detenida (quickstart 3 y 4).

---

## Fase 5: User Story 3 — La portada se ve bien pegada en un grupo, en la computadora y sin JavaScript (P3)

**Objetivo**: la vista previa con el nombre, la frase y el cartel; la portada entera sin JavaScript;
a 1280 los animales en cuatro columnas y ningún bloque angosto.

**Prueba independiente**: el HTML de `/` trae los Open Graph del contrato y `/imagen` responde un
JPEG de menos de 300 KB; con JavaScript apagado todo se lee y lleva; a 1280 hay 4 animales por fila.

### Tests de US3

- [X] T020 [P] [US3] Escribir `src/lib/og/site-share-version.test.ts`: la versión cambia si cambia el nombre o la frase, y es la misma con los mismos datos (research R5, R8)
- [X] T021 [US3] Sumar a `tests/e2e/portada.spec.ts` (research R8 c y d): un contexto con `javaScriptEnabled: false` que ve la frase, los pasos, los animales y llega por cada enlace; el HTML de `/` con `og:title` = `APP_NAME`, `og:description` = la frase y `og:image` a `/imagen?v=…`; `/imagen` con `content-type: image/jpeg` y menos de 300 KB

### Implementación de US3

- [X] T022 [P] [US3] Implementar `src/lib/og/site-share-version.ts` hasta que T020 pase
- [X] T023 [P] [US3] Crear `src/components/site/site-share-image.tsx` (el cartel sin foto con `OG_PALETTE` y `SHARE_LAYOUT`: el nombre en afiche, la frase en tinta, la tira con cinta y «Se busca hogar»; estilos en línea; ningún animal ni persona) (research R5)
- [X] T024 [US3] Crear `src/app/[locale]/(public)/imagen/route.tsx` con `ImageResponse` + `shareFont()` + `smallJpeg()` y `cache-control: public, max-age=31536000, immutable`; sumar a `generateMetadata` de la portada `openGraph` con `images: [{ url: '/imagen?v=' + siteShareVersion(...), width: 1200, height: 630, alt }]` (research R5, contracts/portada.md)
- [X] T025 [US3] Revisar a 1280 con `walk.mjs` que la cabecera de la portada llene la hoja (frase en 7 columnas, quien adopta en 5), los pasos en tres columnas y la pared en cuatro, sin bloques angostos con blanco al costado; ajustar `HomeLayout` si no (plan §Diseño, SC-007)

**Checkpoint**: `portada.spec.ts` entero verde; el freno de `animales-rendimiento.spec.ts` sigue
verde con `/` ≤ 150 KB.

---

## Fase 6: Pulido

- [X] T026 [P] Sumar a la tabla de componentes de `docs/10-design-system.md` las filas de `HomeLayout`, `HomeHero`, `RescuerSteps`, `AdopterPromise`, `RecentPets`, `RecentPetsFailed` y `SiteShareImage`, y la decisión fechada del orden en 1024 (plan §Orden)
- [X] T027 [P] Cerrar KL-57-6 en `docs/known-limitations.md` («Se cerró con la historia #61»)
- [X] T028 [P] Cargar `vercel:react-best-practices` y revisar los TSX nuevos (Server Components, sin `"use client"`, sin fetch en `components/home/`)
- [X] T029 Correr `pnpm verify` completo (incluye `pnpm mutation` al 100 % sobre `home-events`, `listing-events` y `site-share-version`) y las capturas de quickstart.md a 390 y 1280

---

## Dependencias y orden

- Fase 1 → Fase 2 → US1 (Fase 3) → US2 (Fase 4) → US3 (Fase 5) → Pulido.
- US2 y US3 tocan la misma `page.tsx` que US1: van después de T012.
- Dentro de cada fase, los [P] van en paralelo; cada test se escribe y falla antes de su
  implementación (T004 → T005, T006 → T007, T020 → T022).
