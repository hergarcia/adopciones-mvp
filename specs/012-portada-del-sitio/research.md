# Research — Portada del sitio (#61)

Cada decisión con su motivo y lo que se descartó. Las rutas y nombres son los de `main` en b306d2c.

## R1 — Los animales de la portada son la primera tanda del listado, con 8

**Decisión**: la página pide `listingView(NO_FILTERS, null, 8)` (la misma función que arma la
primera vista de `/animales`, en `animales/_components/listing-view.ts`), que llama a
`listListedPets` → la función de la base `listed_pets` con la sesión de quien mira o como anónimo.
Las cards salen ya armadas (`listedCardViews`) y se dibujan con `PetWall` `wall` + `PetCard`.
`listing-view.ts` se mueve a `src/app/[locale]/_components/listing-view.ts` (la usan dos rutas) sin
cambiar su firma. `NO_FILTERS` es la constante de filtros vacíos que ya exporta
`lib/pets/listing-query.ts`.

**Motivo**: la regla de negocio es «los primeros del listado, con sus mismas reglas» (FR-013,
FR-015). Reusar la misma consulta, que ya filtra a la vista (publicado, no pausado, no vencido, no
dado de baja, publicador con teléfono verificado) por RLS y por la función de la base, hace que la
portada no pueda divergir del listado: no hay una segunda regla que mantener ni que testear. El
orden del más reciente al más viejo también viene de ahí.

**Descartado**: una consulta nueva `listRecentPets(8)` en `lib/supabase/queries/` (duplicaría la
regla de visibilidad y su orden); ordenar por urgencia (decisión 2026-09-27 de la historia).

## R2 — Sin `Suspense` ni `loading.tsx`: la portada llega entera del servidor

**Decisión**: la página espera a los animales antes de responder, como `/animales`. El «cargando»
del bloque de animales es el de cada `PetCard`: su lugar 4:5 reservado con el ThumbHash borroso
hasta que llega la foto (FR-019, FR-020). No hay skeleton de bloque.

**Motivo**: con `Suspense` el HTML trae el fallback y el contenido llega aparte, y lo cambia de
lugar un script en línea: sin JavaScript (FR-022, el navegador de la app de Facebook) la persona se
queda con el skeleton para siempre. Es la misma razón por la que `/animales` y la ficha no tienen
`loading.tsx`. La consulta es la misma primera tanda que el listado ya sirve dentro del presupuesto.

**Descartado**: `Suspense` con `PetWallSkeleton` (rompe FR-022); `loading.tsx` de la ruta (mismo
problema, y además taparía también los textos, que no esperan nada).

## R3 — El error de los animales no tumba la portada

**Decisión**: `listingView(...).catch(() => null)`, como hace `/animales`. Con `null`, el bloque
dibuja `RecentPetsFailed`: `EmptyState` con «No pudimos cargar los animales. Mirá todos en
Animales en adopción.» y un `LinkButton` `secondary` «Ver animales en adopción». Sin «Reintentar»:
volver a abrir la portada es reintentar, y la acción del aviso lleva a la pantalla que tiene su
propio reintento (docs/10 §Principios 6, una acción una vez).

**Motivo**: FR-018 pide el resto de la portada completo. Un error de la ruta (`error.tsx`) reemplaza
la pantalla entera.

## R4 — «Publicar un animal» es un enlace a publicar; la puerta ya existe

**Decisión**: `LinkButton` `tirita` a `PUBLISH_PATH` con `prefetch={false}`. La página de publicar ya
llama a `requireVerifiedPhone(petGateRequest(PUBLISH_PATH))`, que hace todo lo que piden FR-009 a
FR-012: sin sesión, `/entrar?next=/mis-animales/publicar`; sin perfil,
`/completar-perfil?next=…`; sin teléfono, el aviso de verificación pendiente con la vuelta a
publicar. Los motivos de un ingreso abandonado o un enlace vencido son los de #9, que conservan el
`next`. La portada no agrega lógica de sesión: es la misma para todos (FR-021).

**Motivo**: un solo camino a publicar en todo el sitio; la e2e de la historia lo prueba entero
desde la portada (SC-002).

