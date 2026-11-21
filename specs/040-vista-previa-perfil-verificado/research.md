# Research: Que la vista previa del enlace de mi perfil diga qué tengo verificado

**Feature**: `specs/040-vista-previa-perfil-verificado` · **Historia**: #280 · **Fecha**: 2026-11-21

Lo que ya hay en `main` y se reusa: `getPublicProfile` (la lectura del perfil público, con `cache`
por pedido), `publicLevel` (la escalera de la chapita desde esa lectura), `publisherLevelLabel` y las
claves `pets.page.level_one|two|three` (las palabras de la chapita), `shareImageResponse`-like
(`ImageResponse` + `shareFont` + `smallJpeg`), `OG_PALETTE`, `SHARE_LAYOUT`, `siteShareVersion`,
`MeasuredLevel` / `measuredLevelOf`, `trackProfileMoment`, `profileViewProps`, `LINK_PREVIEW_AGENTS`
y `robots.ts`.

## R1. Una imagen por nivel, no una por persona

- **Decision**: la imagen del perfil depende solo del nivel. Hay tres imágenes, una por nivel, en una
  ruta propia bajo el perfil público, `/perfil/nivel/<1|2|3>/imagen?v=<versión>`. El `og:image` del
  perfil apunta a la de su nivel de ahora. Cualquier otro valor de nivel da 404. La ruta no lee la
  base.
- **Rationale**: la imagen dice el nivel y el sitio, y nada de la persona (spec FR-003, FR-010 y
  Assumptions: sin el nombre). Si no hay nada de la persona, no hace falta saber de quién es: no hay
  un «perfil que no existe» ni una persona suspendida que la ruta tenga que resolver (spec Edge Cases,
  «Alguien pide la imagen del perfil directo»), y no hay una lectura de la base que pueda fallar en la
  ruta. Como la dirección cambia con el nivel, el nivel que baja cambia la URL y una app no recibe la
  imagen de antes (FR-005), sin la versión compuesta de #244. Las tres se guardan en caché para
  siempre (`public, max-age=31536000, immutable`), como la de la portada: no cambian salvo que cambie
  el texto, que va en `?v=`.
- **Alternatives considered**: `/perfil/<id>/imagen?v=<nivel>`, como la de un animal. Obliga a leer
  el perfil en la ruta, a resolver suspendidas, borradas y altas sin terminar, y a devolver 404 para
  cada una, para dibujar lo mismo que la ruta por nivel. Descartada: más superficie y ninguna ventaja.
  Poner la imagen bajo `/niveles`: la página que explica los niveles no tiene que ver con la vista
  previa, y `/perfil` es lo que se abre a los lectores de vista previa en R4.
- **Choque de rutas**: `perfil/nivel` es un segmento fijo al lado de `perfil/[id]`. Next prefiere el
  fijo, y `nivel` no tiene la forma de un id público (22 caracteres), así que ningún perfil queda
  tapado.

## R2. El texto debajo del título son las palabras de la chapita

- **Decision**: con nivel 1 a 3, `description` (y `og:description`, `twitter:description`) es la
  clave `pets.page.level_*` tal cual: «Teléfono verificado», «Identidad verificada», «Identidad
  verificada y avalada». Sin un texto nuevo en `messages/es.json` para esto.
- **Rationale**: los criterios piden que el texto «diga Identidad verificada» y «las mismas palabras
  que muestra su perfil público». En #244 hizo falta «Quien publica tiene…» porque el título era el
  animal; acá el título es el nombre de la persona (spec Assumptions). Reusar la clave garantiza que
  la ficha, el listado, el perfil y la vista previa digan lo mismo.
- **Alternatives considered**: «{name} tiene la identidad verificada.» Repite el nombre del título y
  suma tres textos que pueden separarse de la chapita. Descartada.

## R3. Qué dice `generateMetadata` en cada caso

- **Decision**: una función pura, `profileShareMetadata`, en `src/lib/profile/share-metadata.ts`,
  recibe `{ level: VerificationLevel | null, title, levelText: string | null }` y devuelve lo que se suma a los
  metadatos de hoy: con nivel 1 a 3, `description`, `openGraph.description`, `openGraph.images` (la
  ruta de R1, 1200 × 630, `image/jpeg`, `alt` = las palabras del nivel) y `twitter` con
  `summary_large_image`; con nivel 0 o `null`, nada. La página la llama solo si `findProfile(id)`
  trajo un perfil; el «no existe» queda exactamente como hoy.
