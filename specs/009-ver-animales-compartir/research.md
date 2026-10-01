# Research: Ver los animales publicados con filtros y compartir la ficha de cada uno

Cada decisión con su motivo y lo que se descartó. Las que cambian algo que `docs/` decía se avisan
en Ship (plan §Constitution Check, VIII).

## R1. Por dónde se lee lo público: funciones de la base, no una policy ancha

**Decisión**: lo público se lee solo por tres funciones `security definer` de `public`, con
`execute` para `anon` y `authenticated`: `listed_pets` (el listado), `pet_by_code` (una ficha) y
`pet_share_card` (lo mínimo para la vista previa). Las auxiliares viven en `private`, que hoy solo
`authenticated` puede usar: la migración suma `grant usage on schema private to anon`, da `execute`
a `anon` y `authenticated` solo sobre las dos funciones que usan las policies de Storage (R2), y
hace `revoke execute ... from public` explícito sobre el resto de las `private.*` nuevas. Adentro llevan la regla de estar a la vista
(`private.pet_is_listed`) y devuelven **solo las columnas públicas**. Las policies de `pets`,
`pet_photos`, `profiles` e `identity_verifications` no cambian: siguen siendo solo de la dueña, así
que una lectura directa desde el cliente de otra persona sigue sin devolver nada. Las páginas usan
el cliente con la sesión de quien mira (o anónimo), nunca la clave de servicio.

**Por qué**:
- La historia abre del publicador nombre, foto y marca, y **nada más** (FR-004). RLS filtra filas,
  no columnas: una policy que abriera la fila de `profiles` de un publicador abriría también su
  zona y su fecha de alta a cualquier cuenta, porque `authenticated` ya tiene `select` sobre todas
  las columnas (para leer la propia). Una función devuelve exactamente lo público.
- La regla «a la vista» cruza tres tablas (`pets`, `phones`, y el nivel 2 en
  `identity_verifications`); en una policy sería una subconsulta por fila evaluada con permisos
  que `anon` no tiene sobre `phones`.
- Con la sesión de quien mira, `pet_by_code` sabe si quien pide es el publicador
  (`auth.uid() = owner_id`) y le devuelve su ficha aunque no esté a la vista (FR-020), sin que la
  aplicación decida nada.
- Sin clave de servicio en una pantalla pública: un error en una consulta de una página abierta a
  todo el mundo no puede saltearse RLS.

**El TTL del número a medias**: las funciones de escritura reciben `p_pending_ttl` desde
`lib/verification/rules.ts`. Una función que llama `anon` no puede recibirlo: bajar el TTL desde
afuera haría visible el animal de un publicador con un cambio a medias (FR-003). Así que
`private.pending_ttl()` devuelve el intervalo fijo, y un test de `tests/db` compara su valor con
`DB_RULES.p_pending_ttl`: el número sigue teniendo una sola fuente y la base no puede quedar
desalineada sin un test rojo. Es la única regla repetida, y por esa razón.

**Alternativas descartadas**:
- *Policy `for select to anon, authenticated` en `pets` y `pet_photos` + grants por columna*:
  no alcanza para `profiles` (ver arriba) y deja la regla de visibilidad evaluándose por fila.
- *Vistas*: una vista es del dueño y saltea RLS; expuesta por PostgREST es una tabla pública más
  difícil de auditar, y tampoco recibe la sesión para el caso del publicador.
- *Funciones llamadas con la clave de servicio*: permite pasar el TTL como parámetro, pero pone la
  clave que saltea todo en el camino de cada visita anónima.

## R2. Las fotos: siguen en el bucket privado, con URLs firmadas por quien mira

**Decisión**: el bucket `pet-photos` y el `avatars` siguen privados. Dos policies nuevas de
`select` en `storage.objects`, para `anon` y `authenticated`, dejan firmar solo los objetos de una
foto enganchada a un animal a la vista (`private.pet_photo_object_listed(name)`) y el avatar de un
publicador con al menos un animal a la vista (`private.avatar_object_listed(name)`). La página firma
con el cliente de quien mira, por `SIGNED_URL_TTL_SECONDS` (una hora), como «Mis animales».

