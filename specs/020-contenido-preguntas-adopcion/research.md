# Research — Contenido que responde las preguntas que frenan una adopción

Decisiones técnicas de la historia #8. Cada una: qué se eligió, por qué y qué se descartó.

## R1. Dónde vive el contenido: `messages/es.json` + un registro tipado en `lib/questions/`

- **Decisión**: el texto de las cinco páginas vive en `messages/es.json`, namespace `questions`
  (regla 3 de `CLAUDE.md`: ningún string visible fuera de ahí). La **estructura** —el slug, el grupo,
  la acción, las relacionadas, la fecha de última actualización, las secciones y cuántos párrafos
  tiene cada una, y las fuentes oficiales con su URL— vive en un registro tipado,
  `src/lib/questions/pages.ts`, sin texto visible. La página arma sus claves desde el registro
  (`questions.<slug>.answer`, `questions.<slug>.sections.<id>.title`, `…p<n>`).
- **Por qué**: el registro es lo que las reglas de la spec necesitan para comprobarse sin leer JSX
  (grupo, relacionadas, una sola acción, fuentes oficiales, fecha), y el texto queda donde lo busca
  i18n. Un párrafo es una clave: el conteo de oraciones de FR-002 se hace sobre la clave `answer`.
- **Descartado**: MDX o Markdown por página (dependencia nueva para cinco páginas, y saca el texto
  de `messages/`); una tabla en la base (FR-016: no se edita desde el sitio, y sumaría RLS, queries y
  migración para un texto fijo); un arreglo en `messages` leído con `t.raw` (pierde el tipado de
  claves de `tests/gates/typed-keys.test.ts`).

## R2. Las mismas palabras que «Qué dice cada nivel» y «Qué hacemos con ellas»: las mismas claves

- **Decisión**: «Cómo se verifica» no copia texto. Su sección de niveles reusa `LevelStep` con las
  claves `verification.levels.asks_N`, `says_N` y `level`, igual que `/niveles`; su sección de la
  cédula lee `identity.request.what_body`, `use_nobody`, `use_deleted`, `use_never`, `use_who`,
  `use_withdraw` y `use_kept` con la misma función que arma los textos del consentimiento
  (`identityConsentTexts`, extraída de `identityRequestFormTexts` en
  `app/[locale]/_components/identity-texts.ts`).
- **Por qué**: FR-009 y SC-003 piden palabra por palabra, y la decisión del 2026-10-09 dice que dos
  textos que explican lo mismo terminan contradiciéndose. Con las mismas claves no pueden.
- **El compromiso y los 30 días** siguen la misma regla: la página dibuja las cláusulas reales
  (`COMMITMENT_CLAUSES` de `lib/adoptions/commitment.ts` con las claves
  `adoptions.commitment.clauses.*`), con nombres de ejemplo inventados
  (`questions.example.adopter`, `publisher`, `pet`) y la nota «El ejemplo es inventado.».
- **Las cifras no se escriben en el texto**: los párrafos que dicen un número lo reciben como
  parámetro ICU desde las constantes que el sitio usa de verdad, en un solo objeto
  `QUESTION_FACTS` (`lib/questions/facts.ts`): `IDENTITY_EXPECTED_REVIEW_DAYS` (2),
  `IDENTITY_REVIEW_TTL_DAYS` (7), `IDENTITY_REJECTION_CAP` (3) e `IDENTITY_REJECTION_WINDOW_DAYS`
  (30) de `lib/verification/rules.ts`; `FOLLOW_UP_DAYS` (30) y `FOLLOW_UP_MAX_PHOTOS` (3) de
  `lib/follow-ups/rules.ts`. Si una regla cambia, la página cambia sola.
- **La fecha** (casos borde): `tests/questions/shared-texts.test.ts` guarda, por página, el hash de
  lo que toma de afuera —en «Cómo se verifica» las diez claves de niveles y cédula y las cuatro
  cifras de identidad; en «El compromiso y los 30 días» las seis cláusulas y las dos cifras del
  seguimiento— junto con su `updatedOn`. Si lo de afuera cambia y la fecha no, el test falla con
  «actualizá `updatedOn` de <slug> y el hash». Es la forma observable de «no se puede completar la
  entrega sin cambiar la fecha».
- **Descartado**: copiar el texto a `questions.*` y comparar en un test (dos fuentes, una deriva
  posible entre corridas); derivar la fecha del historial de git (en `next build` no hay historia
  confiable y el texto puede cambiar sin cambiar la página).

## R3. Rutas: `/preguntas` y `/preguntas/<slug>` en la zona pública

