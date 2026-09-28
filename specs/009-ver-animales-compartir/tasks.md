---
description: "Tareas de la historia #57 — Ver los animales publicados con filtros y compartir la ficha de cada uno"
---

# Tasks: Ver los animales publicados con filtros y compartir la ficha de cada uno

**Input**: `specs/009-ver-animales-compartir/` — spec.md, plan.md (§Diseño, §Qué se testea),
research.md (R1–R16), data-model.md, contracts/routes.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí. Todo lo
que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola. Antes de escribir JSX o CSS se carga `frontend-design:frontend-design` y se abre
`docs/10-design-system.md`; antes de la migración y de sus tests,
`supabase:supabase-postgres-best-practices`; después de varios TSX, `vercel:react-best-practices`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Preparación, base y pulido no llevan etiqueta

---

## Fase 1: Preparación

**Propósito**: la dependencia nueva y las constantes que todo lo demás lee.

- [X] T001 Instalar `sharp` con `pnpm add sharp@latest` (0.35.5, verificada el 2026-09-28; su línea con fecha ya está en `docs/07-stack.md`) y comprobar que `package.json` y el lockfile quedan con esa versión como dependencia directa
- [X] T002 [P] `src/lib/config.ts`: `INDEXING_ENABLED = false`, con el comentario que apunta a docs/04 y a M5 (research R7)
- [X] T003 [P] `src/lib/pets/rules.ts`: `LISTING_PAGE_SIZE = 24`, `LISTING_MAX_SHOWN = 240`, `AGE_BANDS` en meses (`puppy [0,12)`, `young [12,36)`, `adult [36,96)`, `senior [96,)`), `PET_CODE_PATTERN = /^[0-9a-hjkmnp-tv-z]{10}$/`, `STALE_PAGE_MINUTES = 50`, `SHARE_IMAGE_MAX_BYTES = 300 * 1024` (data-model.md §Reglas en TypeScript)
- [X] T004 [P] `src/lib/pets/paths.ts`: `LISTING_PATH = '/animales'`, `petPath(code)`, `petShareImagePath(code, version)`

---

## Fase 2: Base compartida

**Propósito**: la base de datos, las lecturas y lo que las cuatro user stories usan. **Punto de
control al final: `pnpm test` verde con los tests de base de esta fase.**

### Base de datos

- [X] T005 Crear la migración con `pnpm exec supabase migration new listed_pets`: `public.pet_codes` (`code text primary key` con `check (code ~ '^[0-9a-hjkmnp-tv-z]{10}$')`, `created_at timestamptz not null default now()`, RLS activa sin policies, `revoke all ... from anon, authenticated`); `private.new_pet_code()` (10 caracteres del alfabeto Crockford en minúscula desde `extensions.gen_random_bytes`); `pets.code text` con el mismo `check`, el trigger `pets_assign_code` (`before insert`: genera, inserta en `pet_codes`, reintenta si ya existía) y un trigger `before update` que rechaza cambiar `code`; backfill de las publicaciones existentes antes del `set not null` y del `unique`; y el índice `pets_listing_idx on pets (published_at desc, code desc) where status = 'available'` (data-model.md, research R3)
- [X] T006 En la misma migración: `private.pending_ttl()` (`interval '7 days'`, `immutable`), `private.pet_is_listed(owner uuid)` (`sql stable`, invoker, `public.identity_level_one(owner, private.pending_ttl())`) y `private.pet_age_months(value smallint, unit text, as_of date, today date)` (`immutable`, la cuenta de `monthsBetween` + base de `lib/pets/age.ts`: aniversario al último día del mes que no tiene ese día), todas con `set search_path = ''` y comentarios con el porqué (research R1, R5)
- [X] T007 En la misma migración: `public.listed_pets(p_species text[], p_sexes text[], p_sizes text[], p_age_bands int4range[], p_departments text[], p_neutered_only boolean, p_after_published timestamptz, p_after_code text, p_limit integer)` (`security definer`, `p_limit` recortado a `[1, 241]`, `status = 'available'` y `private.pet_is_listed(owner_id)`, una opción cualquiera dentro de cada filtro y todos los filtros, la edad con `private.pet_age_months(..., public.uruguay_today()) <@ any(p_age_bands)`, cursor estricto `(published_at, code) < (p_after_published, p_after_code)`, orden `published_at desc, code desc`, columnas exactas de data-model.md §`listed_pets` con `total` = `count(*) over ()`, sin `id` y con el id de la cuenta solo como `cover_owner`)
- [X] T008 En la misma migración: `public.pet_by_code(p_code text)` (`plpgsql stable security definer`: ninguna fila si el código no existe; `visibility` `'listed' | 'hidden'`; `is_owner` = `(select auth.uid()) = owner_id`; con `listed` o `is_owner`, los datos de data-model.md §`pet_by_code` con `owner_folder` una vez por fila, `photos jsonb` sin carpeta en el orden de `position`, `version`, y `publisher_level` 1, 2 o `null` sin nivel 1; `pet_id` solo si `is_owner`; con `hidden` y no dueña, todo lo demás `null`) y `public.pet_share_card(p_code text)` (ninguna fila si no está a la vista; `version` = `md5` corto de la portada, el nombre, el departamento y la localidad)
- [X] T009 En la misma migración, grants y policies: `revoke all ... from public` + `grant execute ... to anon, authenticated` sobre las tres `public.*`; `grant usage on schema private to anon`; `private.pet_photo_object_listed(object_name text)` y `private.avatar_object_listed(object_name text)` (`sql stable security definer`) con `execute` para `anon, authenticated`; `revoke execute ... from public, anon, authenticated` sobre las demás `private.*` nuevas; policies `pet_photos_objects_select_listed` y `avatars_select_listed_publisher` en `storage.objects`, `for select to anon, authenticated` (data-model.md §Policies nuevas). Ninguna policy existente cambia
- [X] T010 Correr `pnpm exec supabase db reset` y `pnpm db:types` para regenerar `src/lib/supabase/types.ts`

