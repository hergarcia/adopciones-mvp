---
description: "Tareas de la historia #238 — Los animales en adopción de cada rescatista en su perfil"
---

# Tasks: Los animales en adopción de cada rescatista en su perfil

**Input**: `specs/029-animales-en-su-perfil/` — spec.md, plan.md (§Diseño, §Qué se testea),
research.md (R1–R10), data-model.md, contracts/routes.md, contracts/measurement.md, quickstart.md

**Tests**: sí, y solo los de research R9 y plan §Qué se testea; no se agrega ninguno fuera de ahí ni
se saca ninguno de ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de tocar la migración o sus tests se
carga `supabase:supabase-postgres-best-practices`; antes de escribir JSX, `frontend-design:frontend-design`
y `docs/10-design-system.md` (y `vercel:react-best-practices` después de editar varios TSX); cada
texto visible y el texto de docs se escriben con `sin-slop`. La migración es un solo archivo; después
de cada cambio, `pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: la regla del listado filtrada por dueña, en la base y en la consulta, con la prueba de
que el perfil ve exactamente lo del listado.

- [ ] T001 Crear `supabase/migrations/20261029120000_profile_pets.sql`: `drop function public.listed_pets` de nueve parámetros y `create function public.listed_pets` con `p_owner_public_id text default null` al final, el cuerpo de `20261026120000_litter_lifecycle.sql` más el filtro de dueña por `profiles.public_id`, `security definer stable set search_path = ''`, `revoke all ... from public` y `grant execute ... to anon, authenticated` (data-model.md, research R1)
- [ ] T002 `pnpm exec supabase db reset` y `pnpm db:types`; `tests/db/types-drift.test.ts` verde
- [ ] T003 [P] `tests/db/profile-pets.test.ts`, sobre `listing-support.ts`, `lifecycle-support.ts`, `litter-support.ts` y `moderation-support.ts`: una dueña con dos disponibles, uno en proceso, uno pausado, uno vencido, uno adoptado, uno dado de baja y una camada de cinco, y otra persona con animales. Como anónimo, `listed_pets(p_owner_public_id)` trae solo los cuatro de la dueña a la vista (la camada una vez, en proceso con su estado), en el orden `published_at desc, code desc`, y son exactamente las filas de `listed_pets()` sin dueña filtradas por esa dueña; un `public_id` inexistente da cero; la dueña sin teléfono de hoy da cero y vuelve al confirmarlo; suspendida da cero y vuelve al reactivarla; quien bloqueó a la dueña ve cero y la bloqueada ve los cuatro; la dueña con su sesión ve los mismos cuatro que un anónimo, sin el pausado (FR-007); con 30 a la vista, `p_limit` 25 y el cursor de la fila 24 traen 24 y después 6, sin repetidos (FR-002–FR-004, FR-006, constitución §V)
- [ ] T004 `src/lib/supabase/queries/listed-pets.ts`: extraer el armado de filas de `listListedPets` a `listedPetsOf(rows, now)` y sumar `listProfilePets(publicId, cursor, limit, now?)` (contracts/routes.md)
- [ ] T005 `src/app/[locale]/_components/listing-view.ts`: `profilePetsView(publicId, cursor, shown)`, pide `shown + 1`, `listedCardViews` y `nextCursor`, sin total (research R2)
- [ ] T006 [P] `src/lib/pets/listing-query.ts`: exportar `parseShown` para leer `mostrar` en el perfil, sin cambiar su regla

**Checkpoint**: la función filtra por dueña con las reglas del listado y su test pasa; la consulta y la
vista de tandas existen.

---

## Fase 2: User Story 1 — Ver en el perfil de quien rescata los animales que tiene en adopción (P1) 🎯 MVP

**Goal**: el perfil público muestra «En adopción» con las tarjetas del listado de esa persona, con
«Ver más», el aviso y «Probar de nuevo» si falla, y nada si no tiene ninguno a la vista.

**Independent Test**: spec.md US1.

### Tests de US1

- [ ] T007 [P] [US1] `src/lib/pets/profile-pets-state.test.ts`: `profilePetsReducer` desde una primera tanda con tarjetas y desde una falla al abrir: `retry_started` solo con falla al abrir; `more_started` solo con `next`; `loaded` tras `retry` reemplaza tarjetas y `next` y limpia la falla, tras `more` las suma; `loaded` con cero tras `retry` deja `cards` vacío y sin falla; `failed` guarda `on` según lo pendiente, el motivo, y sube `request`; `aborted` vuelve a `pending: 'none'` sin tocar lo demás (data-model.md, FR-009, FR-009a)

### Implementación de US1

- [ ] T008 [US1] `src/lib/pets/profile-pets-state.ts`: `ProfilePetsState`, sus acciones y `profilePetsReducer` (data-model.md)
- [ ] T009 [US1] `src/app/api/perfil/[id]/animales/route.ts`: `GET` con `despues` opcional, `isPublicId` o tanda vacía sin base, `profilePetsView` con 24, `no-store`, 503 con `NO_RESPONSE_ERROR`, sin medir (contracts/routes.md, research R4)
- [ ] T010 [P] [US1] `src/components/pets/pet-wall-skeleton.tsx`: extraer la pared de `src/app/[locale]/(app)/mis-animales/loading.tsx` con la prop `lines` y usarla ahí sin cambiar lo que dibuja (plan §Diseño)
- [ ] T011 [P] [US1] `messages/es.json`: `profile.public.pets.title`, `load_error`, `retry`, `cap` con los textos de plan §Textos, revisados con `sin-slop`
- [ ] T012 [US1] `src/components/pets/profile-pets.tsx` (`"use client"`): `useReducer(profilePetsReducer)` y `useListingPages` contra `/api/perfil/{id}/animales`; `section` con `h2`, `PetWall` (`PetPhoto`, `prefetch={false}`), `LoadMoreButton` con `href=/perfil/{id}?mostrar={n+24}#a-{n+1}` y `loadMoreState`, `SaveFailedStrip` + «Probar de nuevo» (`Button` `secondary`, `loading`) en la falla al abrir con `PetWallSkeleton` mientras corre, `SaveFailedStrip` al pie en la falla de «Ver más»; `null` si queda sin tarjetas y sin falla (contracts/routes.md, plan §Diseño)
- [ ] T013 [US1] `src/app/[locale]/(public)/perfil/[id]/_components/profile-pets-texts.ts`: arma los textos de `ProfilePets` (los nuevos y los de «Ver más» y sus fallas de `pets.listing`)
- [ ] T014 [US1] `src/components/profile/public-profile-layout.tsx`: el lugar `pets` (nulo por defecto) entre `vouchers` y `slot`, a lo ancho de la hoja
- [ ] T015 [US1] `src/app/[locale]/(public)/perfil/[id]/page.tsx` y `_components/profile-screen.tsx`: `mostrar` en `searchParams` con `parseShown`; `profilePetsView(id, null, shown).catch(() => null)` en el `Promise.all` cuando `isPublicId` y no es una vista previa; `ProfileScreen` recibe `pets` y monta `ProfilePets` solo si es `null` (falla) o tiene tarjetas; la pantalla de bloqueo y el «no existe» no cambian (FR-001–FR-012, research R3)
- [ ] T016 [US1] `tests/e2e/perfil-animales.spec.ts`, primera prueba: con una rescatista sembrada con dos animales y una camada, desde la ficha de uno, tocar su nombre, ver «En adopción» con las tres tarjetas y la camada una vez, tocar otra tarjeta y llegar a su ficha con «Solicitar» (US1 AS 1–3)