- **Decisión**: `src/app/[locale]/(public)/preguntas/page.tsx` (el índice) y
  `src/app/[locale]/(public)/preguntas/[slug]/page.tsx` (las cinco). Slugs fijos en el registro:
  `como-se-verifica`, `antes-de-entregar`, `que-exige-uruguay`, `reconocer-una-estafa`,
  `compromiso-y-seguimiento`. `generateStaticParams` no: las páginas leen la cookie de sesión
  (`redirectIfSuspended`, FR-007) y los encabezados (medición), así que son dinámicas como `/niveles`.
  Un slug que no está en el registro llama `notFound()`.
- **Por qué**: la zona `(public)` ya da la hoja `wall`, la cabecera y el pie, y el límite de error
  público sin next-intl en el cliente (presupuesto de JS). Una dirección corta en español, estable
  (FR-001), que no depende del nombre del sitio.
- **Barra final** (casos borde): Next ya redirige `/preguntas/x/` a `/preguntas/x`. Mayúsculas u otra
  palabra no matchean el registro → `notFound()`.

## R4. «No está»: `not-found.tsx` del segmento; el 410 de una retirada, cuando haya una

- **Decisión**: `preguntas/[slug]/not-found.tsx` dibuja `QuestionNotFound` (`HeadedEmptyState`
  «Esta página no está» y la tirita «Ver todas las preguntas» al índice). Un slug que no está en el
  registro llama `notFound()`. No se construye la respuesta de «ya no existe» para los buscadores
  de una página retirada: en esta historia no se retira ninguna (spec), y una rama sin ningún caso
  real es código que el mutation testing no puede sostener. Se anota en `docs/known-limitations.md`
  (KL nueva): retirar una página exige sumar esa respuesta, como una publicación que expira
  (docs/08 §Encontrable), y mientras tanto una retirada se ve como una que no existe, que es lo que
  la spec pide para la persona.
- **Supuesto del plan**: la spec pide que a los buscadores una retirada les diga «ya no existe»; como
  ninguna se retira en esta historia, esa parte queda como limitación aceptada y no como código.