### Tests de base (privacidad primero)

- [X] T011 `tests/db/listing-support.ts`: crear un publicador con nivel 1 (o sin teléfono, a medias, cambio a medias vigente o vencido, número perdido, identidad sin teléfono), publicar un animal con sus fotos y objetos en Storage por la clave de servicio con `published_at` en la ventana futura propia de la prueba (año 2999 más un desplazamiento al azar, research R14), y borrar todo al terminar; clientes anónimo, de otra cuenta y de la dueña
- [X] T012 `tests/db/listed-pets.test.ts` — visibilidad y puerta de atrás (plan.md §Qué se testea, «Visibilidad» y «Nada por la puerta de atrás»): cada estado del teléfono en `listed_pets` (filas y `total`), `pet_by_code` y `pet_share_card`, como anónimo y como otra cuenta; vuelve al confirmar; el cambio a medias vencido cuenta como nivel 1; lecturas directas de `pets`, `pet_photos`, `profiles`, `identity_verifications` y `pet_codes` ajenos → cero filas; firmar foto de oculto y avatar sin animales a la vista falla, de uno a la vista funciona; `pet_by_code` oculto → solo `visibility`; `pet_share_card` oculto e inexistente → sin fila
- [X] T013 `tests/db/listed-pets.test.ts` — lo público del publicador, código, versión, TTL y baja: columnas exactas de las tres funciones; ningún valor de teléfono, correo ni zona del perfil (publicador sembrado con otra zona de perfil); `cover_owner` / `owner_folder` una vez por fila; `publisher_level` 1, 2 y `null`; el código (formato con los mismos casos que `PET_CODE_PATTERN`, único, backfill, inmutable, no reusado: `private.new_pet_code()` reemplazado en la transacción de la prueba por una versión que devuelve primero un código ya usado y después otro); la versión cambia con nombre, localidad, departamento y portada, no con la descripción; `private.pending_ttl()` = `DB_RULES.p_pending_ttl`; borrar la cuenta → sin fila y fuera del total

### Lecturas y tipos

