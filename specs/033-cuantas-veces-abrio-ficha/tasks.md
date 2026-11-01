---
description: "Tareas de la historia #269 — Ver cuántas veces se abrió la ficha de cada animal, cuántos quisieron adoptarlo y a cuántos frenó la verificación"
---

# Tasks: Ver cuántas veces se abrió la ficha de cada animal, cuántos quisieron adoptarlo y a cuántos frenó la verificación

**Input**: `specs/033-cuantas-veces-abrio-ficha/` — spec.md, plan.md (§Diseño, §Cómo se construye),
research.md (R1–R10), data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: sí, y solo los de research R10; no se agrega ninguno fuera de ahí ni se saca ninguno de
ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se abre
`docs/10-design-system.md` (y se carga `frontend-design:frontend-design` si la corrida lo tiene);
antes de tocar la migración o sus tests, `supabase:supabase-postgres-best-practices` si está; todo
texto visible, con `sin-slop`; después de varios TSX, `vercel:react-best-practices`. La migración es
un solo archivo; después de cada cambio, `pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: lo que se guarda, las funciones que suman y leen, y las reglas puras que usan el
animal y la camada.

- [X] T001 Crear `supabase/migrations/<ts>_publication_stats.sql` (con `<ts>` posterior a `20261102120000`): la tabla `public.publication_stats` con sus `check`, `unique` y `on delete cascade`, RLS sin políticas, `revoke all ... from anon, authenticated` y su `comment` (data-model.md, research R1)
- [X] T002 En la misma migración: los disparadores `after insert` en `public.pets` (solo `litter_id is null`) y en `public.litters` que crean la fila con `from_publication = true`, y el `insert ... select` de las publicaciones que ya existen con `from_publication = false` (data-model.md §Ciclo de vida, research R2, FR-011)
- [X] T003 En la misma migración: `count_pet_open`, `count_litter_open` y `count_apply_tap` con `execute` solo para `service_role`, y `my_publication_stats` con `execute` para `authenticated`; todas `security definer`, `set search_path = ''`, `revoke all ... from public` (data-model.md §Funciones, research R3, R6)
- [X] T004 `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T005 [P] `src/lib/pet-stats/types.ts`: `PublicationKind`, `PublicationStats`, `ApplyCount` (data-model.md §Tipos)
- [X] T006 [P] `src/lib/pet-stats/count-rules.ts`: `shouldCountOpen` sobre el estado de la página, si es quien publicó y `isLinkPreview`; `applyCountOf` sobre la lista de `tapEvents` (research R4, R5)
- [X] T007 [P] `src/lib/pet-stats/stats-view.ts`: `statsView(stats)` → vacío solo con todo en cero; `showIdentity` con `requiredLevel` 2 o `identityStops` > 0; desde cuándo por `fromPublication` (data-model.md, FR-012, FR-016, FR-017)
- [X] T008 [P] `src/lib/schemas/pet-stats.ts`: `petStatsRequestSchema` (`kind` y `id` uuid) (contracts)
- [X] T009 [P] `src/lib/supabase/queries/publication-stats.ts`: `countPublicationOpen`, `countApplyTap` (cliente de servicio, nunca lanzan, sin llamada con nada que sumar) y `getMyPublicationStats` (sesión, `null` sin fila o con error) (contracts, FR-009, SC-004)
- [X] T010 [P] `tests/db/publication-stats-support.ts`: sembrar sobre los soportes de `tests/db` que ya existen un animal de cada nivel con su dueña, otra persona, quien administra, y solicitudes mandadas, retiradas y cerradas; leer la tabla con el cliente de servicio

**Checkpoint**: la base suma y lee bien sin ninguna pantalla.

---

## Fase 2: User Story 1 — Ver cómo le va a un animal en «Mis animales» (P1) 🎯 MVP

**Goal**: la ficha de un animal suma aperturas, «Quiero adoptar» suma toques y frenos, y la página del
animal en «Mis animales» muestra «Cómo le va a…» con cargando, vacío y error, solo a quien lo publicó.

**Independent Test**: spec.md US1.

### Tests de US1

