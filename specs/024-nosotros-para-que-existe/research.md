# Research: «Nosotros»

Decisiones del plan, cada una con lo que se descartó. Historia #201, spec en `spec.md`.

## R1. La página es una página de contenido, armada con las piezas de «Preguntas y respuestas»

**Decisión**: `QuestionLayout` (el `h1` arriba; la lectura en `--measure` a la izquierda y el cierre
a la derecha, fijo al desplazar, desde 1024), `QuestionArticle` (la bajada en `--text-lg` y las
secciones) y `QuestionSection` (el `h2` y sus párrafos, con un bloque y un enlace opcionales).
`QuestionFooter` pasa a recibir `related` opcional: «Nosotros» cierra con la fecha y la tirita, sin
preguntas relacionadas.

**Por qué**: docs/10 §Pantallas anchas (decisión 2026-10-09, historia #8) fija cómo va «una
página de contenido»; «Nosotros» es una. Armarla con otras piezas sería una segunda forma de lo
mismo (regla de dos de docs/08) y el revisor de diseño la marcaría.

**Descartado**: renombrar `QuestionLayout` a un nombre genérico en esta historia (toca la #8 entera
por un nombre, sin cambiar conducta); un `AboutLayout` propio (duplica la grilla).

## R2. El texto vive en `messages/es.json`; la estructura y las cifras, en `src/lib/about/`

**Decisión**: namespace `about` con `title`, `card`, `lead`, `sections.<id>.title`, sus párrafos
`p1…pN`, la lista `different.i1…i5`, `brand.image`, `brand.levels`, `updated`, `action` y `error`.
`src/lib/about/page.ts` declara `ABOUT_PATH = '/nosotros'`, `ABOUT_UPDATED_ON` (el día en que cambió
el texto, `YYYY-MM-DD`, a mano como `updatedOn` de las preguntas), la forma de las secciones y
`ABOUT_FACTS = { followUpDays: FOLLOW_UP_DAYS }`. El nombre del sitio viaja como `{app}` desde
`APP_NAME`.

**Por qué**: FR-015 (lo que se afirma es lo que el sitio hace) y FR-017 (el nombre en un solo lugar).
Los 30 días salen de la regla que el sitio cumple: si cambia, la página cambia sola, como
`QUESTION_FACTS` (research R2 de la #8). Un test recorre `about` y falla si un texto trae un
dígito o el nombre del sitio escrito a mano (FR-016, FR-017).

**Descartado**: sumar «Nosotros» al registro de preguntas (`QUESTION_PAGES`): no es una pregunta,
no va en el índice ni tiene relacionadas, y su acción no es una de las de docs/08.

## R3. La marca: `BrandMark` `principal` a 128 px, dentro de un `role="img"` con su descripción

**Decisión**: un componente de dominio nuevo, `BrandMeaning` (`components/about/`), dibuja la
parte de la marca: el `h2`, y debajo una grilla de dos columnas desde 1024 (el dibujo a la
izquierda, `auto`; el texto a la derecha) que en el teléfono y hasta 1023 es una columna con el
dibujo arriba. El dibujo es `BrandMark version="principal"` de 128 px de alto (`h-32`), en
`text-ink`, adentro de un `span role="img" aria-label={texts.image}`; `BrandMark` sigue siendo
`aria-hidden`, así no se anuncia dos veces.

**Por qué**: FR-009 pide el dibujo de 32 px o más; a 128 px se ven la minucia y las cuatro crestas,
y es la vez que más grande aparece la marca en el sitio, que es lo que la parte quiere mostrar. El
`aria-label` es FR-010: el lector anuncia «Una pata con una huella digital en la almohadilla». El
SVG va inline en el HTML del servidor: no espera una descarga, tiene su caja fija (FR-024, no corre
el texto) y se lee sin JavaScript.

**Aire**: docs/10 §Marca pide el 28 % del alto alrededor (36 px a 128); el `gap` de la grilla es
`--space-10` (40) y arriba y abajo lo da el `gap` de la sección.

**Descartado**: `public/brand/marca-principal.svg` en un `img` (una descarga más, y FR-024 pide
que el texto no espere); `figure` con `figcaption` visible (la descripción es el texto de la parte
misma: repetirla debajo del dibujo sería decirlo dos veces); 192 px (en el teléfono empuja el texto
de la parte fuera de la primera vista sin mostrar más detalle).

## R4. «En qué se diferencia» es una `CheckList`; el resto, párrafos

**Decisión**: la bajada de la parte en un párrafo y las cinco diferencias en `CheckList` (el tilde
en yerba). «Para qué existe» y «Lo que no promete», párrafos. Sin listas numeradas: nada de esto
es una secuencia (docs/10 §Antipatrones).

**Por qué**: las cinco son lo que el sitio hace para dar confianza, y el verde es confianza
(docs/10 §Color). En párrafo, cinco hechos cortos se leen como folleto.

**Descartado**: `QuestionList` `taped` (la nota pegada es «lo que hay que reconocer», y la cinta
pegada sobre texto de lectura choca con §Recursos); cinco `Card` (tarjetas idénticas para todo,
§Principios 5).

## R5. El pie suma `about` al final de Confianza

**Decisión**: `FooterLinkId` suma `'about'`; `footerGroups` lo agrega último en `trust`. En el
alcance `help` (cuenta suspendida) no hay grupo Confianza, así que no aparece (FR-019).
`footer.links.about` = «Nosotros».

## R6. La tarjeta: la de la portada, con el título y la descripción de la página

**Decisión**: `generateMetadata` con `title` «Nosotros» (el layout le suma el nombre del sitio),
`description` = `about.card`, canónica `/nosotros`, `robots` con `INDEXING_ENABLED`, y
`siteShareMetadata` con la frase de la portada, como las preguntas (R5 de la #8). `robots.ts` suma
`ABOUT_PATH` a lo que los lectores de vista previa pueden leer: cerrado, el de Facebook no arma la
tarjeta (FR-021, SC-007).

**Descartado**: una imagen propia con la marca grande (otra ruta de imagen y su versión, por una
página que no es el centro del producto); JSON-LD `AboutPage` (docs/08 pide `Organization` y
`WebSite` en el layout, y `BreadcrumbList` donde hay jerarquía; esta página no la tiene).

## R7. Error, carga y cuenta suspendida

- **Error** (FR-023): `nosotros/layout.tsx` da su propio `PublicErrorCopyProvider` con
  `about.error.body` («No pudimos abrir esta página. Probá de nuevo.») y una salida a la portada;
  `PublicErrorCopy` suma un campo opcional `exit` (`{ href, label }`) y `nosotros/error.tsx` lo
  pinta debajo del reintento con `TextLink`, como `preguntas/error.tsx`. Sin esto, el límite de la
  zona pública dice «No pudimos traer tu perfil».
- **Carga**: sin `loading.tsx`. La página no trae datos de nadie; el servidor la arma con textos y
  un SVG, y un esqueleto se vería un instante y nada más (spec, Assumptions).
- **Cuenta suspendida** (FR-020): `redirectIfSuspended()` al principio de la página, como en
  `niveles`. `src/lib/auth/session-gate.test.ts` ya falla si una página pública no lo llama.

## R8. Qué se testea

- `src/lib/footer/groups.test.ts`: «Nosotros» último en Confianza; ausente en `help`. Es la regla
  de qué ve quién en el pie.
- `src/lib/about/page.test.ts`, contra `messages/es.json`: `ABOUT_UPDATED_ON` pasa `parseDay`;
  cada parte de `ABOUT_SECTIONS` tiene su `title` y exactamente sus `p1…pN` (y `i1…i5` en
  `different`), sin un `pN+1` sobrante, como `pages.test.ts` de la #8; ningún texto de `about`
  tiene un dígito (FR-016: las cifras llegan por parámetro) ni `APP_NAME` escrito (FR-017);
  `different.i4` usa `{followUpDays}` y `ABOUT_FACTS.followUpDays` es `FOLLOW_UP_DAYS`.
- `src/app/robots.test.ts`: los lectores de vista previa pueden leer `/nosotros` (SC-007): si se
  olvida, la tarjeta no se arma y nadie se entera.
- Sin e2e: la página no es uno de los 2-3 flujos críticos (docs/09 §Qué vale la pena testear). Lo
  que podría romperse sin que nadie lo vea —que la cuenta suspendida no la lea— ya lo cuida
  `session-gate.test.ts`; el orden de las partes, el nombre del dibujo y su posición a 390 y 1280
  los miran las capturas de `walk.mjs` y `design-reviewer`.
- Nada para `BrandMeaning` ni para la página: solo pintan (constitución §III).