- [X] T014 `src/lib/pets/types.ts`: `ListedCardView`, `PublicPet`, `Publisher` (`level: 1 | 2 | null`), `ListingCursor`, `ListingPage` (data-model.md §Tipos de dominio)
- [X] T015 `src/lib/pets/listing-query.ts` + `listing-query.test.ts`: `ListingFilters`, `parseListingQuery`, `listingHref`, `isCanonicalListingQuery`, `parseCursor` / `formatCursor` y `parseAddedOptions`, con los casos de plan.md §Qué se testea (contracts/routes.md §Parámetros)
- [X] T016 `src/lib/supabase/queries/listed-pets.ts`: `listListedPets(filters, cursor, limit)` (pasa `AGE_BANDS` como `int4range[]`), `getPublicPet(code)` envuelta en `cache()` de React y `getShareCard(code)`, con el cliente de la sesión o anónimo (nunca el de servicio); firman portadas, fotos (`owner_folder`) y avatar con `createSignedUrls` por `SIGNED_URL_TTL_SECONDS` y devuelven `signedAt`; un código que no cumple `PET_CODE_PATTERN` es «no existe» sin ir a la base; una falla de la base lanza (research R1, R2)
- [X] T017 [P] `src/components/pets/pet-photo.tsx` y `src/styles/globals.css`: la foto sale visible desde el servidor; el fundido solo para las `lazy` que empiezan a cargar después de hidratar; `@media (scripting: none)` la deja visible; `color: transparent` esconde el `alt` si falla (plan.md §Diseño, `PetPhoto`). «Mis animales» y el formulario se ven igual
- [X] T018 [P] `src/app/[locale]/(public)/layout.tsx` envuelve en `ErrorTextsProvider`, y `src/app/[locale]/_components/error-texts-provider.tsx` suma `pets.listing.load_error`, `pets.page.load_error` y `pets.page.to_listing`
- [X] T019 [P] `src/app/[locale]/_components/account-menu.tsx`: «Animales en adopción» (`ghost`) primero, con y sin sesión, `flex-wrap` alineado a la derecha, `aria-current="page"` en el de la pantalla actual; clave `auth.account_menu.listing` en `messages/es.json` (plan.md §Cabecera)
- [X] T020 [P] `src/lib/seo/preview-bots.ts` + `preview-bots.test.ts`: la lista de lectores de vista previa (`facebookexternalhit`, `Facebot`, `WhatsApp`, `Twitterbot`, `TelegramBot`) e `isPreviewBot` (research R7, R16)

**Punto de control**: migración aplicada, tipos regenerados, T012–T013 verdes.

---

## Fase 3: User Story 1 — Abrir el enlace de un animal y ver su ficha sin ingresar (P1) 🎯 MVP

**Meta**: `/animales/{code}` muestra la ficha completa sin ingresar, con lo público del
publicador; «no está publicado» y «no disponible por ahora» cuando corresponde; la dueña ve
«Editar».

**Prueba independiente**: la de spec.md §US1.

### Tests de US1

- [X] T021 [P] [US1] `src/lib/pets/pet-page-state.ts` + test: `petPageState(result, { signedIn, isLevelOne })` → `missing` / `unavailable` (con o sin entrar) / `own_hidden` / `own_listed` / `listed`, con los seis casos de plan.md §Qué se testea (research R10)
- [X] T022 [P] [US1] `src/lib/pets/publisher-level.ts` + test: `publisherLevelLabel(level)` → sin sello con `null`, la clave de «Teléfono verificado» con 1 y la de «Identidad verificada» con 2
- [X] T023 [P] [US1] `src/lib/pets/published-ago.ts` + test: `publishedAgo(publishedOn, today)` con los días 0, 1, 2, 13, 14, 59, 60, 89, 90 y el cambio de día en hora de Uruguay (spec Edge Cases «Hace cuánto se publicó»)
- [X] T024 [P] [US1] `src/lib/analytics/listing-events.ts` + test: `petViewEvent` y `listingViewEvent` con los casos de plan.md §Qué se testea (el origen, oculto, la dueña, lector de vista previa, sin código ni cuenta en el evento); y en `src/lib/analytics/events.ts` los cuatro momentos nuevos con sus propiedades tipadas (`listing_viewed`, `listing_filter_used { filter, option }`, `pet_viewed { origin }`, `pet_share_tapped { from }`) (research R9)
- [X] T025 [P] [US1] `src/lib/pets/listing-state.ts` (solo `isStale`) + test: 49 min no, 50 sí, 51 sí

### Implementación de US1