- **Tarjeta de una dirección que no existe**: `generateMetadata` con un slug desconocido devuelve
  solo `title: APP_NAME`, sin `openGraph` propio, como la ficha de un animal que no existe (#57).

## R5. El enlace compartido: `openGraph` con la imagen de la portada y robots abierto a las vistas previas

- **Decisión**: cada página exporta `generateMetadata` con `title` = la pregunta, `description` =
  `questions.<slug>.card` (≤ 160 caracteres, comprobado en el test del registro), `alternates.canonical`
  absoluta (`/preguntas/<slug>`, docs/08), `robots: { index: INDEXING_ENABLED, follow:
  INDEXING_ENABLED }`, y `openGraph`/`twitter` con la imagen de la portada (`/imagen?v=…`, misma
  función `siteShareVersion` que `(public)/page.tsx`). El índice igual, con
  `questions.index.title` y `questions.index.card`. `robots.ts` suma `QUESTIONS_PATH` (`/preguntas`)
  a la lista `allow` de `LINK_PREVIEW_AGENTS`.
- **Por qué**: FR-040 y FR-041; la excepción de `robots.txt` para vistas previas ya existe para
  `/animales` (decisión 2026-09-28, #57) y la decisión del 2026-10-09 de la historia la extiende a
  estas páginas. La imagen de la portada no cuesta nada nuevo: `/imagen` ya está abierta.
- **Extracción**: el armado de `openGraph`+`twitter` con la imagen del sitio se repite ahora tres
  veces (portada, índice, página) → `siteShareMetadata({ title, description })` en
  `src/lib/og/site-share-metadata.ts` (regla de dos de docs/08), y la portada pasa a usarla.
- **Descartado**: una imagen por página (`next/og` por slug): peso y trabajo sin decir nada que la
  pregunta no diga (Assumptions de la spec).

## R6. Datos estructurados: `BreadcrumbList` y `Article` a mano

- **Decisión consciente**: mientras `INDEXING_ENABLED` sea `false` estos bytes no hacen nada; se
  ponen ahora porque docs/08 §Encontrable pide que cada pantalla nazca encontrable y no se le agregue
  SEO al final (son ~600 bytes de HTML, sin JS).
- **Decisión**: cada página lleva un `<script type="application/ld+json">` con `BreadcrumbList`
  (sitio → «Preguntas y respuestas» → la pregunta) y `Article` (`headline` = la pregunta,
  `dateModified` = `updatedOn`, `inLanguage: 'es-UY'`, `publisher` = `APP_NAME`). Un componente
  `QuestionJsonLd` (server, sin dominio visual) los arma desde el registro. Sin `FAQPage`
  (docs/08 §Descartado: cada página es una pregunta, no una lista de preguntas frecuentes).
- **Por qué**: docs/08 §Encontrable pide `BreadcrumbList` donde hay jerarquía y JSON-LD a mano; la
  fecha verificable es lo que los motores generativos citan (GEO). No suma JS: es un `script` inerte.

## R7. Medición: tres eventos nuevos, el origen por `referer`

- **Decisión**: en `src/lib/analytics/question-events.ts`, funciones puras como las de la portada:
  - `questionViewEvent({ slug, referer, host, userAgent })` → `question_viewed { page, origin }`,
    `origin ∈ 'index' | 'levels' | 'identity_request' | 'question' | 'link'`, por el `pathname` del
    `referer` del mismo `host` (`/preguntas`, `/niveles`, `/verificar-identidad`, `/preguntas/<otro>`);
    cualquier otra cosa, `link`. Un lector de vista previa (`isLinkPreview`) → `null`.
  - `questionsIndexViewEvent({ referer, host, userAgent })` → `questions_index_viewed { origin }`,
    `origin ∈ 'footer' | 'link'`: del mismo `host` es el pie (el único enlace al índice desde una
    pantalla que no es de contenido; desde una página de contenido también puede ser su enlace al
    índice cuando se quedó sin relacionadas, que cuenta como pie: se anota en el código).
  - `questionActionEvent({ referer, host, destination })` → `question_action_used { page }` solo si
    el `referer` es una página de contenido del mismo `host` **y** `destination` es
    `ACTION_PATH[page.action]`: tocar «Animales en adopción» en la cabecera mientras se lee «Antes de
    entregar» (acción: publicar) no es la acción de esa página y no cuenta. **Límite aceptado**: en
    las dos páginas cuya acción es «Ver animales en adopción», el enlace «Animales en adopción» de
    la cabecera lleva al mismo destino y no se distingue por `referer`; cuenta como la acción. Se
    descartó marcar el enlace con un parámetro porque el listado redirige a su dirección canónica y
    la marca quedaría en la dirección que la gente comparte. Va a `docs/known-limitations.md` (T041)
    y el test fija el comportamiento. Se dispara en la pantalla de destino, antes de la puerta de ingreso o de
    teléfono, como `home_publish_tapped` (research R6 de la #61): en `/mis-animales/publicar`,
    `/verificar-identidad` y `/animales`. Dónde exactamente: en `/verificar-identidad`, después de
  `setRequestLocale` y antes de `requireProfile` (que manda a ingresar a quien no tiene sesión); en
  publicar, junto a `homePublishTapEvent`, antes de `requireVerifiedPhone`; en `/animales`, junto a
  `listingViewEvent`. `proxy.ts` no redirige por sesión (solo i18n, sesión y la marca de visita),
  así que el pedido con el `referer` de la página llega siempre a la ruta y el toque cuenta también
  sin sesión, que es el caso más común de quien llega por un enlace compartido.
  El slug viaja como `page` (`QuestionSlug`, unión cerrada en `events.ts`); nunca la dirección.
- **FR-052**: no hace falta un evento nuevo: `question_viewed { origin: 'identity_request' }` y los
  de #11 (`identity_request_started`, `identity_consent_accepted`, `identity_request_sent`) llevan
  la misma marca de visita (`track`), y la comparación se hace uniendo por visita en la herramienta
  de medición de M5.
- **Prefetch**: los enlaces a las páginas y al índice van con `prefetch={false}`: el render del
  servidor registra la apertura, y una precarga contaría una visita que no pasó (como Opinar).
- **Descartado**: un `?desde=` en cada enlace (ensucia la dirección que la gente copia y comparte, y
  un enlace copiado con `?desde=pie` mentiría el origen); medir en el cliente (JS en una pantalla
  pública que hoy no lo necesita).

## R8. El enlace del pedido de identidad: solo antes de aceptar

- **Decisión**: `ConsentBody` se exporta como `IdentityConsentBody`, **sin directiva y sin hooks**
  (hoy ya no los tiene): renderiza en el servidor cuando lo importa «Cómo se verifica» y viaja en el
  bundle del formulario cuando lo importa `IdentityRequestForm` (cliente), como hoy. El JS de
  `/verificar-identidad` no sube salvo el enlace. `IdentityConsentTexts` suma `learnMore?: { label:
  string; href: string }`. `IdentityConsent`
  lo dibuja como `TextLink` `block` debajo de la lista de «Qué hacemos con ellas», **solo** cuando
  `accepted` es falso (después de aceptar, el cuerpo se ve dentro de «Leer de nuevo» y ahí no va:
  ir y volver perdería las fotos elegidas, casos borde de la spec). Es un `next/link` común en la
  misma pestaña, con `prefetch={false}`.
- **Volver** (US3 escenario 2): la vista de pedir arranca sin aceptar (`accepted` inicial `false`),
  así que volver atrás con el navegador la vuelve a dibujar en el mismo paso. Sin botón «Volver»
  en la página (Assumptions de la spec).

## R9. El pie: un tercer renglón, apagado en la pantalla de cuenta suspendida

- **Decisión**: `SiteFooter` suma la prop `questions: Line | null`; el renglón va **primero**
  («¿Dudas antes de adoptar o de dar en adopción?» con «Preguntas y respuestas»), después Opinar y
  el WhatsApp. `PaperFrame` recibe `questions?: boolean` (por omisión `true`); el layout
  `(suspended)` pasa `questions={false}`. El enlace es un `NavLink` `prefetch={false}` (marca
  `aria-current` en el índice).
- **Por qué primero**: es el único de los tres que lleva a contenido del sitio y no a escribirle al
  equipo; Opinar ya está arriba. docs/10 (fila `SiteFooter`) se actualiza con la decisión fechada.
- **Descartado**: atar el renglón a `menu={false}` (dos cosas distintas con la misma prop).

## R10. «Qué dice cada nivel»: un enlace más, sin tocar su texto

- **Decisión**: `LevelsExplanation` suma `more: { label: string; href: string } | null`, dibujado
  como `TextLink` `block` entre la escalera y «Volver». `/niveles` pasa
  `{ label: t('more'), href: questionPath('como-se-verifica') }` con la clave nueva
  `verification.levels.more` («Cómo se verifica y qué se muestra de cada persona»). FR-033: no
  cambia ninguna clave existente.

## R11. Fuentes oficiales: la lista de dominios vive en el registro y se prueba

- **Decisión**: `OFFICIAL_SOURCE_HOSTS = ['www.impo.com.uy', 'impo.com.uy', 'parlamento.gub.uy',
  'www.parlamento.gub.uy', 'www.gub.uy']` y `isOfficialSource(url)` en
  `src/lib/questions/sources.ts` (HTTPS y host exacto; `www.gub.uy` es el portal del Estado, donde
  publican el MGAP y el INBA). Una intendencia tiene dominio propio (`montevideo.gub.uy`): si Build
  necesita una norma departamental, suma ese host exacto a la lista y a su test; nunca `*.gub.uy`. Cada fuente del registro se declara con su URL y la clave
  de su etiqueta; el test del registro falla si una no es oficial.
- **La comprobación** (casos borde «Cada afirmación legal se comprueba»): `sources.md` en el
  directorio de la feature, escrito en Build, con una fila por dato legal: el dato, la URL y la cita
  textual de la norma que lo respalda, y la fecha de consulta. Es lo que lee el revisor (SC-004).
- **Pistas para Build** (no son hechos todavía, hay que leer la norma en IMPO): la Ley 19.889
  (art. 388 según la prensa) y el Decreto 353/023 tratarían la identificación con microchip y el
  registro en el RENAC del INBA; la castración tendría campañas del INBA y sanciones según la prensa
  de 2023. Ninguna de esas notas es fuente: si la norma no se puede leer en IMPO o en el Parlamento,
  el dato no se afirma (spec, casos borde).

## R12. Estados: cargando, error y vacío

- **Cargando**: `preguntas/loading.tsx` con `QuestionSkeleton` (el título y tres renglones en
  `Skeleton`, con la forma de la página). El índice comparte el `loading` del segmento.
- **Error**: `preguntas/layout.tsx` monta `PublicErrorCopyProvider` con `questions.error.*` y las
  dos salidas ya traducidas (`exits: { index, listing }`, campo opcional nuevo de `PublicErrorCopy`;
  `toListing` sigue como está), y `preguntas/error.tsx` dibuja `ErrorScreen` con un `TextLink` a la
  salida como `children`, elegida con `usePathname()`: el listado si falló el índice, el índice si
  falló una página.
- **Vacío del índice**: `questionGroups(published)` devuelve `[]` sin páginas; el índice dibuja
  `EmptyState` «Estamos escribiendo esto» con `LinkButton` `secondary` «Ver animales en adopción».
  Con cinco páginas fijas solo se ve en el test de la función; queda dibujado igual (spec).

## R13. La fecha y el conteo de oraciones, sin zona horaria ni lista abierta

- **`formatUpdatedOn(day, locale)`** en `lib/questions/dates.ts`: parte `YYYY-MM-DD` y formatea con
  `Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' })` sobre `Date.UTC(y, m-1, d)`,
  así un servidor en cualquier zona dice el mismo día. Locale `es-UY`. El `time` lleva
  `datetime="YYYY-MM-DD"` tal cual.
- **`sentenceCount`**: la lista cerrada de abreviaturas que no cierran oración es
  `['art.', 'arts.', 'inc.', 'n.º', 'nro.', 'núm.', 'Dr.', 'Dra.', 'Sr.', 'Sra.', 'etc.', 'p. ej.']`
  (sin distinguir mayúsculas), más un punto entre dígitos (`18.471`) y una sigla con puntos
  (`R.E.N.A.C.`). Una abreviatura nueva en el texto se suma a la lista y a su test.