**`prefetch={false}`**: un prefetch del enlace a publicar correría la puerta (y su redirección) y la
medición del toque (R6) sin que nadie toque nada. Igual en las cards y en «Ver todos».

## R5 — La vista previa: una imagen fija del cartel, servida por una ruta propia

**Decisión**: una ruta `src/app/[locale]/(public)/imagen/route.tsx` (`/imagen`, la misma forma que
`/animales/[code]/imagen`) que dibuja `SiteShareImage` con `next/og` (`ImageResponse`) y la pasa a
JPEG con `sharp` por debajo de `SHARE_IMAGE_MAX_BYTES` (300 KB, lo que WhatsApp acepta). No lee la
base. La portada declara en su `metadata`:
`openGraph: { type: 'website', siteName: APP_NAME, title: APP_NAME, description: <la frase>,
images: [{ url: '/imagen?v=<versión>', width: 1200, height: 630, alt: <la frase> }] }` y la misma
`description`. `<versión>` es un hash corto de `APP_NAME` + la frase (`siteShareVersion()` en
`lib/og/`), para que las apps pidan la imagen nueva cuando cambie el nombre (FR-026).

`SiteShareImage` (`src/components/site/site-share-image.tsx`) es el cartel sin foto: papel
(`OG_PALETTE.canvas`), el nombre del sitio en voz de afiche, grande, a la izquierda; la frase debajo
en tinta; una tira de papel con `.cinta` dibujada (como el `TapedPhoto` de `PetShareImage`) con
«Se busca hogar» en afiche, y el borde perforado de la tirita abajo. Recibe `siteName`, `phrase` y
`tagline` ya traducidos. Ningún animal ni persona (FR-025).

Se extrae a `lib/og/` lo que ya usa la imagen de un animal y ahora usaría también esta (segunda
repetición, CLAUDE.md §Componentizar): `smallJpeg()` y la carga de la fuente
(`shareFont()`), con el archivo `.ttf` movido a `src/lib/og/` y su `OFL.txt` al lado. La ruta de la
ficha pasa a importarlos; no cambia lo que hace.

**Motivo**: un archivo `opengraph-image.tsx` en `(public)/` lo heredarían `/animales`, la ficha
cuando no trae imagen, y el perfil público, que decidió no llevar `og:image` (su `page.tsx`, línea
77). La ruta explícita solo la declara la portada. La ruta es dinámica como la de la ficha (vive
bajo `[locale]`, y `force-static` pediría `generateStaticParams` solo para esto), pero responde con
`cache-control: public, max-age=31536000, immutable`: la versión va en la dirección, así que una
imagen vieja nunca se sirve con un nombre nuevo.

**Descartado**: `opengraph-image.tsx` en un grupo de ruta propio `(portada)` (mueve la página y
suma un grupo a la estructura de F00 para una sola imagen); una imagen PNG a mano en `public/`
(no sigue al nombre del sitio, FR-026).

## R6 — La medición, con lo que el sitio ya mide

**Decisión**:

- **Vio la portada**: evento nuevo `home_viewed`, sin propiedades, disparado por la página salvo
  para un lector de vista previa (`isLinkPreview`), como `listing_viewed`.
- **Tocó «Publicar un animal» desde la portada**: evento nuevo `home_publish_tapped`, que dispara la
  página de publicar **antes** de la puerta, cuando el `referer` es la portada de este mismo sitio
  (`homeReferer(referer, host)` en `lib/analytics/home-events.ts`). «Si terminó publicando en esa
  misma visita» no necesita evento: `pet_published` ya lleva la marca de la visita, y se cruzan por
  ella.
- **Tocó «Ver animales en adopción» o «Ver todos»**: `listing_viewed` pasa a llevar
  `{ origin: 'home' | 'elsewhere' }`. Con el `referer` en la portada es `home`.
- **Abrió una ficha desde la portada**: `PetViewOrigin` suma `'home'`; `petViewEvent` lo da cuando
  el `referer` es la portada.

Todo pasa por funciones puras con test (R8). Ninguna propiedad lleva un id, un código de animal ni
nada de la persona (FR-030); la visita es el UUID al azar que ya pone `proxy.ts`.