- [X] T026 [P] [US1] `src/components/pets/pet-gallery.tsx` y `gallery-position.tsx` (hoja cliente): la tira 4:5 con `scroll-snap`, a sangre, portada con `fetchpriority="high"`, el resto `lazy`, `alt` «Foto {n} de {total} de {name}»; los puntos siguen la foto a la vista con `IntersectionObserver` y no se dibujan con una sola foto (plan.md §Ficha)
- [X] T027 [P] [US1] `src/components/pets/pet-headline.tsx` (el `h1` `.afiche` `--text-3xl`, «Perro macho, 2 años», `ZoneLabel`, `UrgencyTag`, «Publicado hace…») y `pet-facts.tsx` (el `dl` con cada dato en palabras, R13)
- [X] T028 [P] [US1] `src/components/verification/owner-card.tsx`: `Card taped`, `Avatar md`, nombre, «Rescatista o refugio», `Stamp primary` según `publisherLevelLabel` (sin sello con `null`), sin etiqueta encima; nunca zona ni contacto
- [X] T029 [US1] `src/components/pets/pet-sheet.tsx`: compone galería, titular, datos, descripción (sin hueco si está vacía), `OwnerCard` y el espacio de acciones; dos columnas desde 1024 con la galería sticky
- [X] T030 [P] [US1] `src/components/pets/pet-unavailable.tsx`: `HeadedEmptyState` `hidden` (con «¿Es tuyo? Entrá para ver por qué.» a `/entrar?next=/animales/{code}` solo sin sesión) y `missing`, las dos con «Ver los animales en adopción»
- [X] T031 [P] [US1] `src/app/[locale]/_components/stale-images-refresh.tsx`: `router.refresh()` si `isStale(signedAt)` al montar, en `visibilitychange` y en `pageshow`
- [X] T032 [US1] `src/app/[locale]/(public)/animales/[code]/page.tsx`: `getPublicPet`, `petPageState`, `petViewEvent` → `track`, `PetSheet` con «Editar» (`LinkButton ghost` a `editPetPath(editId)`) solo en `own_listed`; `unavailable` → `PetUnavailable hidden`; `missing` → `PetUnavailable missing` desde la página (plan §Ficha); `StaleImagesRefresh`; `generateMetadata` con título y descripción de `messages/es.json` y `robots` según `INDEXING_ENABLED` (los `og:*` los completa US2)
- [X] T033 [P] [US1] `src/app/[locale]/(public)/animales/[code]/error.tsx`; sin `not-found.tsx` ni `loading.tsx` (plan.md §Ficha, «Cargando»: el streaming esconde la ficha sin ejecutar nada y convierte el 404 en 200) (`ErrorScreen` con «No pudimos traer este animal.», reintentar y «Ver los animales en adopción»)
- [X] T034 [US1] `messages/es.json` → `pets.page`: etiquetas y valores de `PetFacts`, «Publicado hoy/ayer/hace…» en ICU, «Rescatista o refugio», los niveles, «Editar», no disponible y no publicado, errores, metadatos, `photo_alt`, `gallery_position`

**Punto de control**: con un animal sembrado, la ficha se ve sin sesión, un código inventado da
«no está publicado» y uno oculto «no disponible por ahora».

---

## Fase 4: User Story 2 — Compartir el enlace con una vista previa que muestra al animal (P2)

**Meta**: «Compartir» en la ficha y en «Mis animales»; la vista previa con la portada, el nombre y
la zona; nada del animal si no está a la vista.

**Prueba independiente**: la de spec.md §US2.

### Tests de US2

- [X] T035 [P] [US2] `src/lib/pets/share-mode.ts` + test: `shareMode({ coarse, canShare, canCopy })` y `afterShareError(error)` (research R8)
- [X] T036 [P] [US2] `src/lib/og/palette.ts` + test de paridad contra `src/styles/globals.css` (los valores de canvas, ink e ink-muted)
- [X] T037 [US2] los cuatro casos de `ShareButton` en `src/lib/pets/share-mode.test.ts` (`shareLink` y `shareGate`: la hoja solo los conecta con el navegador, y así no hace falta sumar Testing Library ni un DOM de prueba, que no están en docs/07): los cuatro casos de plan.md §Qué se testea (un solo `share` con dos toques, «Enlace copiado» y el enlace de `APP_URL`, el `Sheet` si copiar falla, cancelar sin nada)

### Implementación de US2