- [X] T011 [P] [US1] `src/lib/pet-stats/count-rules.test.ts`: `shouldCountOpen` en cada estado de la página (`listed`, `paused`, `expired`, `unavailable`, `blocked` cuentan; `missing`, `young`, `own_hidden`, `own_listed` no), con cada agente de `LINK_PREVIEW_AGENTS` y Googlebot, con agente nulo; `applyCountOf` con toque solo, toque y cada freno, freno sin toque, `limit` y `not_receiving` sin freno, lista vacía
- [X] T012 [P] [US1] `src/lib/pet-stats/stats-view.test.ts`: vacío solo con los cinco números en cero (y no con solo solicitudes, solo toques o solo frenos); `showIdentity` con nivel 2 sin frenos, con nivel 1 y un freno, con nivel 1 sin frenos; desde la publicación contra desde el día
- [X] T013 [P] [US1] `src/lib/schemas/pet-stats.test.ts`: cada `kind`, un `kind` desconocido, un `id` que no es uuid, una propiedad de más
- [X] T014 [P] [US1] `tests/db/publication-stats-privacy.test.ts`: visitante, otra persona y quien administra no leen `publication_stats` directo ni reciben fila de `my_publication_stats` del animal ajeno; ninguno de los tres (tampoco la dueña) puede ejecutar `count_pet_open`, `count_litter_open` ni `count_apply_tap`; la tabla no tiene ninguna columna que apunte a una persona ni una hora (SC-003, FR-025, FR-026, FR-027)
- [X] T015 [P] [US1] `tests/db/publication-stats-rules.test.ts` (animal): `count_pet_open` suma uno y con la dueña como `p_viewer` no suma; un código que no existe no hace nada; `count_apply_tap` con toque, con cada freno, con toque y freno, con la dueña (nada) y con un `p_stop` inválido (error, nada sumado); `applications` cuenta mandadas, retiradas y cerradas, y deja de contar la de quien borró su cuenta (FR-007); la fila de un animal publicado después de la migración tiene `from_publication`; renovar y volver a publicar no cambian la fila ni `counted_since` (FR-013); la dueña lee su fila con `required_level`; borrar el animal y borrar la cuenta de la dueña se llevan la fila (FR-028); 20 `count_pet_open` en paralelo suman 20 (SC-001, SC-006, FR-010)
- [X] T016 [US1] `tests/e2e/como-le-va.spec.ts`: sin sesión abrir la ficha de un animal sembrado dos veces y pasar por su tarjeta del listado sin abrirla; una persona sin teléfono toca «Quiero adoptar» y la frena el teléfono; la dueña abre su propia ficha y después la página del animal en «Mis animales» → 2 aperturas, 1 toque, 1 frenado por el teléfono, 0 solicitudes, «Pedís el teléfono verificado», sin renglón de identidad; otra persona abre la ficha pública y no ve ningún número (SC-002, FR-022)

### Implementación de US1

- [X] T017 [US1] `src/app/[locale]/(public)/animales/[code]/page.tsx`: con `shouldCountOpen` sobre el estado de la página, `countPublicationOpen('pet', code, user?.id ?? null)` dentro de `deliver`, antes de elegir la pantalla, así suma también en pausada, vencida, no disponible y bloqueada; nada cambia de lo que se ve (FR-001, FR-002, FR-009)
- [X] T018 [US1] `src/app/[locale]/(app)/solicitar/[code]/page.tsx`: en los dos caminos (sin sesión y con sesión), `countApplyTap(code, user?.id ?? null, applyCountOf(events))` dentro de `deliver`, con los mismos `events` que van a `trackAll` (FR-004, FR-005, FR-006, research R5)
- [X] T019 [P] [US1] `messages/es.json`: `pets.stats.*` (título, desde que, desde el, los cinco renglones con plural, las dos líneas del nivel, el vacío, el error, «Probar de nuevo»), escritos y revisados con `sin-slop`; los cuatro textos de la historia palabra por palabra (research R9, FR-024)
- [X] T020 [US1] `src/components/pets/pet-stats-texts.ts`: `PetStatsView` y `petStatsTexts(stats, subject)` con `getTranslations`, que arma los textos según `statsView`, el nombre y el sexo (una camada en femenino)
- [X] T021 [US1] `src/actions/pet-stats.ts`: `readPetStats` con el schema, `getMyPublicationStats`, `petStatsTexts` y, en el vacío, `petGroupPost` sobre `getPublicPet`; devuelve `ActionResult<PetStatsView>` y nunca lanza; error `pets.stats.load_error` (contracts)
- [X] T022 [P] [US1] `src/components/pets/pet-stats-block.tsx`: `section` con `h2`, desde cuándo, `dl` en el orden de la historia con el número primero por `order`, la línea del nivel con `VerificationBadge` `sm` (FR-014, FR-015, FR-023); el vacío con su frase y `GroupPostButton` si viene el texto (plan §Diseño)
- [X] T023 [P] [US1] `src/components/pets/pet-stats-skeleton.tsx`: la forma exacta del bloque con `Skeleton`
- [X] T024 [US1] `src/components/pets/pet-stats-live.tsx` (`"use client"`): dibuja `PetStatsBlock` con la vista o el error con `ErrorText` y «Probar de nuevo» (`Button` `secondary` `sm` con `loading`), que llama a `readPetStats` y reemplaza solo el bloque; `aria-live="polite"` en el contenedor (FR-019, FR-020, SC-005)
- [X] T025 [US1] `src/components/pets/pet-work-layout.tsx`: `aside` y `rest` opcionales en `small` (teléfono: después de `children`, en ese orden; desde 1024, filas `auto auto 1fr` con la foto en las dos primeras de la columna angosta y `aside` en la tercera); sin ellos, la grilla de hoy (research R8)
- [X] T026 [US1] `src/app/[locale]/(app)/mis-animales/_components/pet-stats-section.tsx`: Server Component que llama a `readPetStats` y dibuja `PetStatsLive`; `src/components/pets/my-pet-panel.tsx` recibe `stats` para `aside` y pasa el seguimiento a `rest`
- [X] T027 [US1] `src/app/[locale]/(app)/mis-animales/[id]/page.tsx`: `Suspense` con `PetStatsSkeleton` alrededor de `PetStatsSection`, pasado a `MyPetPanel`; `loading.tsx` suma `PetStatsSkeleton` en el mismo lugar (FR-018, FR-021)
- [X] T028 [US1] Correr `node scripts/walk.mjs --story cuantas-veces-abrio-ficha --user /mis-animales/<id>` a 390 y 1280 con números, vacío y nivel 2, y ajustar contra plan §Diseño (SC-007)