- **Nivel que no se puede saber (FR-008)**: el nombre y el nivel salen de la misma lectura
  (`getPublicProfile`, la de la chapita). Si esa lectura falla, no hay nombre ni nivel: la página
  responde con su pantalla de error, como hoy, y ninguna app arma la tarjeta. No existe el caso «se
  sabe el nombre pero no el nivel», así que no hace falta un camino aparte. Lo que sí se garantiza es
  que nunca se adivina: `publicLevel` solo da 0 a 3 desde lo que la base deja ver, una fila mal
  formada ya la rechaza `getPublicProfile`, y en ningún lado hay un valor por defecto distinto de 0,
  que es «nada verificado» y deja la vista previa de hoy. Si un día el nivel viniera de otra lectura,
  `profileShareMetadata` ya acepta `null` y lo trata como 0.
- **Imagen que no se puede armar (FR-009)**: la imagen la pide la app aparte, después de leer el
  HTML. Si la ruta falla, el `og:description` ya llegó con el nivel. No hace falta nada más.
- **Rationale**: lo que cambia con el nivel es lógica de producto (qué se muestra y qué no) y merece
  una prueba con Stryker al 100 %; la página solo compone.

## R4. Abrir `/perfil` a los lectores de vista previa en robots.txt

- **Decision**: la regla de `LINK_PREVIEW_AGENTS` en `src/app/robots.ts` suma `/perfil` a su
  `allow`. La regla de todos los demás (`disallow: '/'` hasta el dominio definitivo) no cambia, y el
  perfil sigue con `noindex, nofollow` fijo en la página.