- [X] T038 [US2] `src/components/pets/share-button.tsx` (hoja cliente): `shareMode`, `navigator.share` con `pets.share.title`, portapapeles con `Toast` «Enlace copiado», `Sheet` con el enlace si falla; ocupado mientras las opciones o el aviso están abiertos; dibujado en el servidor con `invisible` y revelado al hidratar; llama `trackShare`
- [X] T039 [P] [US2] `src/actions/share.ts`: `trackShare(from)` → `ActionResult<void>`, valida contra `'pet' | 'my_pets'` y registra `pet_share_tapped` (contracts/routes.md)
- [X] T040 [P] [US2] `src/components/pets/my-pet-actions.tsx` («Ver ficha» `LinkButton ghost sm` a `petPath(code)` y `ShareButton ghost sm` con `from="my_pets"`); `src/lib/supabase/queries/pets.ts` suma `code` a `listMyPets`; `src/components/pets/my-pets-grid.tsx` y `src/app/[locale]/(app)/mis-animales/page.tsx` (con un solo `ToastProvider`) y `loading.tsx` (dos renglones más por card)
- [X] T041 [US2] `src/components/pets/pet-share-image.tsx` y `src/app/[locale]/(public)/animales/[code]/imagen/route.tsx` (runtime Node) con `BricolageGrotesque_Condensed-ExtraBold.ttf` y `OFL.txt` al lado: `getShareCard`, firma la portada `full`, `sharp` a JPEG, `ImageResponse` 1200 × 630 con la foto arriba (1200 × 440, tercio de arriba) y la banda de papel con nombre y zona; salida por `sharp` a JPEG 80 → 70 → 60 hasta `SHARE_IMAGE_MAX_BYTES`; 404 si no está a la vista; `Cache-Control: no-store` (research R6)
- [X] T042 [US2] `generateMetadata` de la ficha: a la vista, `og:title` y `<title>` con `pets.share.title`, `og:description` la zona, `og:image` `petShareImagePath(code, version)`, `og:url`, `twitter:card`; oculto, inexistente y el listado: el nombre del sitio y «Animales en adopción» sin imagen (contracts/routes.md §Metadatos); la ficha suma `ShareButton` a sus acciones
- [X] T043 [P] [US2] `src/app/robots.ts`: los buscadores siguen con `disallow: /`; los de `preview-bots.ts` con `allow: /animales/` (research R7)
- [X] T044 [US2] `messages/es.json` → `pets.share` («Compartir», `title`, `copied`, `manual_title`, `manual_body`) y `pets.page.see_pet`
- [X] T045 [US2] `tests/e2e/animales.spec.ts`, flujo 1 (plan.md §Qué se testea): sin sesión, la ficha con «Teléfono verificado» y sin «Editar», los `og:*`, y la imagen `image/jpeg` de menos de 300 KB

**Punto de control**: `curl` de la ficha muestra los `og:*`; la imagen responde JPEG; «Mis animales»
tiene «Ver ficha» y «Compartir».

---

## Fase 5: User Story 3 — Recorrer los animales en adopción con filtros (P3)

**Meta**: `/animales` con los filtros en la dirección, el total, «Ver más» por cursor, volver atrás
al mismo lugar y todo sin ejecutar nada.

**Prueba independiente**: la de spec.md §US3.

### Tests de US3

- [X] T046 [US3] `tests/db/listed-pets.test.ts` — orden, «Ver más», filtros y edad: los casos de plan.md §Qué se testea («Orden y "Ver más"», «Filtros», «La edad en la base = la de la ficha» contra `ageOn` en la tabla de casos)
- [X] T047 [P] [US3] `src/lib/pets/listing-page.ts` + test: `hasMore`, `nextCursor`, `loadMoreState(shown, hasMore, hydrated)` (botón, enlace, aviso de 240, nada)
- [X] T048 [P] [US3] `src/lib/pets/listing-state.ts` + test: `listingReducer` y `restoreDecision` con los casos de plan.md §Qué se testea (`isStale` ya está de US1)
- [X] T049 [P] [US3] `addedFilterOptions` en `src/lib/analytics/listing-events.ts` + sus casos en el test
- [X] T050 [US3] `src/hooks/use-listing-pages.ts` (fino) y la regla en `src/lib/pets/listing-requests.ts` + test (plan §Qué se testea): abortar el anterior, descartar lo abortado, `offline` cuando `fetch` rechaza, `no_response` con 503

### Implementación de US3