**Checkpoint**: US1 se puede probar sola contra la app (quickstart pasos 1–6).

---

## Fase 3: User Story 2 — Mandar el enlace del perfil desde «Mis animales» (P2)

**Goal**: «Mis animales» muestra la línea y el botón del enlace del perfil solo con algún animal a la
vista para cualquiera, y la copia se mide con su pantalla.

**Independent Test**: spec.md US2.

### Implementación de US2

- [ ] T017 [US2] `src/lib/analytics/events.ts`: `PROFILE_LINK_ORIGINS`, `ProfileLinkOrigin` y `profile_link_copied: { from: ProfileLinkOrigin }`, con su comentario de disparador al día (contracts/measurement.md)
- [ ] T018 [US2] `src/actions/profile.ts`: `trackProfileMoment('profile_link_copied', { from })` valida `from` con `isOneOf(PROFILE_LINK_ORIGINS, …)` y si no responde `profile.errors.save_failed` sin medir (research R8)
- [ ] T019 [US2] `src/components/profile/copy-profile-link.tsx`: prop obligatoria `from: ProfileLinkOrigin` que pasa a la acción; `src/components/profile/public-profile-links.tsx` pasa `'my_profile'` y `src/app/[locale]/(app)/mis-avales/_components/my-vouches-sections.tsx` pasa `'my_vouches'`
- [ ] T020 [P] [US2] `messages/es.json`: `pets.my_pets.profile_link` con el texto de plan §Textos, revisado con `sin-slop`
- [ ] T021 [US2] `src/components/profile/profile-link-line.tsx`: la línea en `--text-base` y `CopyProfileLink from="my_pets"` con los textos de `copyProfileLinkTexts`, en `max-w-[var(--measure)]` (contracts/routes.md, plan §Diseño)
- [ ] T022 [US2] `src/app/[locale]/(app)/mis-animales/page.tsx`: en el `Promise.all`, `profilePetsView(profile.publicId, null, 1).catch(() => null)` con el `Profile` de `requireProfile`; `ProfileLinkLine` entre la fila de «Publicar un animal» y la pared solo si trae al menos una tarjeta; nada en el vacío de la pantalla (FR-013–FR-016, research R8)
- [ ] T023 [US2] `tests/e2e/perfil-animales.spec.ts`, segunda prueba: como la rescatista sembrada, en «Mis animales» ver la línea, tocar «Copiar el enlace» con el portapapeles permitido y ver «Enlace copiado»; el portapapeles tiene la dirección de su perfil (US2 AS 1–2)