- **Rationale**: hoy el lector de Facebook respeta robots.txt (research R7 de la #57) y `/perfil` no
  está abierto, así que en un grupo de Facebook el enlace de un perfil no arma tarjeta. La historia
  pide justo Facebook («cuando alguien pega el enlace del perfil de cada una en un grupo de
  Facebook»). Abrirlo a los lectores de vista previa no lo indexa: no hay buscadores en esa lista
  (`googlebot` está aparte, en `CRAWLERS`), y la página lleva `noindex`. No cambia quién ve qué: el
  perfil público ya lo abre cualquiera sin sesión, y para un lector de vista previa la página no
  dibuja fotos (#12). Se cuenta en el reporte de la semana como regla de privacidad tocada.
- **Alternatives considered**: abrir solo la ruta de la imagen. Facebook necesita leer el HTML del
  perfil para encontrar `og:image`; sin `/perfil` abierto no llega a la imagen.

## R5. La medición: `owner_level` en los dos momentos

- **Decision**: `profile_link_copied` pasa a `{ from; owner_level?: MeasuredLevel }` y
  `public_profile_viewed` a `{ origin; with_pets?: boolean; owner_level?: MeasuredLevel }`. El mismo
  nombre en los dos porque en los dos es el nivel de la dueña del perfil: quien copia o manda el
  enlace de su perfil es la dueña. Sin nivel, la propiedad no sale (como `publisher_level` en #236).
- **Visita**: en la página, `profileViewProps(origin, pets, level)` suma `owner_level:
  publicLevel(profile)`. El perfil ya se leyó para dibujar la página; el nivel es el mismo de la
  chapita que ve quien visita. No hay una lectura nueva ni un caso «no se pudo saber» en este camino:
  si `getPublicProfile` falla, no hay visita que medir.
- **Enlace copiado o mandado**: `trackProfileMoment` lee el nivel en el servidor, después de validar
  `from`: la sesión (`lookupSession`), el `public_id` de la persona (`findProfile`) y su perfil
  público (`getPublicProfile`) → `publicLevel`. Cualquier falla, sin sesión o sin perfil público →
  `null` y el momento sale sin `owner_level`. Una función de query nueva, `getOwnPublicLevel(userId):
  Promise<MeasuredLevel | null>`, en `src/lib/supabase/queries/profiles.ts`, que nunca lanza.
- **Sin demora (FR-019)**: el cliente ya llama `void trackProfileMoment(...)` después de copiar o de
  que la hoja del sistema vuelva con `shared`; no espera la respuesta. «Enlace copiado» no cambia.
  Cerrar la hoja sin elegir ya no llama (`outcome === 'cancelled'`).
- **Por qué el nivel público y no el de «Mi perfil»**: la regla de la historia es «el mismo que
  muestra su perfil público en ese momento». El de «Mi perfil» sale de la misma escalera, pero el
  momento se manda desde tres pantallas y el servidor no puede confiar en un nivel que mande el
  cliente.
- **Alternatives considered**: mandar el nivel desde el cliente (la pantalla ya lo sabe). Descartada:
  el cliente puede mandar cualquier cosa, y la acción ya valida contra listas cerradas por eso.

## R6. La línea de «Mi perfil»

- **Decision**: `PublicProfileLinks` recibe un `note?: string` opcional y, si viene, lo dibuja entre
  el `h2` y `CopyProfileLink`, en `--text-base` `ink` y `max-w-[var(--measure)]`, como
  `ProfileLinkLine`. `MyProfileSections` lo pasa solo con `level >= 1`. La clave nueva es
  `profile.public.preview_note`: «Cuando pegás este enlace en un chat o en un grupo, se ve qué tenés
  verificado.» (el ejemplo de la historia; se revisa con `sin-slop`).
- **Rationale**: el nivel de «Mi perfil» ya está en la pantalla (`myVerification`), de la misma
  escalera que el perfil público. Quien perdió el teléfono verificado (otra cuenta recuperó el
  número, o cambió de chip y no confirmó el nuevo) tiene nivel 0 y no ve la línea (spec US3-3).
- **Skeleton**: `loading.tsx` de «Mi perfil» no cambia. La línea depende del nivel, que el skeleton
  no sabe, y es un renglón de texto: dibujarlo siempre prometería algo que a quien no verificó no le
  aparece.

## R7. El dibujo de la imagen

- **Decision**: un componente nuevo, `ProfileShareImage` en `src/components/profile/`, a 1200 × 630
  sobre `OG_PALETTE.canvas`, con la voz de afiche (`SHARE_FONT`). En el cuadrado del centro (x 285 a
  915) va el nivel en palabras en `OG_PALETTE.primary`, centrado, en hasta dos renglones. Abajo, a
  `SHARE_LAYOUT.inset` del borde, el nombre del sitio a 28 px en `OG_PALETTE.inkMuted`, centrado. Sin
  foto, sin el nombre de la persona y sin la chapita metálica: en una miniatura de un cuarto de tamaño
  la chapita sería un manchón, y el verde con las palabras ya dice lo que hay que decir. Sin cinta ni
  tira: lo único que se lee es el nivel.
- **Medida**: `profileLevelSize(text)` en `src/lib/og/share-layout.ts`, pura, con la regla de
  `shareNameSize` (`EM_PER_CHARACTER`): el cuerpo más grande, entre 56 y 96 px, en el que cada palabra
  entra en 630 px y el texto entero entra en dos renglones de 630 px. Con «Identidad verificada y
  avalada» da 78 px («Identidad verificada» en el primer renglón). Con su prueba, para que un texto
  más largo no se salga del cuadrado.
- **Rationale**: docs/10 dice que lo que muestra la miniatura chica de un chat es el cuadrado del
  centro; ahí tiene que estar el nivel entero (spec FR-003, SC-003).

## R8. Qué se prueba y por qué (docs/09 §Qué vale la pena testear)

- `profileShareMetadata` (Vitest + Stryker 100 %): con 1, 2 y 3 trae el texto y la imagen del nivel;
  con 0 y con `null` no trae nada; nunca nombre, zona ni foto en lo que suma. Engaña a una persona si
  se rompe.
- `profileLevelImagePath` y el parseo del nivel en la ruta (Vitest): 1 a 3 válidos; 0, 4, `x`, `2.5`,
  vacío → no es un nivel (la ruta da 404).
- `profileLevelSize` (Vitest): el más largo de los tres entra en el cuadrado.
- `profileViewProps` (Vitest, el test que ya existe, ampliado sin borrar nada): suma `owner_level` y
  lo deja afuera con `null`.
- `trackProfileMoment` no tiene test hoy (es una acción fina); la regla «sin nivel → sin propiedad»
  vive en una función pura nueva, `profileLinkProps(from, level)`, en `src/lib/analytics/`, con su
  prueba.
- `robots.test.ts`: la regla de los lectores suma `/perfil`; la de todos sigue `disallow: '/'`.
- e2e `tests/e2e/aval.spec.ts`: el test de vista previa se parte en dos. Una persona sin nada
  verificado (`level: 0`) conserva todas las aserciones de hoy (sin `og:image`, sin zona, sin
  «nivel», sin foto). Una con la identidad (`level: 2`, la de siempre) dice «Identidad verificada» en
  `og:description`, trae `og:image` con la ruta de nivel 2, y sigue sin zona ni foto. Se suma un pedido
  a la imagen de nivel 2 con el lector de WhatsApp: 200 e `image/jpeg`; y a `/perfil/nivel/0/imagen`:
  404. Ninguna aserción se borra: la de «sin `og:image`» pasa a la persona sin nada verificado, que es
  donde la regla sigue valiendo.
- Sin test: `ProfileShareImage` (solo pinta), la línea de «Mi perfil» (solo pinta, la condición es
  `level >= 1` en la página), `getOwnPublicLevel` (query fina).