**Checkpoint**: US1 se prueba sola con un animal.

---

## Fase 3: User Story 2 — Ver cómo le va a una camada, sumando todas sus crías (P2)

**Goal**: la ficha de la camada suma aperturas, los toques y frenos de sus crías suman en ella, y la
página de la camada en «Mis animales» muestra el mismo bloque.

**Independent Test**: spec.md US2.

### Tests de US2

- [X] T029 [P] [US2] `tests/db/publication-stats-rules.test.ts` (camada): la camada tiene fila y sus crías no; `count_litter_open` suma y con la dueña no; `count_pet_open` con el código de una cría no suma nada; `count_apply_tap` con el código de una cría suma en la camada; `applications` suma las de todas las crías, también cerradas; quitar una cría deja lo sumado y saca sus solicitudes; borrar la camada se lleva la fila; la dueña lee la fila de su camada y otra persona no (FR-003, FR-008)

### Implementación de US2

- [X] T030 [US2] `src/app/[locale]/(public)/camadas/[code]/page.tsx`: `countPublicationOpen('litter', code, user?.id ?? null)` con `shouldCountOpen`, dentro de `deliver`, antes de elegir la pantalla (FR-001, FR-003)
- [X] T031 [US2] `src/actions/pet-stats.ts`: con `kind` `litter`, el vacío usa `litterGroupPost` sobre `getLitterByCode`; `petStatsTexts` con el nombre de la camada en femenino (FR-012)
- [X] T032 [US2] `src/components/litters/my-litter-panel.tsx` recibe `stats` para `aside` y pasa la sección «Crías» a `rest`; `src/app/[locale]/(app)/mis-animales/camadas/[id]/page.tsx` con `Suspense` y `PetStatsSection`; su `loading.tsx` suma `PetStatsSkeleton`
- [X] T033 [US2] Capturas de la página de una camada a 390 y 1280 con `walk.mjs` y ajustar contra plan §Diseño

**Checkpoint**: US1 y US2 andan juntas y por separado.

---

## Fase 4: User Story 3 — Leer si quien rescata mantiene la verificación (P3)

**Goal**: docs/03 §Métricas de éxito dice cómo se lee la pregunta nueva, sin momentos nuevos.

**Independent Test**: spec.md US3.

- [X] T034 [US3] `docs/03-mvp-features.md` §Métricas de éxito, «Cómo se leen»: lectura 10 «¿Quien rescata mantiene la verificación cuando ve lo que le cuesta?» con los cuatro puntos de la historia (`pet_published` y `pet_edited` por `required_level` antes y después del día en que llegó, ediciones que bajan de 2 a 1 y las que suben, `pet_published` con `ordinal` al lado de las opiniones que nombren la ficha o los números, la advertencia de 3 a 5 rescatistas), escrita con `sin-slop` (FR-031)
- [X] T035 [US3] Comprobar que `src/lib/analytics/events.ts` no cambió en la rama (FR-030)

---

## Fase 5: Pulido

- [X] T036 [P] `docs/06-i18n.md`: glosario de «apertura» (`open`), «freno» (`stop`) y «Cómo le va a…» (`pet stats`), con que se cuentan veces y no personas
- [X] T037 [P] `docs/10-design-system.md`: filas de `PetStatsBlock`, `PetStatsLive` y `PetStatsSkeleton`, y `PetWorkLayout` con `aside` y `rest`; en §Pantallas anchas, una línea de que el riel de las pantallas de trabajo sobre un animal lleva debajo de la foto el bloque de «Cómo le va a…»
- [X] T038 Releer todos los textos nuevos con `sin-slop` y `vercel:react-best-practices` sobre los TSX tocados
- [ ] T039 `pnpm gates:affected` verde (lint, tipos, pruebas, mutación al 100 % de lo que tiene test, build y los e2e que tocan) y recorrer quickstart.md

---

## Dependencias y orden

- Fase 1 bloquea todo. T001–T003 son un archivo; T004 después; T005–T010 en paralelo entre sí.
- US1 (Fase 2) antes que US2: US2 reusa la acción, el bloque, el esqueleto y la grilla.
- US3 no depende del código; va después para no escribir la lectura de algo que no existe.
- Dentro de cada US, primero las pruebas (rojas), después la implementación.
- Pulido al final.