**Checkpoint**: US2 se puede probar sola (quickstart pasos 7–8).

---

## Fase 4: User Story 3 — Saber si el perfil funciona como vidriera (P3)

**Goal**: la visita al perfil dice si mostró animales, la ficha abierta desde un perfil cuenta como
`profile`, y docs/03 dice cómo se lee.

**Independent Test**: spec.md US3.

### Tests de US3

- [ ] T024 [P] [US3] `src/lib/analytics/visit-origin.test.ts`: `referer` del mismo host con `/perfil/<22 caracteres válidos>` da `profile`; con la marca de Compartir sigue dando `shared`; `/perfil/corto`, `/perfil/<22>/foto`, `/perfiles/<22>` y un host ajeno con `/perfil/<22>` no dan `profile` (research R6)
- [ ] T025 [P] [US3] `src/lib/analytics/view-origin.test.ts`: `profileViewProps(origin, page)` con una tanda con tarjetas da `with_pets: true`, con cero da `false`, con `null` no trae la propiedad; el `origin` pasa tal cual y no hay propiedades de más (research R7)

### Implementación de US3

- [ ] T026 [US3] `src/lib/analytics/visit-origin.ts`: `'profile'` en `PetViewOrigin` y en `siteOrigin` con la regla de `isPublicId` sobre el segundo segmento
- [ ] T027 [US3] `src/lib/analytics/events.ts` y `src/lib/analytics/view-origin.ts`: `public_profile_viewed: { origin; with_pets?: boolean }` y `profileViewProps`; comentarios de disparador al día (contracts/measurement.md)
- [ ] T028 [US3] `src/app/[locale]/(public)/perfil/[id]/page.tsx`: `track('public_profile_viewed', profileViewProps(origin, pets))` y no medir con `mostrar` presente (FR-017, FR-022)
- [ ] T029 [US3] `docs/03-mvp-features.md` §Métricas de éxito, «Cómo se leen»: el punto 6, «¿El rescatista usa el sitio como su vidriera?», con el texto de contracts/measurement.md, revisado con `sin-slop` (FR-025)

**Checkpoint**: US3 se puede probar sola (quickstart pasos 2, 3 y 5 leyendo `[medición]`).

---

## Fase 5: Pulido

- [ ] T030 [P] `docs/10-design-system.md` §Componentes: filas de `ProfilePets`, `PetWallSkeleton` y `ProfileLinkLine`; `PublicProfileLayout` con el lugar de «En adopción»; `CopyProfileLink` con `from`; `PetWall` y `LoadMoreButton` nombran el perfil entre sus usos
- [ ] T031 `vercel:react-best-practices` sobre los TSX tocados; `pnpm lint`, `pnpm typecheck`
- [ ] T032 `pnpm gates:affected` (la migración corre la suite entera) con Stryker al 100 % en `profile-pets-state.ts`, `visit-origin.ts` y `view-origin.ts`
- [ ] T033 Capturas a 390 y 1280 px: `node scripts/walk.mjs --story 238-animales-en-su-perfil --user /perfil/<publicId> /mis-animales` y el perfil de una persona sin animales, para el design-reviewer
- [ ] T034 Recorrer quickstart.md entero contra `pnpm dev`

---

## Dependencias

- Fase 1 bloquea todo. T002 sigue a T001; T003 y T004 siguen a T002; T005 sigue a T004.
- US1 (Fase 2) necesita la Fase 1. US2 necesita `profilePetsView` (T005) y, para que el enlace lleve a
  algo, US1. US3 necesita la página de US1 (T015) para `with_pets`; el origen `profile` (T024, T026)
  no depende de nada.
- Pulido al final.

## Paralelo

- Fase 1: T003 y T006 mientras se hace T004.
- US1: T007, T010 y T011 juntos; después T008 → T012; T009 en paralelo con T012.
- US2: T020 en paralelo con T017–T019.
- US3: T024 y T025 juntos, antes de T026 y T027.

## Estrategia

MVP = Fase 1 + US1: el perfil ya muestra los animales y se puede probar contra la app. US2 suma el
enlace en «Mis animales»; US3, la medición y su lectura. Cada user story cierra con `pnpm
gates:affected` antes de pasar a la siguiente.
