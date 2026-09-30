# Implementation Plan: Ver los animales publicados con filtros y compartir la ficha de cada uno

**Branch**: `feature/57-ver-animales-publicados-filtros` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/009-ver-animales-compartir/spec.md` (4 user stories, endurecida en tres rondas con
`spec-grader` y `spec-adversary`; lo que quedó abierto está en sus Assumptions). Revisado por
`plan-reviewer`; los hallazgos de cada ronda están plegados acá y en research.

## Reanudación (2026-09-30)

El primer intento (PR #89, en borrador) construyó todo este plan; la rama se retoma, no se rehace.
Mientras estaba en revisión entró #84 (historia #12, aval y perfil público), que toca los mismos
lugares. El segundo intento arranca por acá y sigue el resto del plan tal cual.

1. **Traer `main` primero.** Mergear `origin/main` a la rama (sin rebase ni force push) antes de
   tocar nada. Chocan, como mínimo: `RescuerTag` (las dos ramas lo crearon), `ProfileSummary`,
   `PetCard`, `ZoneLabel`, `LinkButton`, `globals.css`, `lib/analytics/events.ts`,
   `messages/es.json`, `supabase/seed.sql`, `docs/03`, `docs/10` y `docs/known-limitations.md`.
   `lib/supabase/types.ts` no se resuelve a mano: `pnpm exec supabase db reset` y `pnpm db:types`.
   La migración de la rama (`20260928140158`) va después de la de avales (`20260928064920`), así
   que el orden no cambia.
2. **Una sola lista de lectores de vista previa.** `main` trae `lib/analytics/link-preview.ts`
   (`isLinkPreview`, con más agentes). `lib/seo/preview-bots.ts` se borra; su lista se exporta desde
   `link-preview.ts` y la leen `robots.ts` y `listing-events.ts`. Un caso de su test que
   `link-preview.test.ts` no cubra se muda ahí.
3. **El nivel 3.** `pet_by_code` devuelve el nivel del publicador de 1 a 3 con la misma escalera
   que `public_profile` de #84: nivel 1 es `identity_level_one`; nivel 2 suma
   `private.has_level_two`; nivel 3 suma al menos un aval de alguien que hoy tiene nivel 2 (la misma
   condición con la que `public_profile` cuenta los avales). La regla no se copia en TypeScript:
   `publisher-level.ts` solo traduce 1, 2 y 3 a `level_one`, `level_two`, `level_three` («Identidad
   verificada y avalada», `pets.page.level_three`). Test nuevo en `tests/db/listed-pets.test.ts`:
   con un aval que cuenta dice 3, y cuando el que avala pierde el nivel 2 vuelve a 2.
4. **«Rescatista o refugio» es una sola clave.** La ficha usa `profile.public.rescuer`, la del
   perfil público de `main`; `pets.page.rescuer` se borra. Un solo `RescuerTag`, el de `main`: si
   al lado de «Compartir» la caja se lee como un botón (el motivo del D18 del primer intento), se
   arregla en el componente para los dos lugares y queda en su fila de docs/10, nunca con una
   segunda forma.
5. **Una sola regla de «compartir o copiar».** `main` trae `useCanShare` (la hoja del sistema solo
   con el dedo como forma principal) para `CopyProfileLink`; la rama trae `lib/pets/share-mode.ts`,
   con su test al 100 %. Queda una: la decisión (`shareMode`, `afterShareError`, `shareGate`) se muda a
   `lib/share/share-mode.ts`, con su test; `shareUrl` y lo que sabe de animales se quedan en
   `lib/pets/`. `useCanShare` lee esa decisión y la usan `ShareButton` y `CopyProfileLink`. Lo que cada uno hace con la
   decisión (el `Sheet` manual de la ficha, el campo seleccionado del perfil) sigue en su
   componente.
6. **Lo que la revisión dejó abierto en #89**, plegado acá:
   - *D2*: el texto alternativo de la card y «Urgente» se arman en un solo `cardTexts(pet, t)` junto
     a `cardView` (`lib/pets/listed-card-view.ts`); `listedCardViews` y `MyPetsGrid` lo llaman.
   - *H2*: las opciones de los filtros van con mayúscula inicial («Perro», «Cachorro»), como los
     departamentos (docs/10 §Principios 6); cambian los textos de `pets.listing.options`, no sus
     claves ni los enums.
   - *H3*: resuelto por el punto 4.
   - *H4*: con los animales ocultos (FR-020), «Compartir» en Mis animales y en la ficha propia pasa a
     la variante `ghost` y el camino para confirmar el teléfono es el único elemento destacado de
     esa pantalla.
   - *D1/H1*: las capturas se sacan al final, sobre el HEAD que se entrega (T070 se repite).
7. **Lo que no cambia**: el avatar del publicador en la ficha sigue saliendo de la policy de
   Storage de este plan (R2), no de `/perfil/{id}/foto`: esa ruta pediría el identificador público
   del perfil, que la ficha no expone mientras no enlace al perfil (fuera de esta historia).

## Summary

Es la historia que pone a la vista lo que #53 publica. Hoy una publicación la ve solo su dueña: no
hay listado, ficha pública, enlace ni vista previa. Al terminar, cualquiera abre
`/animales/k3x9p2qa7m` sin cuenta y ve la ficha completa con un publicador verificado detrás; el
rescatista la comparte con una vista previa que muestra al animal; y quien quiere adoptar recorre
`/animales` con filtros que viajan en la dirección.

Cinco decisiones ordenan el plan:

1. **Lo público sale de tres funciones de la base, no de policies anchas** (research R1).
   `listed_pets`, `pet_by_code` y `pet_share_card` llevan adentro la regla «a la vista» —el
   publicador tiene hoy nivel 1— y devuelven solo columnas públicas. Las policies de `pets`,
   `pet_photos` y `profiles` siguen siendo solo de la dueña. Las páginas leen con la sesión de quien
   mira o como anónimo; nunca con la clave de servicio.
2. **Las fotos siguen privadas y se firman por una hora** (R2). Dos policies de Storage nuevas
   dejan firmar solo las fotos de un animal a la vista y el avatar de un publicador con uno a la
   vista. Cuando el animal deja de estar a la vista, las URLs viejas vencen solas (FR-018).
3. **El enlace es un código de 10 caracteres al azar que no se reusa** (R3): `/animales/{code}` son
   20 caracteres, no se adivina, no cambia al editar.
4. **El listado se arma en el servidor con los filtros de la dirección; con el navegador que
   ejecuta, un solo controlador cliente pide tandas a una ruta GET** (R4). Las marcas, el total, la
   grilla y la dirección cambian juntas; una falla de red deja lo que se veía; volver atrás repone
   lo cargado. Sin ejecutar, un formulario GET y un enlace.
5. **La vista previa es una imagen propia** (R6): `next/og` no lee WebP, así que la portada pasa por
   `sharp` a JPEG y se arma con el nombre y la zona debajo, como un cartel.

## Technical Context

**Language/Version**: TypeScript 7 (`strict`), React 19.3, Next.js 16.3.5 (App Router)

**Primary Dependencies**: las de `main` más **`sharp` 0.35.5** (la última estable, verificada con
`npm view sharp version` el 2026-09-28; hoy llega transitiva por Next). Se instala con
`pnpm add sharp@latest`; su línea en `docs/07-stack.md` ya está en esta rama (R6).

**Storage**: Postgres y Storage de Supabase (local). Una migración: `pet_codes`, `pets.code` con su
backfill, las funciones de data-model.md y dos policies de Storage.

**Testing**: Vitest (unidad, componentes y base local), Playwright (tres flujos críticos y una
medición de rendimiento), Stryker al 100 % sobre lo que tenga test.

**Target Platform**: web, mobile-first a 390 px; revisada también a 1280.

**Project Type**: aplicación web Next.js, estructura fijada por F00.

**Performance Goals**: el presupuesto de docs/07 en el listado y la ficha, las dos páginas que
docs/07 §Presupuesto nombra: LCP < 2,5 s con red y CPU de teléfono, JS inicial < 150 KB, CLS < 0,05.
Las páginas son Server Components. Hojas cliente: `ListingController` (el estado del listado,
R4), `ShareButton`, `GalleryPosition` (los puntos) y `StaleImagesRefresh` (sin dibujo); `PetPhoto`
ya existe. La portada de la ficha con `fetchpriority="high"` y las primeras 4 cards `eager`; el
resto `lazy`.

**Constraints**: sin Cron, sin Vercel (todo local hasta el MVP). Nada se indexa (`robots.ts` y
`INDEXING_ENABLED`, R7). `.lighthouserc.json` es una compuerta protegida y mide solo `/`: el
rendimiento del listado y la ficha se mide con un e2e (§Qué se testea), como hizo #53.

**Scale/Scope**: 2 rutas de página, 2 Route Handlers (la imagen y las tandas), 1 pantalla que
cambia, 1 migración, 1 acción, ~16 componentes nuevos (ninguna primitiva nueva; `Chip` gana un modo
casilla y `ChipGroup` una orientación), 1 dependencia.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra tablas, rutas ni componentes; el cómo está acá y en research. |
| **II. Una feature, un PR** | Cuatro user stories en un PR, construidas y verificadas en orden (P1 ficha, P2 compartir, P3 listado, P4 publicador sin nivel 1). |
| **III. Compuertas verdes y revisión fresca** | `pnpm verify` completo; qué se testea y por qué, en §Qué se testea. |
| **IV. Reglas como código** | La visibilidad, lo público del publicador, el código y la edad para filtrar son funciones de la base con tests que intentan leer lo que no deben; qué pantalla ve cada uno, qué se mide, los filtros, el tiempo desde que se publicó y la forma de compartir son funciones puras con test; el TTL repetido en la base tiene un test de paridad (R1). |
| **V. Datos personales, mínimos y privados** | Cada regla de visibilidad vive en la base: en las tres funciones `security definer`, que son la única puerta pública a `pets`, `pet_photos` y lo público del publicador, y en las dos policies RLS nuevas de `storage.objects`; las tablas conservan su RLS de dueña, y cada regla tiene su test que intenta leer lo que no debe (§Qué se testea, «Base»). Del publicador se abren nombre, foto, marca y nivel, solo detrás de un animal a la vista y solo por una función que devuelve esas columnas; teléfono, correo, zona y alta no salen nunca (SC-003 con test). Fotos privadas firmadas por una hora. Ningún dato nuevo de nadie: `pet_codes` guarda solo códigos. La medición no lleva cuenta ni animal, y los lectores de vista previa no cuentan. |
| **VI. Sin deriva** | Nada de la tabla «Fuera del MVP»: sin mapa, sin favoritos, sin chat. Estados, expiración, perfil público, suspensiones y buscar por texto quedan afuera como dice la historia. |
| **VII. Liviana y linda, medido** | Server Components por defecto; el único límite cliente grande es el del estado del listado, justificado en R4; todo contra docs/10, sin tokens nuevos (un ancho con nombre, `--container-rail`, que no es token); LCP y JS medidos en el e2e de rendimiento. |
| **VIII. Autonomía con veto** | Se deciden y se avisan en Ship, en un issue `aviso`: las funciones públicas con el TTL repetido y su test de paridad (R1); el id de la cuenta visible en la ruta de las fotos firmadas y en el listado del bucket (R2, KL-57-1); `sharp` como dependencia directa (R6); los bots de vista previa en `robots.txt` (R7); «el poste» reabierto en el listado ancho, con `--container-rail` y `ChipGroup` vertical (R12); `PetFacts` en lugar de `PetAttributes` (R13); la View Transition pospuesta (R15, KL-57-2); «Rescatista o refugio» en la ficha mientras el perfil propio dice «Rescatista». Nada reservado: no hay plata, nombre ni indexación (sigue apagada). |

**Sin violaciones**: la tabla de Complexity Tracking queda vacía.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. Cargado `frontend-design:frontend-design`
antes de escribir esta sección.

**La idea que ordena las pantallas.** El listado es **la pared del poste**: los carteles de «se
busca hogar» pegados uno al lado del otro, que ya existen como `PetCard` en «Mis animales». Lo que
esta historia agrega es lo que tiene la pared de la calle: las tiritas para arrancar (los filtros),
y el cartel entero cuando uno se acerca (la ficha). La ficha es un cartel a sangre: la foto arriba,
grande, y el texto de lectura debajo, con la nota de quien lo pegó sostenida con cinta. La vista
previa es ese mismo cartel reducido a una tarjeta de WhatsApp: la foto arriba y, en el papel de
abajo, el nombre y la zona.

Los `h1` van en `.afiche`, en oración con mayúscula inicial. **Ningún token nuevo.**

### Tokens

Color: `--color-canvas` de fondo; `--color-ink` en texto, bordes, tiritas marcadas y acciones;
`--color-ink-muted` en el total, la zona, «Publicado hace…» y las etiquetas de `PetFacts`;
`--color-surface` en los avisos al publicador y en el hueco de una foto; `--color-primary` solo en el
sello del nivel del publicador (el verde es confianza, docs/10); `--color-accent` solo en
`UrgencyTag` y en los errores. Tipografía: `.afiche` en el `h1` del listado (`--text-2xl`, como
«Mis animales»), en el nombre de cada card (`--text-lg`) y en el nombre de la ficha (`--text-3xl`,
«el nombre del animal en la ficha» en docs/10); `--text-base` en la descripción y los datos;
`--text-sm` en el total, la zona y las etiquetas. Espacio: `--space-8` entre cards (el de la pared),
`--space-6` entre bloques de la ficha, `--space-3` entre grupos de filtros. Movimiento: el de `Chip`
al marcar (`--dur-base`), `.lift` en las cards, el fundido del ThumbHash a la foto (`--dur-base`),
el `Toast` de «Enlace copiado». Recursos: `.cinta-esquinas` y `--tilt` en las cards (ya en
`PetCard`), `.perforado` en cada tira de filtros (ya en `ChipGroup`), `Card taped` en la nota del
publicador, `.sello` en su nivel. Un gesto por elemento: la galería de la ficha no lleva cinta (va a
sangre). La transición de la card a la ficha (`--dur-page`) queda para después (R15).

### Cabecera

```
390 px, con sesión                           390 px, sin sesión
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│                 Animales en adopción │     │         Animales en adopción  Entrar │
│               Mis animales  Mi perfil│     └──────────────────────────────────────┘
└──────────────────────────────────────┘
```

`AccountMenu` suma «Animales en adopción» (`ghost`) primero, con sesión y sin ella (FR-021). Los
enlaces van en una fila alineada a la derecha que se parte en renglones cuando no entra
(`flex-wrap`, `gap` de `--space-2` entre renglones): a 390 con sesión son dos renglones, y el
contenido es el mismo en todos los anchos. El de la pantalla actual lleva `aria-current="page"` y
el subrayado grueso del `ghost` en hover, quieto. Su fila de docs/10 se actualiza.

### Animales en adopción · `/animales`

```
390 px (cabecera sin sesión)                   1280 px (desde 1024: «el poste», R12)
┌──────────────────────────────────────┐       ┌──────────────────────────────────────────────────────┐
│         Animales en adopción  Entrar │  72   │  Animales en adopción   Mis animales   Mi perfil     │
│ Animales en adopción            (h1) │ 120   ├──────────────────────────────────────────────────────┤
│ 37 animales                          │ 150   │ Animales en adopción (h1)                            │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │       │ 37 animales                                          │
│ [ perro ][▚gato▞]                    │ 222   │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │       │ │┆ perro   │ │▚ foto  ▞│ │▚ foto  ▞│ │▚ foto  ▞│  │
│ [▚cachorro▞][joven][adulto][mayor]   │ 294   │ │┆▚gato▞   │ │   4:5    │ │   4:5    │ │   4:5    │  │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄   │       │ │┄┄┄┄┄┄┄┄┄│ └──────────┘ └──────────┘ └──────────┘  │
│ [Artigas][▚Canelones▞][Cerro L…      │ 366   │ │┆▚cachor▞ │ Tobi         Luna         Nina        │
│ ▸ Más filtros: sexo, tamaño,         │       │ │┆ joven   │ 2 años       6 meses      1 año       │
│   castrado (1)                       │ 410   │ │ …        │ Pocitos,     Pando,       Salto       │
│ Sacar los filtros            (ghost) │ 450   │ │ ▸ Más    │ Montevideo   Canelones    ▲ Urgente   │
│ ┌──────────────┐ ┌──────────────┐    │       │ │  filtros │ …                                     │
│ │▚ foto 4:5  ▞│ │▚ foto 4:5  ▞│    │       │ │ Sacar los│             [ Ver más ]               │
│ │              │ │              │    │       │ │ filtros  │                                       │
│ └──────────────┘ └──────────────┘    │ 690   │ └──────────┘  (la columna no es sticky)          │
│ Tobi             Luna                │       └──────────────────────────────────────────────────────┘
│ 2 años           6 meses             │
│ Pocitos,         Pando, Canelones    │
│ Montevideo       ▲ Urgente           │
├─────────────── pliegue a 844 ────────┤
│ …                                    │
│          [ Ver más ] (secondary)     │
└──────────────────────────────────────┘
```

- **El pliegue a 390** (números de la izquierda, en px desde arriba): tres tiras a la vista
  —especie, edad y departamento, las de la historia («gato, cachorro, Canelones»)— y las otras tres
  en un `<details>` nativo «Más filtros: sexo, tamaño, castrado», abierto si alguna está marcada y
  con cuántas en el resumen. La primera fila de portadas entra entera arriba del pliegue: la foto
  manda (docs/10, Principio 1). El `<details>` existe igual en todos los anchos, también en la
  columna de 1280 (mismo contenido en todos los anchos, docs/10 §Pantallas anchas), y anda sin
  ejecutar nada.
- **La página** (`page.tsx`, servidor): normaliza la consulta con `parseListingQuery`; si la
  dirección no es la canónica (`listingHref` de lo normalizado: agregados como `fbclid`, claves
  repetidas del formulario sin ejecutar, valores en otro orden) redirige a la canónica, que es lo
  que hace que dos personas compartan la misma dirección y anda sin ejecutar. Después pide la
  primera vista con `listListedPets`, arma las cards con `listedCardViews` (textos ya traducidos) y
  el total con el plural ICU, registra lo que digan `listingViewEvent` y (sin ejecutar)
  `addedFilterOptions` (R9), y dibuja el `h1` y `ListingController` dentro de
  `PageShell width="full"`. Si `listListedPets` falla, le pasa al controlador el estado de error en
  lugar de la lista (R4): los filtros quedan a la vista.
- **`ListingController`** (nuevo, **capa `app`**, `app/[locale]/(public)/animales/_components/`,
  la hoja cliente del estado, R4): recibe la primera vista, `signedAt` (la hora de la firma) y los
  textos, y dibuja `ListingCount`, `ListingFilters`, `PetWall`, `LoadMoreButton`, los vacíos y los
  errores. **Cambio en la construcción:** `ListingFilters` lo dibuja el controlador y no llega como
  `children` ya dibujado: las marcas, la cuenta de «Más filtros» y «Sacar los filtros» cambian con
  cada toque, y un formulario del servidor habría pedido tocar el DOM a mano para seguirlas. Sigue
  siendo un `<form method="get">` que el servidor dibuja igual, así que sin ejecutar nada anda como
  antes. Es fino: el estado es `listingReducer` y las reglas `restoreDecision` e `isStale` (puras,
  en `lib/pets/listing-state.ts`); el hook `useListing` (`hooks/use-listing.ts`) las conecta con
  los pedidos, la dirección y la pestaña, y los pedidos los hace `useListingPages`, que guarda
  `listingRequester` (`lib/pets/listing-requests.ts`: `fetch` a `/api/animales` con
  `AbortController`, descarta lo que llega de un pedido viejo). Los componentes de `pets` no piden
  nada.
- **`ListingCount`** (nuevo, `pets`): el `totalText` en `--text-sm` `--color-ink-muted`, en un
  `output` con `aria-live="polite"` para que el total nuevo se oiga.
- **`ListingFilters`** (nuevo, `pets`, sin imports de servidor): `<form method="get" action="/animales">`
  con un `ChipGroup` por filtro —especie, edad y departamento a la vista; sexo, tamaño y castrado
  en el `<details>`—, «Ver resultados» (`Button secondary`, escondido con
  `@media (scripting: enabled)` desde el primer dibujo, así no mueve la pared al hidratar) y
  «Sacar los filtros» (`LinkButton ghost` a `/animales`) cuando hay alguno. Las casillas son de
  `Chip` en modo casilla.
- **`Chip` en modo casilla** (cambia la primitiva): con `name`, `value` y `checked` dibuja un
  `<input type="checkbox">` con `.peer` y la tirita en su `label`, con el mismo aspecto arrancado al
  marcar; el lector de pantalla anuncia «casilla, marcada». El modo botón de siempre no cambia.
- **`ChipGroup` con `orientation`** (cambia la primitiva, R12): `horizontal` (una fila que se
  desplaza, la de siempre) y `vertical` (una columna de tiritas a lo ancho de `--container-rail`;
  la arrancada se corre 8 px a la derecha y se inclina). Una sola tira en las dos: nunca se parte. La
  `legend` sigue `sr-only`.
- **Departamentos**: los 19 en una sola tira, por orden alfabético de su nombre; en horizontal, la
  tirita cortada en el borde es la señal de que hay más; en la columna de 1280 son una tira vertical
  larga, y por eso **la columna no es `sticky`**: se desplaza con la página, y nada queda fuera de
  alcance en una ventana baja.
- **`PetWall`** (nuevo, extraído de `MyPetsGrid`): la `ul` de cards con `columns: 'wall' |
  'beside-rail'` (R12), sin traducir ni pedir nada; cada `li` con `id="a-{n}"` para el ancla de
  «Ver más» sin ejecutar. `MyPetsGrid` pasa a componerlo con `columns="wall"`.
- **`PetCard`** (cambia): recibe `href` y la vista ya armada (`ListedCardView`: nombre, `ageText`
  opcional, `zoneText`, `urgentText`, `alt`, foto); sin imports de servidor, se dibuja igual desde
  el servidor y desde el controlador. En el listado lleva la edad de hoy en `--text-sm` entre el
  nombre y la zona, y abre la ficha; en «Mis animales», sin edad, sigue abriendo la edición. El
  nombre entero, en los renglones que haga falta. `alt`: «Foto de Tobi, perro en Pocitos,
  Montevideo» (docs/10 §Fotos).
- **`PetPhoto`** (cambia): hoy dibuja la foto en `opacity-0` hasta que un efecto la ve cargada; sin
  ejecutar nada no se vería ninguna foto (FR-019), y con ejecutar, la portada no cuenta para el LCP
  hasta hidratar. Pasa a salir **visible desde el servidor**: el fundido del ThumbHash a la foto se
  aplica solo a las `lazy` que empiezan a cargar después de hidratar; `@media (scripting: none)` la
  deja visible siempre; `color: transparent` esconde el `alt` si la foto falla, para que quede el
  borroso (spec, Pantallas).
- **`LoadMoreButton`** (nuevo, `pets`): qué dibuja lo decide `loadMoreState(shown, hasMore,
  hydrated)` (pura, en `lib/pets/listing-page.ts`): hidratado, un `Button secondary` con `loading`;
  antes de hidratar, un `LinkButton secondary` a `listingHref(filters, shown + 24)#a-{shown + 1}`;
  sin ejecutar y con 240 a la vista, en su lugar «Mostramos los primeros 240. Usá los filtros para
  ver otros.».
- **Lo único que se lleva la atención**: las portadas. Sin tirita de acción en esta pantalla (docs/10:
  una sola por pantalla, y ninguna acción es «la» del listado); «Ver más» es `secondary`.
- **Cargando**: al abrirlo, la página llega entera con el ThumbHash de cada portada (sin
  `loading.tsx`, por lo mismo que la ficha: el streaming dejaría el listado escondido sin ejecutar
  nada y rompería FR-019). Al cambiar un filtro: `aria-busy` en la grilla, que baja a `opacity` 60 %
  con `--dur-base` sin moverse. «Ver más» ocupado con su `loading`.
- **Vacío sin filtros**: `EmptyState` con «Todavía no hay animales publicados.» y la acción
  «Publicar un animal» (`LinkButton secondary` a `/mis-animales/publicar`, que pide entrar a quien
  no tiene sesión): el vacío invita a actuar, y la única acción que llena la pared es publicar.
- **Vacío con filtros**: `EmptyState` con «No hay animales con estos filtros.» y «Sacar los filtros»
  (`LinkButton secondary` a `/animales`).
- **Error al abrir**: dentro del controlador, los filtros a la vista y, en el lugar de la grilla,
  `SaveFailedStrip` con «No pudimos traer los animales.» y «Reintentar». `error.tsx` (con
  `ErrorScreen`) queda para lo inesperado.
- **Error de «Ver más»**: `SaveFailedStrip` arriba de «Ver más» con el motivo —«No hay conexión.» o
  «El sitio no respondió.»— y «Tocá "Ver más" de nuevo.»: no suma otro botón (docs/10, Principio 6).
- **Error de un filtro**: `SaveFailedStrip` arriba de la grilla con el motivo, «Estos son los
  animales de los filtros anteriores.» y «Reintentar», que pide lo marcado (no hay otro botón que
  repetir).
- **Pestaña vieja** (R11): el controlador mira `isStale(signedAt)` al montar, en
  `visibilitychange` y en `pageshow`; si pasó, vuelve a pedir a la ruta las mismas cards con URLs
  nuevas, sin disparar nada.

### Ficha · `/animales/{code}`

```
390 px                                          1280 px
┌──────────────────────────────────────┐        ┌───────────────────────────────────────────────────┐
│  Animales en adopción   Mis animales │        │  Animales en adopción   Mis animales   Mi perfil  │
│┌────────────────────────────────────┐│        ├───────────────────────────────────────────────────┤
││                                    ││        │┌─────────────────────────┐ Tobi              (h1) │
││        foto 4:5 a sangre           ││        ││                         │ Perro macho, 2 años     │
││        (snap horizontal)           ││        ││   foto 4:5 a sangre     │ Pocitos, Montevideo     │
││              ● ○ ○                 ││        ││   (sticky)              │ ▲ Urgente               │
│└────────────────────────────────────┘│        ││          ● ○ ○          │ Publicado hace 3 días   │
│ Tobi                            (h1) │        │└─────────────────────────┘ Tamaño      grande      │
│ Perro macho, 2 años                  │        │                            Castrado    sí          │
│ Pocitos, Montevideo                  │        │                            …                       │
│ ▲ Urgente                            │        │                            Tobi llegó en marzo…    │
│ Publicado hace 3 días                │        │                            ┌─────────────────────┐ │
│ Tamaño             grande            │        │                            │▚ (A) Ana    ⟨Teléf. │ │
│ Castrado           sí                │        │                            │  Rescatista  verif.⟩│ │
│ Vacunas            al día            │        │                            │  o refugio          │ │
│ Chip               no                │        │                            └─────────────────────┘ │
│ Convive con niños  no se sabe        │        │                            [ Compartir ]           │
│ Convive con perros sí                │        └───────────────────────────────────────────────────┘
│ Convive con gatos  no                │
│ Tobi llegó en marzo…                 │
│ ┌──────────────────────────────────┐ │
│ │▚ Lo publicó                    ▞ │ │
│ │ (A)  Ana Rodríguez               │ │
│ │      Rescatista o refugio        │ │
│ │      ⟨Teléfono verificado⟩ sello │ │
│ └──────────────────────────────────┘ │
│ [ Compartir ]  (secondary)           │
│ Editar  (ghost, solo el publicador)  │
└──────────────────────────────────────┘
```

- **La página** (`page.tsx`, servidor): valida el código, pide `getPublicPet(code)` (envuelta en
  `cache()` de React: `generateMetadata` y la página la comparten), decide con
  `petPageState(result, session)` (R10) qué dibuja, registra lo que diga `petViewEvent` (R9) y
  compone `PetSheet` con sus acciones. `missing` y `unavailable` → `PetUnavailable`, dibujado por la
  página y no con `notFound()` (cambio en la construcción, 2026-09-28: en Next 16.3 un 404 fuera de
  un límite de `Suspense` llega con el cuerpo vacío y lo dibuja el cliente, así que sin ejecutar nada
  no se veía nada, FR-019; y la vista previa de un 404 traía la descripción del sitio y no «Animales
  en adopción», FR-012). Responde 200 con `noindex`, como «no disponible por ahora».
- **`PetSheet`** (nuevo, `pets`): la ficha entera, que es un nombre del dominio: `PetGallery`,
  `PetHeadline`, `PetFacts`, la descripción (un `p` con `whitespace-pre-line`, que no se dibuja si
  está vacía), `OwnerCard` y un espacio para las acciones (`actions`, un nodo). Recibe el
  `PublicPet` y sus textos por props. Desde 1024, dos columnas dentro de la hoja: la galería a la
  izquierda (sticky) y la lectura a la derecha. docs/10 §Layout dice «galería a sangre arriba,
  después una columna de lectura»: se registra en docs/10 §Pantallas anchas como decisión de esta
  historia —en una hoja de 1200, una galería 4:5 a lo ancho mediría 1500 px de alto y empujaría todo
  el texto debajo del pliegue— y se avisa. Debajo de 1024, como dice §Layout.
- **`PetGallery`** (nuevo, la fila `PetPhotoGallery` de docs/10 con su nombre corto): las fotos 4:5
  en una tira con `scroll-snap`, a sangre hasta el borde de la hoja (docs/10 §Pantallas anchas), la
  portada primero con `fetchpriority="high"`, las demás `lazy`, cada una `PetPhoto` con su ThumbHash
  de fondo (si no carga, queda el borroso) y su `alt` «Foto 2 de 3 de Tobi»; sin ejecutar se
  desplaza igual y las fotos se ven. `GalleryPosition` (hoja
  cliente) dibuja los puntos y sigue la foto a la vista con `IntersectionObserver`; con una sola
  foto no se dibuja.
- **`PetHeadline`** (nuevo): el `h1` en `.afiche` `--text-3xl`, «Perro macho, 2 años», `ZoneLabel`,
  `UrgencyTag` si es urgente, y «Publicado hace 3 días» de `publishedAgo`.
- **`PetFacts`** (nuevo, R13): un `dl` en dos columnas de texto, etiqueta en `--color-ink-muted` y
  valor en `--color-ink`, cada dato en palabras.
- **`OwnerCard`** (nuevo, la fila de docs/10 con el contenido de esta historia): `Card taped` con
  `Avatar md` (la foto o las iniciales), el nombre en `--font-weight-bold`, «Rescatista o refugio»
  como la etiqueta informativa de `ProfileSummary`, y el nivel en un `Stamp primary` «Teléfono
  verificado» o «Identidad verificada» según `publisherLevelLabel`; sin nivel (la dueña mirando su
  ficha oculta), sin sello. Sin una etiqueta «Lo publicó» encima (docs/10 §Antipatrones): la nota
  con la persona y su sello ya dice qué es. Nunca zona ni contacto.
- **Acciones**: `ShareButton` («Compartir», `secondary`); «Editar» (`LinkButton ghost`) solo en
  `own_listed`; en `own_hidden`, `HiddenFromPublicNotice variant="pet"` arriba de la galería.
- **Lo único que se lleva la atención**: la portada. Sin tirita: la acción principal de la ficha es
  «Quiero adoptar», que llega en M3 (`ApplyButton`); «Compartir» no ocupa su lugar.
- **`HiddenFromPublicNotice`** (nuevo, `pets`, variantes `pet` y `list`): sobre `--color-surface`,
  sin borde, el sello `Stamp warning` «Solo la ves vos» (`pet`) o «Sin verificar» (`list`), el texto
  y `LinkButton secondary` «Confirmar mi teléfono» al camino de #10,
  `verifyPath({ reason: 'publish', next, from: MY_PETS_PATH })`. En `pet`: «Nadie más ve esta ficha
  hasta que confirmes tu teléfono. Quien abra el enlace va a ver que no está disponible por
  ahora.».
- **Cargando**: cada foto ocupa su lugar con su ThumbHash hasta que llega (`PetPhoto`), y la
  portada va con prioridad. **Sin `loading.tsx`** (cambio en la construcción, 2026-09-28): un
  `loading.tsx` es un límite de `Suspense` y la página llega en streaming; sin ejecutar nada, el
  contenido queda en un `div hidden` que solo el script de React muestra (FR-019 roto), y un
  `notFound()` después de empezar el streaming no se dibuja sin ejecutar nada. Sin el límite, la
  ficha llega entera en el HTML (docs de Next, `streaming.md`).
- **Vacío**: no aplica (una ficha siempre tiene foto y datos).
- **Error** (`error.tsx`): `ErrorScreen` con «No pudimos traer este animal.», reintentar, y «Ver los
  animales en adopción» `LinkButton ghost`. Nunca la pantalla de «no está publicado».
- **`StaleImagesRefresh`** (hoja sin dibujo, capa `app`, R11): recibe `signedAt` y llama
  `router.refresh()` si `isStale` al montar (una ficha que vuelve de la caché del router con URLs
  vencidas), en `visibilitychange` y en `pageshow`.

### No disponible por ahora y no publicado

```
390 px
┌──────────────────────────────────────┐
│  Animales en adopción        Entrar  │
│                                      │
│         (ilustración, 112 px)        │
│  Este animal no está disponible      │   h1 en .afiche, centrado (HeadedEmptyState)
│  por ahora                           │
│  Quien lo publicó tiene que          │
│  confirmar su teléfono.              │   (solo el texto; nada del animal)
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄    │
│  [ Ver los animales en adopción ]    │   LinkButton secondary
│  ¿Es tuyo? Entrá para ver por qué.   │   ghost, solo sin sesión
└──────────────────────────────────────┘
```

- **`PetUnavailable`** (nuevo, `pets`): `HeadedEmptyState` con dos variantes, `hidden` («Este animal
  no está disponible por ahora», con «¿Es tuyo? Entrá para ver por qué.» a
  `/entrar?next=/animales/{code}` sin sesión) y `missing` («Este animal no está publicado»), las
  dos con «Ver los animales en adopción». Las dos las dibuja la página (ver arriba), con 200.
  **No extiende `PetNotFound`**: ese es el «no existe» de la zona con sesión, le habla a la dueña y
  su salida es «Mis animales»; este le habla a cualquiera y su salida es el listado.
- Vacío, cargando y error: los de la ficha.

### Mis animales (cambia)

```
390 px
┌──────────────────────────────────────┐
│ Mis animales                    (h1) │
│ ┌──────────────────────────────────┐ │   solo sin nivel 1:
│ │⟨Sin verificar⟩ Tus animales no se│ │   HiddenFromPublicNotice variant="list"
│ │ ven mientras no confirmes tu     │ │
│ │ teléfono. Quien abra sus enlaces │ │
│ │ va a ver que no están disponibles│ │
│ │ por ahora. [Confirmar mi teléf.] │ │
│ └──────────────────────────────────┘ │
│ [ Publicar un animal ]  tirita       │
│ ┌──────────────┐ ┌──────────────┐    │
│ │▚ foto 4:5  ▞│ │▚ foto 4:5  ▞│    │
│ └──────────────┘ └──────────────┘    │
│ Luna             Tobi                │
│ Pocitos          Malvín              │
│ Ver ficha        Ver ficha    (ghost)│
│ Compartir        Compartir    (ghost)│
└──────────────────────────────────────┘
```

- La card sigue abriendo la edición (FR-014). Debajo, `MyPetActions` (nuevo, `pets`): «Ver ficha»
  (`LinkButton ghost sm` a `/animales/{code}`) y `ShareButton` en `ghost sm` con `from="my_pets"`.
- `HiddenFromPublicNotice variant="list"` arriba de la tirita cuando la cuenta no tiene nivel 1.
- Vacío, cargando y error: los de #53. El `loading.tsx` suma dos renglones debajo de cada card.

### Compartir

- **`ShareButton`** (nuevo, `pets`, hoja cliente, R8): decide con `shareMode` y, en un teléfono,
  abre las opciones del sistema; en una computadora, `Toast success` «Enlace copiado»; si no pudo
  copiar, `Sheet` «Copiá el enlace» con un `Input` de solo lectura seleccionado y «No pudimos
  copiarlo solo.». Ocupado mientras las opciones están abiertas o el aviso a la vista, sin
  `loading` (no está cargando nada). Se dibuja en el servidor con `invisible` (ocupa su lugar y no
  se puede tocar ni leer) y se revela al hidratar: sin ejecutar no aparece, y al hidratar no mueve
  nada (CLS, medido en «Mis animales»). Un solo `ToastProvider` por pantalla, en la página, con las
  claves de cerrar y de la región de `common.toast`.

### Vista previa (la imagen, 1200 × 630)

```
┌────────────────────────────────────────────────────────────┐
│ Tobi          ╲┌──────────────┐╱   Malvín,                 │
│ (afiche,       │   portada    │    Montevideo (40 px)      │
│  40–128 px)    │  entera 4:5  │                            │
│                │  440 × 550   │                            │
│                │ cinta, -0,8° │    {APP_NAME} (28 px)      │
│                └──────────────┘                            │
└────────────────────────────────────────────────────────────┘
  48 │ 213 │        cuadrado del centro: x 285–915       │ 213 │ 48
```

**Decisión (2026-09-28, revisión de diseño H1):** la portada va entera y no en una franja de
1200 × 440, que cortaba al animal a la altura de los ojos. Pegada con los dos trozos de cinta de
`.cinta-esquinas` y `--tilt`, en el centro; el nombre a la izquierda y la zona a la derecha, en
columnas de 213 px que terminan antes del cuadrado del centro, que es lo que recorta una miniatura
chica de WhatsApp: la miniatura es el animal entero, sin letras cortadas. El nombre toma el cuerpo
más grande en el que su palabra más larga entra en la columna (`shareNameSize`, entre 40 y 128 px,
con su test).

- La foto y el texto al lado, como pide FR-011; nada sobre la foto (docs/10 §Fotos). La foto es el
  tamaño `full`, bajada entera a 440 × 550 (si no llegó en 4:5, se recorta conservando la parte de
  arriba, donde suele estar la cara); la revisión de diseño mira una captura de la imagen y otra de
  su cuadrado del centro. La salida de
  `ImageResponse` es PNG: pasa por `sharp` a JPEG con calidad 80 y, si pesa más de 300 KB (lo que
  WhatsApp suele descartar), baja a 70 y a 60. El dibujo vive en
  `components/pets/pet-share-image.tsx` (así lo cubren las reglas de lint de componentes) y la ruta
  solo lo arma. Tinta (`--color-ink`) en el nombre, `--color-ink-muted` en la zona y el nombre del sitio.
  Los colores salen de `lib/og/palette.ts`, que copia los valores de `globals.css` con un test de
  paridad al lado (la imagen no lee variables CSS y un hexadecimal suelto en un componente está
  prohibido). Tipografía: la instancia estática Condensed ExtraBold de Bricolage Grotesque, la voz
  de `.afiche` (R6). Un nombre de 30 caracteres baja a 64 px. Las medidas quedan en una fila nueva
  de docs/10 («Plantilla de la vista previa»), porque no son de la escala de la pantalla.

### Textos

Todo en `messages/es.json`, por dominio (docs/06): `pets.listing` (título, total en plural ICU,
filtros y sus opciones, «Ver resultados», «Sacar los filtros», «Ver más», el tope de 240, vacíos,
errores, metadatos), `pets.page` (etiquetas y valores de `PetFacts`, «Publicado hoy/ayer/hace…» en
ICU, «Lo publicó», los tres niveles (`level_one`, `level_two`, `level_three`) —«Rescatista o refugio» es `profile.public.rescuer`, de #84—, «Editar», los avisos al publicador, no
disponible, no publicado, errores, metadatos), `pets.share` («Compartir», «Enlace copiado», el
`Sheet`, y `title`: «{name} en adopción», **una sola clave** que usan «Compartir», el `<title>`, el
`og:title` y la imagen) y `auth.account_menu.listing`. Además, enumeradas: `pets.listing` —las
  `legend` de cada filtro, cada opción, `more_filters` con su cuenta, `age` de la card (ICU de meses
  y años, la misma de la ficha), `load_more`, `load_more_again` («Tocá "Ver más" de nuevo»), `retry`,
  `previous_filters`, `errors.offline`, `errors.no_response`, `cap_240`—; `pets.page` —`photo_alt`
  («Foto {n} de {total} de {name}»), `gallery_position` («Foto {n} de {total}»), `see_pet` («Ver
  ficha»), `own_hidden_*`, `list_hidden_*`, `confirm_phone`, `sign_in_to_see`—; `pets.share` —`copied`,
  `manual_title`, `manual_body`—. Los enums se traducen al mostrar (docs/06).
El layout de `(public)` se envuelve en `ErrorTextsProvider`, que suma las claves de los límites de
error nuevos: `pets.listing.load_error`, `pets.page.load_error`, `pets.page.to_listing` y el
`retry` de `common.error_screen` que ya lleva; su fila de docs/10 («en los layouts de `(app)` y
`(auth)`») suma `(public)`. `docs/06` §URLs cambia su ejemplo a
`/animales/k3x9p2qa7m`.

## Qué se testea (y qué no)

Con la vara de docs/09: lo que, si se rompe, engaña a una persona, expone un dato o calcula mal.

**Base (Vitest contra Supabase local, `tests/db/listed-pets.test.ts`)** — privacidad y reglas:

- **Visibilidad** (FR-002, FR-003, SC-002): con un animal por caso, `listed_pets`, `pet_by_code` y
  `pet_share_card` lo devuelven con el publicador en nivel 1, y no (ni sus datos, ni en el total, ni
  la tarjeta de la vista previa) con: sin teléfono, número a medias, cambio a medias vigente, número
  perdido, identidad verificada sin teléfono; y vuelve al confirmar. Un cambio a medias vencido
  (más viejo que el TTL) cuenta como nivel 1, igual que `phoneStatus`. Cada caso como anónimo y como
  otra cuenta.
- **Nada por la puerta de atrás** (FR-003, FR-004): como anónimo y como otra cuenta, leer
  directamente `pets`, `pet_photos`, `profiles`, `identity_verifications` y `pet_codes` de otra
  persona devuelve cero filas; firmar la foto de un animal oculto o el avatar de alguien sin
  animales a la vista falla; firmar la de uno a la vista funciona. `pet_by_code` de uno oculto
  devuelve `visibility = 'hidden'` y todo lo demás `null` para anónimo y para otra cuenta, y todo
  para la dueña (FR-020). `pet_share_card` de uno oculto y de un código inexistente: ninguna fila,
  como anónimo y como otra cuenta.
- **Lo público del publicador** (SC-003): el conjunto de columnas de cada una de las tres funciones
  es exactamente el de data-model.md; ninguna trae teléfono, correo, zona del perfil ni
  `created_at`, y el id de la cuenta sale solo como `cover_owner` (listado y tarjeta) u
  `owner_folder` (ficha), una vez por fila (KL-57-1). Con un publicador sembrado que tiene todo
  cargado y otra zona en el perfil, ningún valor de su teléfono, correo o zona aparece en ninguna
  fila. `publisher_level` es 1 en nivel 1, 2 con `identity_verifications`, 3 con además un aval de
  alguien que hoy tiene nivel 2 (y vuelve a 2 cuando quien avala pierde el nivel 2; §Reanudación),
  y `null` cuando la dueña mira su ficha oculta (sin nivel 1 no se dice ningún nivel).
- **El código** (FR-010): formato (el `check` de la base y `PET_CODE_PATTERN` de `lib/pets/rules.ts`
  aceptan y rechazan los mismos casos), único, asignado a las publicaciones de #53 por el backfill,
  no se puede cambiar (el trigger lo rechaza), y el de un animal borrado sigue en `pet_codes` y no
  se vuelve a asignar: el test inserta a mano en `pet_codes` el código que va a salir, reemplazando
  `private.new_pet_code()` dentro de su transacción por una versión que devuelve primero ese código
  y después otro, y comprueba que el animal nuevo recibe el segundo.
- **La versión de la vista previa** (FR-011): cambia al cambiar el nombre, la localidad, el
  departamento o la portada (reordenando las fotos), y no cambia al editar la descripción.
- **Orden y «Ver más»** (FR-015, FR-016, SC-005): 50 animales en una ventana futura propia (R14);
  primera tanda de 24 con el total 50; se publica uno más nuevo; la segunda tanda con el cursor trae
  las 24 siguientes sin repetir; se oculta uno de la tercera; la tercera trae el resto sin él;
  ninguno repetido ni perdido; empate de `published_at` desempatado por código.
- **Filtros** (FR-017, SC-006): una opción, varias en el mismo filtro (o), varios filtros (y),
  castrado solo, todos los tramos de edad y sus bordes; `AGE_BANDS` llega como parámetro.
- **La edad en la base = la de la ficha** (R5): `private.pet_age_months` contra `ageOn` en la tabla
  de casos de fin de mes y de tramo.
- **Paridad del TTL** (R1): `private.pending_ttl()` = `DB_RULES.p_pending_ttl`.
- **Borrar la cuenta** (FR-022): después, `pet_by_code` no devuelve fila y el listado no lo cuenta.

**Unidad (Vitest + Stryker 100 %)**:

- `lib/pets/listing-query.ts`: `parseListingQuery` (cada clave y valor; desconocidos, repetidos,
  mayúsculas, orden, vacíos; la forma repetida del formulario sin ejecutar, `especie=perro&especie=gato`;
  todas las opciones = ninguna salvo castrado; `mostrar` fuera de 48…240 o no múltiplo de 24 → 24;
  agregados como `fbclid` fuera), `listingHref` (canónica, ida y vuelta con `parseListingQuery`, sin
  filtros = `/animales`), `isCanonicalListingQuery` (la que decide la redirección),
  `parseCursor` / `formatCursor` (ida y vuelta; mal formado → null) y `parseAddedOptions` (lo que
  manda el controlador en `sumadas`, validado contra el mismo vocabulario y devuelto en claves de
  dominio en inglés, `{ filter: 'species', option: 'cat' }`; un valor que no existe se descarta).
- `lib/pets/listing-page.ts`: `hasMore(rows, pageSize)`, `nextCursor(rows)` y
  `loadMoreState(shown, hasMore, hydrated)` (botón, enlace, el aviso de 240 o nada).
- `lib/pets/listing-state.ts`: `listingReducer` (un filtro nuevo reemplaza las cards y el total; un
  «Ver más» agrega sin tocar el total; una respuesta de un pedido viejo no cambia nada; una falla de
  «Ver más» deja las cards con su motivo; una falla de un filtro deja las cards viejas marcadas como
  de los filtros anteriores), `restoreDecision(snapshot, href, now)` (repone solo con «vuelvo», la
  misma dirección y sin vencer; guarda el `signedAt` más viejo de las cards) e `isStale(signedAt,
  now)` (49 min no, 50 sí, 51 sí).
- `lib/pets/pet-page-state.ts`: `petPageState` en sus cinco salidas (R10): sin fila → `missing`;
  oculto sin sesión → `unavailable` con entrar; oculto con otra sesión → `unavailable` sin entrar;
  oculto y es la dueña → `own_hidden` (sin «Editar»); a la vista y es la dueña → `own_listed`; a la
  vista y otra persona → `listed`.
- `lib/pets/publisher-level.ts`: `publisherLevelLabel(level)` → sin sello con `null`, «Teléfono
  verificado» con 1, «Identidad verificada» con 2, «Identidad verificada y avalada» con 3 (la clave
  de i18n, no el texto).
- `lib/analytics/listing-events.ts`: `petViewEvent` (a la vista desde el listado → `listing`; desde
  otro sitio, sin referer, referer mal formado u otra ruta del sitio → `outside`; oculto → nada; la
  dueña → nada; un lector de vista previa → nada; el evento no lleva ni código ni cuenta),
  `listingViewEvent` (lector de vista previa → nada) y `addedFilterOptions(before, after)` (una por
  opción sumada; ninguna al desmarcar; ninguna si no cambió).
- `lib/analytics/link-preview.ts` (de `main`, reemplaza a `lib/seo/preview-bots.ts`,
  §Reanudación): `isLinkPreview` con cada user-agent de la lista y con un navegador común; ya tiene
  test en `main`, solo se le muda un caso que falte.
- `lib/pets/published-ago.ts`: día 0, 1, 2, 13, 14, 59, 60, 89, 90, con el cambio de día en hora de
  Uruguay.
- `lib/share/share-mode.ts` (antes `lib/pets/`, §Reanudación): `shareMode({ coarse, canShare, canCopy })` → `share` / `copy` /
  `manual`, y `afterShareError(error)` (`AbortError` → nada; otro → copiar).
- `lib/og/palette.ts`: los valores iguales a los de `globals.css` (lee la hoja).

**Hooks y componentes (Vitest + Testing Library)**, solo los que cambian de conducta con el estado
del dominio:

- `lib/pets/listing-requests.ts` (`listingRequester`, lo que guarda el hook `useListingPages`; se
  prueba sin DOM por lo mismo que `ShareButton`): un pedido nuevo aborta el anterior (el `signal`
  del primero queda abortado); la respuesta de un pedido abortado no llega al reducer; sin conexión
  (el `fetch` rechaza) devuelve `offline`; un 503 devuelve `no_response`. Además `listingApiHref` y
  la forma de la respuesta (`isApiPage`).
- `ShareButton` (sus reglas viven en `lib/pets/share-mode.ts`, `shareLink` y `shareGate`, y se prueban ahí
  sin DOM: cambio en la construcción, para no sumar Testing Library ni un DOM de prueba que no están en
  docs/07): con `share` abre una vez aunque se toque dos; con `copy` muestra «Enlace copiado»
  y copia `APP_URL/animales/{code}`, no la dirección de la barra; si copiar falla, el `Sheet` con el
  enlace; cancelar no muestra nada.

**e2e (Playwright contra `next start`)**, `tests/e2e/animales.spec.ts`, con animales propios de la
corrida (R14), tres flujos críticos:

1. **El enlace sin sesión** (US1, US2): abrir el enlace de un animal: la ficha completa con
   «Teléfono verificado» y sin «Editar»; el HTML trae `og:title`, `og:description` y `og:image`, y
   la imagen responde `image/jpeg` y pesa menos de 300 KB.
2. **Filtrar y volver** (US3.1, US3.5, US3.6): marcar «Gato», «Cachorro» y el departamento del
   animal de la corrida; la dirección los lleva; «Ver más»; abrir un animal; volver atrás: las
   mismas marcas, las mismas cards cargadas y la misma posición; volver atrás otra vez sale del
   listado (los filtros no sumaron pasos).
3. **Sin JavaScript** (FR-019, SC-007): con `javaScriptEnabled: false`, la ficha entera sin
   «Compartir», con la portada visible (`naturalWidth > 0` y opacidad computada 1); el listado con
   sus portadas visibles, filtra con «Ver resultados» y «Ver más» muestra 48 desde el principio.

`tests/e2e/animales-rendimiento.spec.ts` (solo Chromium, `throttleLikeAPhone`): LCP de la ficha y
del listado < 2,5 s y CLS < 0,05 —también en «Mis animales», que suma `MyPetActions`—, con fotos
de 12 MP publicadas por la corrida (SC-001); y el JS inicial comprimido de `/animales` y de la
ficha, medido contra los 150 KB del presupuesto.

**No se testea**: las páginas, `ListingController` (fino: su estado y sus reglas están arriba),
`PetSheet`, `PetFacts`, `PetHeadline`, `OwnerCard`, `PetGallery`, `PetWall`, `PetCard`,
`ListingFilters` (pintan), la imagen de la vista previa más allá de su tipo, su peso y su 404,
`robots.ts` (lo audita Lighthouse en `/`), y `StaleImagesRefresh` (llama `isStale`, que tiene
test, y `router.refresh`).

## Docs que cambian en este PR

- `docs/03-mvp-features.md` §3: las nueve decisiones de la historia, palabra por palabra (hecho en
  la etapa de spec).
- `docs/known-limitations.md`: KL-53-3 se reabre con #59 (hecho en la etapa de spec); nuevas
  **KL-57-1** (el id de la cuenta en la ruta de las fotos firmadas, en `listed_pets`,
  `pet_share_card` y `pet_by_code`, y en el listado del bucket, R2), **KL-57-2** (sin View Transition
  entre card y ficha, R15) y **KL-57-3** (Lighthouse no mide el listado ni la ficha: la compuerta
  audita solo `/`, y sumarlos cambia `.lighthouserc.json`, que necesita `reglas-aprobadas`); KL-53-9 se cierra si las fotos de la
  seed entran (tarea opcional de pulido); si no, su «Se reabre cuando» pasa a la seed.
- De la construcción: **KL-57-4** (el JS inicial del listado y de la ficha pasa los 150 KB) y
  **KL-57-5** («no está publicado» responde 200); **KL-53-8** se borra: la cabecera ya marca la
  pantalla actual (`NavLink`).
- `docs/07-stack.md`: `sharp` 0.35.5 (hecho en esta etapa); decisiones de R1 (lectura pública por
  funciones, TTL con paridad), R2 (bucket privado con policies de firma públicas; reemplaza la nota
  «la historia que hace públicas las fichas decide») y R6 (`next/og` + `sharp`).
- `docs/08-convenciones-codigo.md` §Encontrable: los bots de vista previa en `robots.txt` e
  `INDEXING_ENABLED` (R7).
- `docs/10-design-system.md`: decisión «el poste» en el listado ancho (R12) y su línea en
  «Descartado»; `--container-rail` en §Pantallas anchas; filas de `Chip` (modo casilla),
  `ChipGroup` (`orientation`), `PetCard` (`href`, edad), `PetGallery` (ex `PetPhotoGallery`),
  `PetFacts` (reemplaza `PetAttributes`, R13), `OwnerCard` (lo que muestra en esta historia),
  `AccountMenu` (el enlace al listado, `flex-wrap`, `aria-current`), `ErrorTextsProvider` (suma
  `(public)`), `PetPhoto` (visible desde el servidor), la ficha en dos columnas desde 1024 en
  §Pantallas anchas, y filas nuevas de `PetWall`,
  `ListingCount`, `ListingFilters`, `ListingController`, `LoadMoreButton`, `PetSheet`,
  `PetHeadline`, `ShareButton`, `PetUnavailable`, `HiddenFromPublicNotice`, `MyPetActions`,
  `GalleryPosition`, `StaleImagesRefresh` y la plantilla de la vista previa.
- `docs/06-i18n.md`: el ejemplo de §URLs y la línea «Imagen OG del share (texto sobre la foto)» →
  «(texto debajo de la foto)».

## Project Structure

### Documentation (this feature)

```text
specs/009-ver-animales-compartir/
├── story.md
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/routes.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/<ts>_listed_pets.sql
src/
  app/robots.ts                                     (cambia: bots de vista previa, INDEXING_ENABLED)
  app/api/animales/route.ts                         (las tandas del listado, GET)
  app/[locale]/(public)/layout.tsx                  (cambia: ErrorTextsProvider)
  app/[locale]/(public)/animales/
    page.tsx · error.tsx
    _components/listing-controller.tsx
    [code]/page.tsx · error.tsx
    [code]/imagen/route.tsx · BricolageGrotesque_Condensed-ExtraBold.ttf · OFL.txt
  app/[locale]/(app)/mis-animales/page.tsx · loading.tsx   (cambian)
  app/[locale]/_components/
    account-menu.tsx · error-texts-provider.tsx (cambian) · stale-images-refresh.tsx
  actions/share.ts
  components/ui/chip.tsx                            (cambia: modo casilla, orientation)
  hooks/use-listing-pages.ts
  components/pets/
    pet-card.tsx · pet-photo.tsx · my-pets-grid.tsx (cambian) · pet-wall.tsx
    listing-count.tsx · listing-filters.tsx · load-more-button.tsx · pet-share-image.tsx
    pet-sheet.tsx · pet-gallery.tsx · gallery-position.tsx · pet-headline.tsx · pet-facts.tsx
    share-button.tsx · pet-unavailable.tsx · hidden-from-public-notice.tsx · my-pet-actions.tsx
  components/verification/owner-card.tsx
  lib/config.ts                                     (cambia: INDEXING_ENABLED)
  lib/pets/rules.ts · paths.ts · types.ts            (cambian)
  lib/pets/listing-query.ts · listing-page.ts · listed-card-view.ts · published-ago.ts
  lib/pets/share-mode.ts · pet-page-state.ts · listing-state.ts · publisher-level.ts
  lib/analytics/events.ts (cambia) · listing-events.ts
  lib/analytics/link-preview.ts                     (de main: la lista de lectores de vista previa)
  lib/og/palette.ts
  lib/supabase/queries/listed-pets.ts               (listListedPets, getPublicPet, getShareCard y la firma)
  lib/supabase/types.ts                             (regenerado con pnpm db:types)
  styles/globals.css                                (cambia: --container-rail; PetPhoto sin ejecutar)
messages/es.json                                    (pets.listing, pets.page, pets.share, auth.account_menu)
tests/db/listed-pets.test.ts · tests/db/listing-support.ts
tests/e2e/animales.spec.ts · animales-rendimiento.spec.ts
```

**Structure Decision**: la de F00. Las lecturas, solo en `lib/supabase/queries/`; los componentes
de dominio reciben el objeto y no piden nada; `ListingController` es de la capa `app` y pide tandas
por el hook `useListingPages`; las páginas componen y piden. La fuente de la imagen vive junto a su
ruta, la única que la usa, para no abrir una carpeta nueva fuera de la estructura de F00. `listedCardViews` (en `lib/pets/listed-card-view.ts`) arma las cards con los
textos ya traducidos, y la usan la página y la ruta de tandas.

## Complexity Tracking

Sin violaciones.

## Para Ship

- **Issue `aviso`**: lo listado en Constitution Check, VIII.
- **Pedido de `reglas-aprobadas`** (en el `aviso`): sumar `/animales` y una ficha sembrada a
  `.lighthouserc.json`, que docs/07 §Presupuesto nombra y que es una compuerta protegida; hasta
  entonces, el e2e de rendimiento y KL-57-3.
- **Seed con fotos** (tarea opcional de pulido, la última; cierra KL-53-9 si entra; si el build
  no la hace, KL-53-9 queda abierta y no es un seguimiento): `node
  scripts/seed-pets.mjs` publica con la clave de servicio cinco animales de Ana (nivel 1, con zonas
  distintas de la de su perfil) y uno de Lucía (número a medias: oculto), con fotos de perros y
  gatos de dominio público de Wikimedia Commons en `supabase/seed-photos/` (fuente y licencia de cada
  una en `SOURCES.md`; seis fotos de menos de 200 KB cada una, para no engordar el repo), pasadas
  por `sharp` a los tres WebP y su ThumbHash como hace el navegador. No entran en `seed.sql` porque
  Storage no se siembra desde SQL (el mismo motivo que los avatares). Si no se consiguen fotos de
  dominio público, se saltea y KL-53-9 queda abierta.
- **Fuera de alcance, anotado**: la etiqueta del perfil propio («Rescatista») frente a la de la
  ficha («Rescatista o refugio»), para la historia del perfil.