- [X] T051 [P] [US3] `src/lib/pets/listed-card-view.ts`: `listedCardViews(rows, t)` arma cada `ListedCardView` con `alt`, `ageText` (la misma ICU de la ficha), `zoneText` y `urgentText`, y la firma de portadas
- [X] T052 [US3] `src/app/api/animales/route.ts` (GET): `parseListingQuery`, `parseCursor`, `listListedPets`, `listedCardViews`; sin cursor, `total` y `totalText`; `parseAddedOptions` → `listing_filter_used` (salvo lectores de vista previa); 503 con `pets.listing.errors.no_response`; `Cache-Control: no-store` (contracts/routes.md)
- [X] T053 [P] [US3] `src/components/ui/chip.tsx`: modo casilla (`name`, `value`, `checked`: `input type="checkbox"` con `.peer` y la tirita en el `label`) y `ChipGroup` con `orientation` `horizontal` / `vertical`; el modo botón no cambia. `src/styles/globals.css`: `--container-rail: 256px` en la configuración del tema
- [X] T054 [P] [US3] `src/components/pets/pet-wall.tsx` (`columns: 'wall' | 'beside-rail'`, `li` con `id="a-{n}"`) y `pet-card.tsx` (recibe `href` y `ListedCardView`, edad opcional, sin imports de servidor); `my-pets-grid.tsx` compone `PetWall columns="wall"` y sigue abriendo la edición
- [X] T055 [P] [US3] `src/components/pets/listing-count.tsx` (`output` `aria-live="polite"`), `listing-filters.tsx` (el `form` GET, especie/edad/departamento a la vista, sexo/tamaño/castrado en el `<details>` abierto si alguno está marcado, «Ver resultados», «Sacar los filtros»; departamentos por nombre) y `load-more-button.tsx` (según `loadMoreState`)
- [X] T056 [US3] `src/app/[locale]/(public)/animales/_components/listing-controller.tsx` (hoja cliente, capa `app`) con `src/hooks/use-listing.ts`: `listingReducer` + `useListingPages`, dibuja el formulario y escucha su `change` (plan §Listado), `history.replaceState` con `listingHref(filters, shown)`, esconde «Ver resultados», la foto en `sessionStorage` con «vuelvo» y posición al tocar una card y su reposición con `restoreDecision` (casillas incluidas), renovar fotos con `isStale`; los vacíos (sin filtros con «Publicar un animal», con filtros con «Sacar los filtros») y los errores de plan.md (al abrir, de «Ver más» sin botón nuevo, de un filtro con «Reintentar»)
- [X] T057 [US3] `src/app/[locale]/(public)/animales/page.tsx`: redirección a la canónica si `!isCanonicalListingQuery`, `listListedPets` + `listedCardViews` + total ICU, `listingViewEvent` y (sin ejecutar) `addedFilterOptions` contra el `Referer` → `track`, el `h1` y `ListingController` con `ListingFilters` de hijo, el estado de error si la base falla; `generateMetadata` (título, descripción, canónica `/animales`, `robots` según `INDEXING_ENABLED`, sin `og:image`)
- [X] T058 [P] [US3] `src/app/[locale]/(public)/animales/error.tsx` (sin `loading.tsx`: plan.md §Listado, «Cargando») (`ErrorScreen` con «No pudimos traer los animales.»)
- [X] T059 [US3] `messages/es.json` → `pets.listing`: título, total en plural ICU, `legend` y opciones de cada filtro, `more_filters`, «Ver resultados», «Sacar los filtros», `load_more`, `load_more_again`, `retry`, `previous_filters`, `cap_240`, vacíos, `errors.offline`, `errors.no_response`, `load_error`, metadatos
- [X] T060 [US3] `tests/e2e/animales.spec.ts`, flujos 2 (filtrar, «Ver más», abrir, volver: marcas, cards y posición; otro volver sale del listado) y 3 (sin JavaScript: la ficha sin «Compartir» con la portada visible, `naturalWidth > 0` y opacidad 1; el listado con portadas visibles, «Ver resultados», «Ver más» con 48 desde el principio)

**Punto de control**: el listado filtra con y sin JavaScript, «Ver más» no repite, y volver atrás
deja todo como estaba.

---

## Fase 6: User Story 4 — El publicador que perdió el teléfono verificado sabe qué pasa (P4)

**Meta**: el aviso en su ficha y en «Mis animales», con el camino a confirmar; nada para los demás.

**Prueba independiente**: la de spec.md §US4.

- [X] T061 [P] [US4] `src/components/pets/hidden-from-public-notice.tsx`: variantes `pet` («Solo la ves vos») y `list` («Sin verificar»), `Stamp warning`, el texto de plan.md y «Confirmar mi teléfono» a `verifyPath({ reason: 'publish', next, from: MY_PETS_PATH })`
- [X] T062 [US4] Ficha en `own_hidden`: `HiddenFromPublicNotice variant="pet"` arriba de la galería, sin «Editar», con «Compartir» (`src/app/[locale]/(public)/animales/[code]/page.tsx`)
- [X] T063 [US4] «Mis animales» sin nivel 1: `HiddenFromPublicNotice variant="list"` arriba de la tirita, con el `phoneStatus` de la puerta (`src/app/[locale]/(app)/mis-animales/page.tsx`)
- [X] T064 [US4] `messages/es.json` → `pets.page.own_hidden_*`, `list_hidden_*`, `confirm_phone`, `sign_in_to_see`