**Por qué**: FR-018 pide que una foto deje de abrirse cuando el animal deja de estar a la vista, con
un margen de una hora como mucho. Una URL firmada vence sola en una hora y no se puede volver a
firmar sin cumplir la policy. Un bucket público la dejaría abierta para siempre a quien guardó la
dirección.

**Costo aceptado**: la URL firmada cambia en cada carga, así que el navegador no reusa la foto
entre visitas; y la ruta del objeto lleva el id de la cuenta de quien publica
(`pet-photos/{dueña}/{foto}/…`, decisión de #53), que por eso las funciones devuelven como
`cover_owner` (la carpeta para firmar). La policy de `select` también deja **listar** el bucket, y
listándolo se ven las carpetas de los publicadores con algún animal a la vista. Ese id es un identificador al azar que no abre
nada (RLS lo compara con la sesión) y solo dice lo que la ficha ya dice: que esos animales los
publicó la misma persona. Se anota en `known-limitations.md`.

**Descartado**: *un proxy propio `/fotos/[id]`* que valide y sirva el archivo: esconde el id y deja
cachear, pero duplica el tráfico de cada foto por el servidor (Vercel Hobby lo cobra en ancho de
banda) y suma una ruta que hay que proteger. *Bucket público*: ver arriba.

## R3. El enlace: un código de 10 caracteres al azar, que no se reusa

**Decisión**: columna `pets.code`, 10 caracteres del alfabeto Crockford en minúscula
(`0-9a-hjkmnp-tv-z`, sin `i l o u`), al azar (50 bits de `gen_random_bytes`). La ficha vive en
`/animales/{code}`: `/animales/` son 10 caracteres más 10 del código, 20 en total (FR-010). Un
registro `public.pet_codes` (solo el código) guarda cada código usado y no se borra con el animal:
el trigger que asigna el código lo inserta ahí y reintenta si ya existía, así que un código nunca
se repite ni se reusa. Las publicaciones de #53 reciben el suyo en la migración.

**Por qué**: al azar no se puede adivinar ni recorrer (FR-010); sin nombre, no cambia al editar;
sin `i l o u`, se dicta y se copia a mano sin confundir letras. 50 bits alcanzan de sobra para
un sitio de miles de animales.

**Descartado**: el `uuid` (36 caracteres, rompe los 20); `luna-123` de docs/06 §URLs (cambia con el
nombre o miente después de editarlo); un número correlativo (dice cuántas publicaciones hay y se
recorre).

## R4. El listado: filtros en la dirección, tandas por cursor, un solo dueño del estado

**Decisión**:
- `/animales` lee los filtros de `searchParams` con claves en español y valores en slug:
  `especie=perro,gato`, `sexo=`, `tamano=`, `edad=cachorro,joven,adulto,mayor`,
  `departamento=canelones,…`, `castrado=si`, y `mostrar=48…240`. `parseListingQuery` (pura, con
  test) normaliza: ignora claves y valores desconocidos, repetidos y el orden; un filtro con todas
  sus opciones es como ninguno (salvo castrado, que tiene una); `mostrar` solo acepta múltiplos de
  24 entre 48 y 240. `listingHref(filters, shown)` arma siempre la misma dirección canónica, sin
  nada más (los agregados de otras apps, como `fbclid`, no sobreviven). Es el **único** validador de
  los filtros: lo usan la página y la ruta de tandas; no hay un schema zod aparte que lo repita.
- El servidor arma la primera vista (24, o `mostrar`) con `listed_pets`, que devuelve el total con
  los filtros (`count(*) over ()` antes del límite) y una fila de más para saber si hay «Ver más».
  El total se escribe en el servidor con el plural ICU de `messages/es.json`.
- **Tandas por una ruta GET, no por Server Actions**: `GET /api/animales?{filtros}&despues={cursor}`
  (Route Handler, `src/app/api/animales/route.ts`) devuelve JSON con las cards **ya armadas en el
  servidor** —cada una con su `alt`, «2 años», la zona y «Urgente» traducidos— más, si no vino
  cursor, el total y su texto. El cursor es `(published_at, code)` de la última cargada: la tanda
  trae las más viejas que él, así que no repite ni saltea aunque se publique una nueva (queda más
  arriba) o una deje de estar a la vista (no vuelve). Next despacha las Server Actions de a una y
  no se pueden abortar; con `fetch` + `AbortController`, cambiar un filtro cancela de verdad un
  «Ver más» en curso, y la falla sin conexión es un `catch` que la pantalla muestra (FR-016).
- **Un solo dueño del estado del lado del cliente**: `ListingController` (hoja cliente) envuelve el
  formulario de filtros, el total y la grilla, porque lo que FR-015, FR-016 y FR-017a piden que
  vaya siempre junto —las marcas, el total, «Sacar los filtros», las cards, el cursor y la
  dirección— cambia a la vez. Recibe del servidor la primera vista y todos los textos ya
  traducidos por props (el patrón del proyecto; `ErrorTextsProvider` sigue siendo el único
  provider). Un contador de pedidos descarta lo que llega de un cambio anterior. La dirección se
  reemplaza con `history.replaceState` (sin sumar un paso atrás, FR-017a) y lleva `mostrar=N` hasta
  240 después de cada «Ver más».
- **Sin ejecutar nada**: el formulario es `<form method="get" action="/animales">` con casillas y
  «Ver resultados» (que el controlador esconde al hidratar), y «Ver más» es un enlace a
  `listingHref(filters, shown + 24)#a-{shown + 1}`, que el servidor arma entero desde el principio
  (FR-019 lo acepta así). Con 240 a la vista, sin ejecutar, «Ver más» no aparece y en su lugar se
  dice «Mostramos los primeros 240. Usá los filtros para ver otros.».
- **Si falla al abrir**: la página captura el error de `listed_pets` y dibuja el controlador en
  estado de error —los filtros a la vista, el aviso y «Reintentar», que vuelve a pedir la tanda—.
  `error.tsx` queda para lo inesperado (y lleva `ErrorTextsProvider` en el layout de `(public)`).

**Por qué el límite cliente es el controlador y no la card**: docs/08 pide `"use client"` en la
hoja más chica. Acá la hoja más chica que tiene el estado es la que junta filtros, total y grilla:
partirla deja dos hojas hermanas sin canal, y un total del servidor que no cambia al filtrar. Las
cards que dibuja son presentacionales (`PetCard`, `PetPhoto`, `ZoneLabel`, `UrgencyTag`, sin
imports de servidor), así que se renderizan igual en el servidor —la primera vista llega en el
HTML— y en el cliente; lo que se suma al JS inicial es poco y lo mide el e2e de rendimiento.

**Volver atrás al mismo lugar** (FR-016): el controlador guarda en `sessionStorage`, por dirección
exacta, una foto de su estado (cards cargadas, cursor, total, hora) cada vez que cambia, y al tocar
una card marca «vuelvo» junto con la posición de la página. Al montar, si la dirección actual tiene
una foto con «vuelvo» de menos de 50 minutos (las URLs firmadas duran una hora, R2), la repone —las
mismas cards, en el mismo lugar— y borra la marca; si no, usa lo que trajo el servidor. En un
«volver atrás», Next reusa su caché del router aunque `staleTimes.dynamic` sea 0 (así lo documenta
`staleTimes`: no afecta la navegación atrás y adelante, para no perder el scroll), así que la
página no vuelve a renderizarse en el servidor y `listing_viewed` no se registra otra vez; la foto
de `sessionStorage` es la que manda, porque la caché del router guarda el árbol de antes de los
`replaceState`. Es una comodidad de la pestaña, no una marca de quien mira: no viaja, muere con la
pestaña y no se mide (FR-023). El e2e 2 lo comprueba.

**Descartado**: *OFFSET* (salta o repite cuando entra una nueva, y se vuelve lento, skill de
Postgres `data-pagination`); *el cursor en la dirección* (un enlace copiado empezaría por la mitad,
FR-017a); *Server Actions para leer* (en cola y sin cancelar, ver arriba); *`router.replace` al
filtrar* (una navegación que falla termina en navegación dura: sin conexión, la página de error
del navegador en vez de lo que se veía); *Server Actions que devuelven JSX* (mismo problema de cola,
y el árbol devuelto no se puede guardar en `sessionStorage` para volver atrás).

## R5. La edad para filtrar, en la base y con la misma cuenta que la ficha

**Decisión**: `private.pet_age_months(value, unit, as_of, today)` hace en SQL exactamente lo que
`ageOn` y `monthsBetween` hacen en `lib/pets/age.ts` (el aniversario al último día del mes que no
tiene ese día, en el día de Uruguay de `public.uruguay_today()`). Los tramos viven en
`lib/pets/rules.ts` (`AGE_BANDS`, en meses: cachorro `[0,12)`, joven `[12,36)`, adulto `[36,96)`,
mayor `[96,)`) y llegan a `listed_pets` como `int4range[]`, así que la regla tiene una sola fuente.
Un test de `tests/db` compara la edad en meses de la base con la de `ageOn` en una tabla de casos
(31 de enero, 29 de febrero, fin de año, 11 y 12 meses, 2→3 años, 7→8 años).

**Por qué**: filtrar en el servidor después de traer todo rompe «Ver más» por cursor y el total; y
la edad no se guarda avanzada (#53, FR-010), así que la base la calcula al filtrar.

**Descartado**: `age()` de Postgres (cuenta los meses distinto en los fines de mes, y la ficha
diría una edad y el filtro otra); una columna con la fecha de nacimiento estimada (cambia el
modelo de #53 sin necesidad).

## R6. La vista previa: metadatos en la ficha, y una imagen armada con `next/og` y `sharp`

**Decisión**:
- La ficha exporta `generateMetadata`: para un animal a la vista, `og:title` y `twitter:title`
  «{nombre} en adopción», `og:description` la zona, `og:image` la ruta propia
  `/animales/{code}/imagen?v={versión}` (1200 × 630), `twitter:card=summary_large_image`. Para uno
  que no está a la vista o no existe, y para el listado: título con el nombre del sitio y
  «Animales en adopción», sin imagen (FR-012). La `versión` es un hash corto de la portada, el
  nombre y la zona: cambia cuando cambian, y WhatsApp y Facebook piden la imagen nueva (FR-011).
- La ruta `imagen` (Route Handler, runtime Node) llama `pet_share_card` con el cliente anónimo,
  firma la portada `full` (una vertical 4:5 mide 1280 de ancho: no se agranda), la baja, la pasa de
  WebP a JPEG con `sharp` y arma con `ImageResponse` la portada entera, pegada con cinta en el
  centro, con el nombre en voz de afiche a un lado y la zona al otro, como pide FR-011 y como es el
  cartel (docs/10: nunca texto sobre la foto; el diseño, en plan §Vista previa). `ImageResponse` emite PNG, que para una foto de 1200 × 630 ronda el
  mega: la salida pasa otra vez por `sharp` a JPEG con calidad 80 y, si pesa más de 300 KB (lo que
  WhatsApp suele descartar), a 70 y a 60. Un animal que no está a la vista o no existe responde
  404. `Cache-Control: no-store`: la versión en la dirección ya hace el trabajo de
  cachear bien.
- `sharp` **0.35.5** (la última, verificada el 2026-09-28; ya viene en el árbol como dependencia
  opcional de Next) pasa a dependencia directa y se registra en `docs/07-stack.md`.
- La tipografía de la imagen es la instancia estática Condensed ExtraBold de Bricolage Grotesque
  (OFL), la voz de afiche de `.afiche` (ancho 75, peso 800), un `.ttf` junto a la ruta `imagen/`
  con su licencia (la única que lo usa): `next/og` no lee `woff2` ni fuentes variables.

**Por qué**: `next/og` (el `ImageResponse` de docs/07) solo decodifica PNG, JPEG, GIF y SVG
(verificado en `next/dist/compiled/@vercel/og`: la lista de soportados no tiene WebP), y todas las
fotos del sitio son WebP (#53). `sharp` es la librería que Next ya usa para imágenes y la única que
decodifica WebP en Node sin armar un pipeline a mano; `@jsquash/webp` decodifica, pero después
habría que codificar PNG con otra librería.

**Descartado**: *la portada WebP directo como `og:image`* (no lleva nombre ni zona, que docs/03 §3
pide en la imagen; y el soporte de WebP en las vistas previas de Facebook no es parejo); *generar
un JPEG al publicar* (cambia el flujo de #53 y habría que regenerarlo al editar).

## R7. Los bots de vista previa y los buscadores

**Decisión**: `robots.ts` sigue cerrando todo a los buscadores, y abre `/animales/` solo a los
lectores de vistas previa (`facebookexternalhit`, `Facebot`, `WhatsApp`, `Twitterbot`,
`TelegramBot`). El listado y la ficha llevan `robots: { index: false, follow: false }` mientras
`INDEXING_ENABLED` (nueva constante en `lib/config.ts`) sea `false`: M5 cambia una constante y
`robots.ts` lee la misma.

**Por qué**: el crawler de Facebook respeta `robots.txt`, y con `disallow: /` no arma la vista
previa (FR-024 pide que no aparezcan en buscadores pero que la vista previa funcione). WhatsApp la
arma desde el teléfono de quien pega el enlace y no mira `robots.txt`, pero se lo nombra igual.

## R8. «Compartir»: el dedo o el puntero

**Decisión**: hoja cliente `ShareButton`. Si `matchMedia('(pointer: coarse)')` (la forma principal
de usar el equipo es el dedo) y existe `navigator.share`, abre las opciones del sistema con
`{ title: '{nombre} en adopción', url }`. Si no —computadora, o `share` rechazado por algo que no
es `AbortError`—, `navigator.clipboard.writeText(url)` y el `Toast` «Enlace copiado». Si el
portapapeles falla, un `Sheet` con el enlace en un campo de solo lectura, seleccionado. Mientras
las opciones están abiertas o el aviso está a la vista, el botón no vuelve a disparar. La `url` es
siempre `APP_URL + petPath(code)`, nunca la dirección de la barra. Se dibuja en el servidor con
`invisible` —ocupa su lugar, no se puede tocar ni leer— y se revela al hidratar: sin ejecutar no
aparece (spec, Edge Cases), y al hidratar no mueve nada de la pantalla (CLS).

**Por qué `pointer: coarse` y no `navigator.share`**: Chrome en Windows y Safari en macOS tienen
`navigator.share`; la historia pide que en una computadora copie (spec, Assumptions).

## R9. La medición

**Decisión**: cuatro momentos nuevos en `lib/analytics/events.ts`: `listing_viewed`,
`listing_filter_used { filter, option }`, `pet_viewed { origin: 'listing' | 'outside' }`,
`pet_share_tapped { from: 'pet' | 'my_pets' }`. Ninguno lleva el código del animal ni la cuenta; la
marca de visita de #9 es la única que acompaña (FR-023).

Qué se dispara lo deciden funciones puras con test, y la página o la ruta solo las llaman:

- `petViewEvent({ visibility, isOwner, referer, host, userAgent })` → `pet_viewed` con su origen, o
  nada si el animal no está a la vista, si quien mira es el publicador, o si quien pide es un lector
  de vista previa. El origen es `listing` solo si el `Referer` es `/animales` del mismo sitio; todo
  lo demás es `outside`.
- `listingViewEvent({ userAgent })` → `listing_viewed` o nada (lector de vista previa).
- `addedFilterOptions(before, after)` → un `listing_filter_used` por opción que se sumó; ninguno al
  desmarcar ni al abrir un enlace que ya trae filtros. Lo que manda el controlador en `sumadas` pasa
  por `parseAddedOptions`, que lo valida contra el vocabulario de `parseListingQuery` y lo devuelve
  en claves de dominio en inglés (`{ filter: 'species', option: 'cat' }`): nunca texto libre del
  cliente en una propiedad (`lib/analytics/events.ts`).
- `isPreviewBot(userAgent)` → la misma lista de lectores de vista previa que abre `robots.ts`
  (R7), en `lib/seo/preview-bots.ts`, una sola fuente para los dos.

Dónde se llaman: `listing_viewed` y `pet_viewed`, en el render del servidor (así cuentan sin
ejecutar nada). `listing_filter_used`: con el navegador que ejecuta, en la ruta de tandas cuando el
controlador manda las opciones sumadas (`&sumadas=especie.gato`); sin ejecutar, en el render de la
página cuando el `Referer` es el listado con otros filtros (recargar un listado filtrado reenvía el
mismo `Referer` y cuenta otra vez: sesgo chico y aceptado). `pet_share_tapped`: la hoja
`ShareButton` llama la Server Action `trackShare` (la única acción de la historia: es una escritura
de medición, sin respuesta que la persona espere).

**Prefetch y volver atrás**: las cards usan `Link` con el prefetch por defecto; la ficha tiene
`loading.tsx`, así que el prefetch se detiene ahí y no renderiza la página (no dispara `pet_viewed`).
Volver atrás usa la caché del router (R4) y no renderiza. **Pestaña vieja**: `StaleImagesRefresh`
(R11) vuelve a pedir la página después de más de 50 minutos fuera; eso cuenta como otra vista, que
es lo que es: la persona volvió a mirar una hora después. Sesgo aceptado.

## R10. El publicador sin nivel 1

**Decisión**: `pet_by_code` devuelve `visibility: 'listed' | 'hidden'` y, si quien pide es el
publicador, `is_owner: true` con todos los datos aunque esté `hidden`. Qué pantalla ve cada uno lo
decide `petPageState(result, { signedIn, isLevelOne })` (pura, con test): `missing` (sin fila →
`notFound()`), `unavailable` (oculto y no es el publicador; con «Entrar» si no hay sesión),
`own_hidden` (el publicador sin nivel 1: su ficha con `HiddenFromPublicNotice` y sin «Editar»),
`own_listed` (su ficha con «Editar») y `listed` (cualquier otra persona). Una falla de la base no
llega a esta función: la página la deja subir a `error.tsx`, que nunca dice «no está publicado»
(FR-009). «Mis animales» muestra `HiddenFromPublicNotice variant="list"` arriba de la lista cuando
la cuenta no tiene nivel 1, con el camino de #10 (`verifyPath`), usando el `phoneStatus` que ya
calcula la puerta.

## R11. Las fotos de una pestaña vieja

**Decisión**: las URLs firmadas vencen a la hora (R2). En la ficha, la hoja `StaleImagesRefresh`
guarda la hora del render y, en `visibilitychange` (a visible) o `pageshow` con `persisted`, si
pasaron más de 50 minutos, llama `router.refresh()`: el servidor vuelve a firmar (y cuenta una
vista, R9). En el listado lo hace el propio `ListingController`: vuelve a pedir a la ruta de tandas
las mismas cards (`mostrar` = las que tiene) con URLs nuevas, sin disparar nada. Quien vuelve a la
pestaña de WhatsApp al día siguiente ve fotos (FR-018).

## R12. El diseño del listado en pantallas anchas: «el poste» se reabre

**Decisión**: desde 1024, los filtros del listado van en una columna a la izquierda de la hoja
(«el poste», descartado el 2026-09-20 con la nota «se reabre cuando el listado exista»), y la grilla
a la derecha en tres columnas. Debajo de 1024, los filtros son filas de tiritas arriba de la grilla,
como dice docs/10 §Layout. Lo que eso pide, dicho entero:

- **Un ancho con nombre** para la columna: `--container-rail` 256 px, en la configuración del tema
  de `globals.css` y en docs/10 §Pantallas anchas, junto a `--container-page` y
  `--container-listing` (no es un token, como ellos).
- **`ChipGroup` con `orientation`**: `horizontal` (la de siempre, una fila que se desplaza) o
  `vertical` (una columna de tiritas, cada una a lo ancho de la columna; la arrancada se inclina y
  se corre 8 px a la derecha en lugar de bajar). No se parte en dos en ninguna de las dos: es una
  sola tira en otra dirección. Su fila de docs/10 se actualiza.
- **El mismo contenido en todos los anchos**: especie, edad y departamento a la vista, y sexo,
  tamaño y castrado en un `<details>` nativo «Más filtros» (abierto si alguno está marcado), igual
  en el teléfono y en la columna; la `legend` de cada grupo sigue `sr-only` en los dos anchos (las
  opciones se explican solas: «perro», «cachorro», «Canelones»). A 390 así entra la primera fila de
  portadas arriba del pliegue (plan §Diseño).
- **La columna no es `sticky`**: con los 19 departamentos en vertical es más alta que una ventana
  de 800; fija, dejaría lo de abajo fuera de alcance.
- **`PetWall` con `columns`**: `wall` (dos, tres desde 768, cuatro desde 1024: «Mis animales») y
  `beside-rail` (dos, tres desde 768 y tres desde 1024, porque la columna de filtros ocupa el
  lugar de la cuarta).

**Por qué**: con seis grupos de tiritas en filas de 1200 px, «perro» y «gato» quedarían de 600 px
cada una; la nota del descarte pedía justamente esto. Es agregar una columna, no rediseñar
(principio 3): el mismo componente en otra dirección.

## R13. Los datos de la ficha: todos, en palabras

**Decisión**: `PetFacts`, una lista de definiciones con cada dato de FR-006 en palabras
(«Castrado: sí», «Convive con gatos: no se sabe»). Reemplaza en la ficha a `PetAttributes` de
docs/10 («solo las verdaderas»), que no alcanza: la historia pide mostrar también el «no» y el «no
se sabe». La fila de docs/10 se actualiza.

**Revisión (2026-09-28)**: siguen todos, pero dichos como frases del cartel en dos renglones («Tamaño
chico. Castrado. Vacunas al día. Sin chip.» y «Convive con niños y gatos. Con perros, no se sabe.»), no en
una lista de dos columnas: siete renglones de etiqueta y valor eran una tabla (docs/10 §Principios
1) y bajaban la nota del publicador. Detalle en docs/10, fila `PetFacts`.

## R14. Qué se prueba en la base y qué en el navegador

**Decisión**: la regla de visibilidad, lo público del publicador, el código y la edad se prueban
en `tests/db` contra la base local (Vitest). El listado real mezcla animales de otras pruebas y de
corridas anteriores, así que las pruebas de orden y «Ver más» crean sus animales con
`published_at` en una ventana futura propia (año 2999 más un desplazamiento al azar), que los deja
primeros del listado, y los borran al terminar. Los e2e comprueban lo que solo existe en el
navegador (compartir, volver atrás, sin JavaScript) con animales propios de la corrida.

## R15. La transición de la card a la ficha, pospuesta

**Decisión**: esta historia no suma la View Transition entre la card y la ficha (`--dur-page` y el
`view-transition-name` de la portada en docs/10). **Por qué**: en Next 16.3 sigue detrás de
`experimental.viewTransition`, y la card vive en una lista que el cliente reemplaza al filtrar, lo
que obliga a nombrar cada portada con su código y a probar el cruce con la vuelta atrás de R4. No
cambia ningún paso del funnel. Se anota en `known-limitations.md` (KL-57-2) con «Se reabre cuando»
la opción salga de experimental o una historia de pulido la tome.

## R16. Los lectores de vista previa no son visitas

**Decisión**: `isPreviewBot` (R9) deja afuera de la medición los pedidos de `facebookexternalhit`,
`Facebot`, `WhatsApp`, `Twitterbot` y `TelegramBot`: cada vez que alguien pega el enlace, esos
lectores piden la ficha, y contarlos como `pet_viewed` «desde afuera» inflaría el dato de SC-009.