**Motivo**: es el patrón de `petViewEvent` (`listingReferer`): el servidor sabe de dónde se llegó
sin JavaScript (FR-022) y sin parámetros nuevos en las direcciones, que en el listado redirigirían
a la canónica.

**Límite aceptado**: el enlace «Animales en adopción» de la cabecera, tocado desde la portada,
también cuenta como `home`: es la misma acción con el mismo nombre. Y el `referer` lo puede apagar
quien navega; el evento se pierde, no se inventa.

**Descartado**: un evento por toque desde el cliente (no funciona sin JavaScript y suma una hoja
cliente a la portada); `?desde=portada` en los enlaces (ensucia la dirección compartible y el
listado la redirigiría).

## R7 — Composición y capas

**Decisión**: `src/app/[locale]/(public)/page.tsx` compone y pide los datos; los bloques viven en
`src/components/home/`, reciben los textos traducidos y las cards por props, y no piden nada:

- `HomeHero`: la frase (`h1`, `.afiche` `text-4xl`) y las dos acciones.
- `RescuerSteps`: `h2` «Si rescatás» y la `ol` de tres pasos.
- `AdopterPromise`: `h2` «Si querés adoptar», las tres frases y `VerificationBadge` `md` nivel 1,
  con su enlace a la explicación de los niveles (`/niveles?nivel=1&desde=/`, la forma que ya usa
  la chapita).
- `RecentPets`: `h2` «Recién publicados», `PetWall` `wall` o su vacío o su error, y «Ver todos».
- `RecentPetsFailed`: el error del bloque (R3).
- `HomeLayout`: la grilla de la portada en los dos anchos (§Diseño del plan).

Los textos salen de `messages/es.json`, namespace `home` (con `home.metadata`); un
`homeTexts()` en `src/app/[locale]/(public)/_components/home-texts.ts` los arma en el servidor,
como `listingTexts()`. Se borra `common.under_construction`, que deja de usarse.

## R8 — Qué se testea y qué no

- **Vitest** (`lib/analytics/home-events.test.ts`, y los casos nuevos de
  `listing-events.test.ts`): `homeReferer` (misma portada, otro host, otra ruta, `/` con query,
  referer nulo o inválido), `homeViewEvent` (lector de vista previa → null),
  `homePublishTapEvent`, `petViewEvent` con origen `home` y `listingViewEvent` con origen. Son la
  medición de la primera métrica de éxito: si calculan mal, engañan. 100 % de mutantes.
- **Vitest** `siteShareVersion()`: cambia con el nombre y con la frase.
- **Playwright** `tests/e2e/portada.spec.ts`, contra `next start` con datos de la corrida
  (`publishForRun`): (a) sin sesión: la frase, las dos acciones, los tres pasos, el nombre una sola
  vez, sin «construyendo»; los animales de la portada coinciden en orden con los primeros 8 de
  `/animales`, con «En proceso» en el que lo tiene; un animal pausado sale; tocar uno abre su ficha;
  «Ver todos» abre `/animales`. (b) «Publicar un animal» sin sesión → entrar con el enlace por
  correo de una dirección nueva (`uniqueEmail`, `openEmailSignIn`, el buzón de `.artifacts/mail/`) →
  completar perfil → publicar (Google no se puede automatizar; comparte la misma puerta); con teléfono verificado → publicar directo; sin teléfono →
  el aviso. (c) con `javaScriptEnabled: false`: todo lo de (a) se ve y los enlaces llevan. (d) el
  HTML de `/` trae `og:title`, `og:description` y `og:image`, y `/imagen` responde una imagen JPEG
  de menos de 300 KB.
- **El vacío y el error** con la base vacía o caída no se prueban en e2e (comparten la base con
  otras pruebas); se ven en `walk.mjs` y los cubre la revisión de diseño. Los 0 animales sí se
  pueden ver con `supabase db reset` sin semillas de animales.
- **El freno** de `animales-rendimiento.spec.ts` ya mide `/` contra 150 KB y LCP/CLS; Lighthouse
  CI mide la portada (`.lighthouserc.json`). No se agrega otro.
- **No se testean** los componentes de `home/` (solo pintan), ni la ruta de la imagen más allá de
  (d).