**Punto de control**: con un publicador con cambio a medias, otra persona ve «no disponible por
ahora» y él ve su ficha con el aviso y sin «Editar».

---

## Fase 7: Pulido y transversal

- [X] T065 `tests/e2e/animales-rendimiento.spec.ts` (solo Chromium, `throttleLikeAPhone`): LCP < 2,5 s y CLS < 0,05 en la ficha, el listado y «Mis animales», con fotos de 12 MP publicadas por la corrida; JS inicial comprimido de `/animales` y de la ficha, anotado para Ship
- [X] T066 [P] `docs/10-design-system.md`: la decisión «el poste» (R12) y su línea en «Descartado»; la ficha en dos columnas desde 1024 y `--container-rail` en §Pantallas anchas; las filas que cambian (`Chip`, `ChipGroup`, `PetCard`, `PetPhoto`, `PetGallery` ex `PetPhotoGallery`, `PetFacts` en lugar de `PetAttributes`, `OwnerCard`, `AccountMenu`, `ErrorTextsProvider`) y las nuevas (`PetWall`, `ListingCount`, `ListingFilters`, `ListingController`, `LoadMoreButton`, `PetSheet`, `PetHeadline`, `ShareButton`, `PetUnavailable`, `HiddenFromPublicNotice`, `MyPetActions`, `GalleryPosition`, `StaleImagesRefresh`, la plantilla de la vista previa)
- [X] T067 [P] `docs/07-stack.md` (decisiones R1, R2 y R6), `docs/08-convenciones-codigo.md` §Encontrable (R7) y `docs/06-i18n.md` (ejemplo de §URLs e «Imagen OG del share (texto debajo de la foto)»)
- [X] T068 [P] `docs/known-limitations.md`: KL-57-1, KL-57-2 y KL-57-3 (plan.md §Docs que cambian), y de la construcción KL-57-4 (el JS inicial) y KL-57-5 (el 200 de «no está publicado»); KL-53-8 se borra (la cabecera ya marca la pantalla) y KL-53-9 pasa a esperar la seed con fotos
- [X] T069 Cargar `vercel:react-best-practices` y revisar los TSX nuevos y cambiados
- [X] T070 `node scripts/walk.mjs --story ver-animales /animales /animales/{code}` y la ficha oculta, a 390 y 1280, con y sin sesión (`--user`)
- [X] T071 `pnpm mutation` al 100 % sobre lo que tiene test (los equivalentes anotados en su línea) y `pnpm verify` verde
- [ ] T072 (opcional, la última; no entró: sin fotos de dominio público a mano, KL-53-9 queda abierta) `scripts/seed-pets.mjs` y `supabase/seed-photos/` con `SOURCES.md` (plan.md §Para Ship); si entra, cierra KL-53-9; si no, KL-53-9 queda abierta

---

## Dependencias y orden

- **Fase 1 → Fase 2 → US1 → US2 → US3 → US4 → Pulido.** La Fase 2 bloquea todo (migración,
  tipos, lecturas).
- US2 usa la ficha de US1 (metadatos, acciones). US3 usa `PetCard` y las lecturas de la Fase 2, y
  puede empezar en paralelo a US2 una vez hecha US1. US4 usa la ficha (US1) y «Mis animales» (US2).
- Dentro de cada story: los tests de lógica pura primero, después los componentes, después la
  página, después el e2e.

### Paralelo, por ejemplo en US1

```text
T021 pet-page-state · T022 publisher-level · T023 published-ago · T024 listing-events · T025 isStale
T026 pet-gallery · T027 pet-headline/pet-facts · T028 owner-card · T030 pet-unavailable · T031 stale-images-refresh
```

## Estrategia

MVP = Fase 1 + Fase 2 + US1: la ficha pública se ve desde un enlace. Después US2 (el enlace se
comparte con vista previa), US3 (el listado) y US4 (el publicador sin nivel 1), cada una verificada
en su punto de control antes de seguir.
