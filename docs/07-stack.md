# 07 — Stack tecnológico

**Decisión (2026-09-16):** infraestructura aburrida y conocida; el esfuerzo creativo va todo a lo
visual. Nada del stack debería requerir aprender una herramienta nueva, salvo la de animaciones.

## Criterios

1. **Linda de ver.** Que dé ganas de entrar y mirar animales. Fotos grandes, movimiento sutil,
   sensación de calidad.
2. **Liviana.** Se va a abrir desde un link de WhatsApp, en un celular, con datos móviles.
   Si tarda, se cierra.
3. **Barata.** Menos de US$30/mes. Tiers gratuitos hasta que duela.
4. **Conocida.** Next.js + Supabase ya se manejan (Camellia). Cero curva en lo que no aporta.
5. **Multilingüe desde el día uno.** Ver `06-i18n.md`.
6. **Siempre últimas versiones.** Paquetes, APIs, integraciones: la versión estable más reciente,
   sin excepción. Es un MUST. Ver sección "Versiones".

Los criterios 1 y 2 están en tensión. La forma de reconciliarlos: HTML primero (Server Components),
imágenes bien procesadas, animaciones con CSS y JS diferido. La belleza viene de las fotos, la
tipografía y el detalle, no de kilos de JavaScript.

## El stack

| Capa | Elección | Por qué | Costo |
|---|---|---|---|
| Framework | **Next.js 16** (App Router, TypeScript) | Server Components = HTML rápido; `next/image`, `next/og`, `next/font` resuelven imágenes, share y tipografía sin librerías extra. Ya se conoce. | 0 |
| Hosting | **Vercel Hobby** | Deploy en un push, edge CDN, 100 GB/mes de ancho de banda. Plan no comercial, y esto no lo es. | 0 |
| Base de datos + Auth + Storage | **Supabase Cloud** (managed; Postgres, Auth, Storage, RLS) | Todo en uno, cero operación. Magic link y Google nativos; el teléfono no pasa por acá (ver la fila de abajo). Tipos generados como en Camellia. | 0 (free: 500 MB DB, 1 GB storage, 50k MAU) |
| Estilos | **Tailwind CSS v4** + **shadcn/ui** | Componentes accesibles (Radix) que se copian al repo y se personalizan a fondo. No se ve "de template" si se le pone diseño propio. | 0 |
| Animaciones | **Motion** (ex Framer Motion) con `LazyMotion` + `m` | ~5 KB en el render inicial. Layout animations, gestos, `whileInView`. Lo único "nuevo" del stack. | 0 |
| Transiciones de página | **View Transitions API** (nativa del browser) | Transición ficha → listado sin JS extra. Degrada elegante donde no hay soporte. Todavía no se usa: con Next 16.4 no arranca (KL-57-2, #307). | 0 |
| i18n | **next-intl** | Ver `06-i18n.md`. | 0 |
| Formularios | **zod** y el estado de React | Un schema por formulario, el mismo en el cliente y en la Server Action. Sin librería de formularios: los dos que existen quedaron más cortos sin ella (ver §Decisiones, 2026-09-19). | 0 |
| Email | **Resend** + **React Email** | 3.000 emails/mes gratis. Templates en React, traducibles. | 0 |
| Código por teléfono | **El producto** genera y comprueba el código; **Twilio Messaging** (API REST, sin SDK) solo lo entrega por mensaje de texto | Las reglas de la verificación son del producto y se prueban igual en local y en producción (Decisión 2026-09-22, abajo). | ~US$0.05–0.10 por mensaje |
| Contacto | Link `wa.me` con texto prellenado | Cero costo, cero mantenimiento, es donde la gente ya habla. | 0 |
| Imagen de share (OG) | **`next/og`** (`ImageResponse`) | Imagen dinámica con la foto del animal, nombre y zona. Se genera en el edge. | 0 |
| Analytics + feedback | **PostHog** Cloud US, por su API de captura, sin SDK | Los funnels de los momentos que el sitio ya mide, mandados desde el servidor después de responder: nada en el navegador, sin perfil de persona ni ubicación, sin grabar la pantalla (historia #169). Las opiniones post-adopción las junta el sitio (#71). 1M eventos/mes gratis. | 0 |
| Errores | **Sentry**, región US, por su API de *envelopes*, sin SDK | Cada falla con la pantalla, el paso y la hora, sin datos de la persona, mandada desde el servidor después de responder (historia #169). Free tier alcanza. | 0 |
| Tareas programadas | **`pg_cron` + `pg_net`** en la base → route handler; **Vercel Cron** diario para la vigilancia | Vencimientos y recordatorios cada 5 minutos, seguimiento cada hora, el resumen y las limpiezas una vez por día, aunque nadie use el sitio. Cada tarea anota su vuelta y la vigilancia avisa la que se atrasó (historia #169). | 0 |
| Lint/format | **oxlint** + Prettier | ESLint quedó atado a TypeScript 6; oxlint trae su propio analizador, corre sobre TypeScript 7 y no necesita el compilador. | 0 |
| Tests | **Vitest** para schemas y utils; **Playwright** para 2-3 flujos críticos, recién en beta | Lo mínimo que evita romper la solicitud de adopción sin darse cuenta. | 0 |

**Total estimado: dominio (~US$15/año) + mensajes del código. Menos de US$10/mes hasta tener volumen; el techo de 200 mensajes por día de la historia #10 acota el peor caso.**

- **Decisión (2026-09-28, Hernán en #77):** el gasto de la beta está aprobado: la cuenta de
  mensajes de texto para el código y el dominio; lo demás en planes gratuitos. (docs/07, la línea
  del total estimado)

**Decisión (2026-09-17):** Vercel recién para la beta cerrada. Hasta tener el MVP todo corre en local
(`next build` + `next start` + Supabase CLI), con las mismas validaciones (`pnpm verify`, ver
`09-flujo-de-trabajo.md`).

## Por qué no otras cosas

- **Astro**: excelente para sitios livianos, pero esto tiene auth, formularios, bandeja de
  solicitudes y estado. Terminaría siendo islas de React sobre Astro; mejor Next directo.
- **SvelteKit / Nuxt**: más livianos, pero curva nueva sin ganancia real acá.
- **Neon + Better Auth + S3**: más flexible, más piezas que mantener. Supabase junta todo.
- **GSAP**: hoy es gratis y es lo mejor para animaciones de scroll elaboradas. Queda como opción
  **solo para la landing**, si algún día se quiere un hero espectacular. Nunca en el listado ni en
  las fichas.
- **CSS Modules / styled-components**: Tailwind v4 + shadcn es más rápido de iterar y ya se conoce.
- **ESLint + typescript-eslint**: es el estándar y lo trae Next, pero hoy no corre sobre
  TypeScript 7: typescript-eslint aborta con un error que remite a TypeScript 6 (su issue 10940
  sigue el soporte para 7.1). Se revisa cuando lo soporte; si para entonces oxlint cubre todo,
  no se vuelve.
- **Monorepo**: es una sola app. Un solo `package.json`.
- **Supabase self-hosted**: correrlo en un VPS cuesta US$5-10/mes más backups, actualizaciones,
  seguridad y tiempo. El free tier de Supabase Cloud es exactamente el "cero capital" que se busca.
  Self-host solo tendría sentido por residencia de datos o a una escala que hoy no existe.
  **Desarrollo local sí con Supabase CLI** (Docker): migraciones y seed se prueban localmente
  antes de tocar el proyecto cloud.

## Imágenes: la pieza más importante

Las fotos son el contenido. Son el 80% de "linda de ver" y el 80% de "pesada". Supabase solo
transforma imágenes en plan Pro, así que se procesan **en el browser, al subir**:

1. El usuario elige la foto.
2. En el cliente se redimensiona y comprime a **WebP** en tres tamaños:
   `thumb` 400 px, `card` 800 px, `full` 1600 px. Librería: `browser-image-compression` o canvas
   directo.
3. Se genera un **ThumbHash** (≈25 bytes) y se guarda en la DB junto con la ficha.
4. Los tres archivos van a Supabase Storage (bucket público, path `pets/{pet_id}/{size}.webp`).
5. Al mostrar: `next/image` con `sizes` correctos y `placeholder` con el ThumbHash. La foto
   aparece como una mancha de color que se enfoca. Esa es la sensación de calidad.

Reglas:
- Máximo 5 fotos por ficha. La primera es la de portada.
- Nunca subir la original. El teléfono saca fotos de 4 MB; nadie las necesita.
- `loading="lazy"` en todo salvo la portada de la ficha y las primeras 4 cards del listado.

## Animaciones: cómo ser lindo sin ser pesado

> **Reemplazado en parte (2026-09-18).** El catálogo de abajo es anterior a la guía de diseño.
> Donde difiera, manda `10-design-system.md`; lo que quedó sin efecto está en §Descartado.

Jerarquía, de más barata a más cara. Usar siempre la más barata que resuelva el caso:

1. **CSS puro** (transitions, `@starting-style`, keyframes): hover en cards, botones, fades,
   skeletons. El 70% de las animaciones.
2. **View Transitions API**: navegar de card a ficha con la foto "volando" a su lugar.
   Un atributo `view-transition-name`, cero JS.
3. **Motion con `m` + `LazyMotion`**: aparición escalonada de cards al hacer scroll
   (`whileInView`), layout animations al filtrar el listado, el corazón al marcar interés,
   los badges de verificación al aparecer.
4. **Motion completo** (`motion`): nunca en el bundle inicial. Solo cargado dinámicamente en
   componentes que lo necesiten de verdad (drag, gestos complejos).

### Microinteracciones: la clave

**Sutiles pero abundantes.** Cada elemento interactivo responde a hover, focus y active, y cada
cambio de estado se ve. No es una animación grande cada tanto: son cientos de respuestas chicas
las que hacen que la interfaz se sienta viva y cuidada.

Catálogo base (todo en CSS, 100-250 ms):
- **Cards**: se elevan 2-4 px y la sombra crece al hover; la foto hace zoom de 1.02-1.04.
- **Botones**: cambio de color al hover, se hunden 2 px al presionar (el grosor de su trazo; era
  1 px antes de la identidad «Cartel», 2026-09-18), spinner interno al cargar.
- **Badges de verificación**: brillo sutil una sola vez al aparecer en pantalla.
- **Inputs**: el borde toma el color de acento al focus, con transición; el error entra con fade.
- **Chips de filtro**: cambian de color al activarse; el listado se reordena con layout animation.
- **Corazón / interés**: pop con escala al tocar.
- **Skeletons**: shimmer, nunca estáticos.
- **Toasts**: entran deslizando, salen con fade.
- **Contadores** (solicitudes, animales): el número hace tween al cambiar.
- **Links de navegación**: subrayado que crece desde la izquierda.
- **Fotos al cargar**: del ThumbHash borroso al nítido, con fade.
- **Iconos**: rotan o cambian de forma al cambiar de estado (chevron, menú, filtro activo).

El catálogo vive en `globals.css` como utilidades reutilizables (`.lift`, `.press`, `.shimmer`)
y en las variantes de los componentes `ui/`. Nunca se reimplementa un hover a mano en un
componente de dominio.

Regla de oro: **microinteracciones 100-250 ms, transiciones de página 250-400 ms**, siempre
respetando `prefers-reduced-motion`. Lo que dura más de medio segundo molesta la segunda vez
que lo ves.

## Dirección visual

> **Reemplazado en parte (2026-09-18).** Estos principios son anteriores a la identidad «Cartel».
> Donde difieran, manda `10-design-system.md`; lo que quedó sin efecto está en §Descartado.

Esto no es el diseño, son los principios que lo van a guiar:

- **Mobile-first, de verdad.** Se diseña en 390 px y se expande. El 90% va a entrar desde
  WhatsApp en el teléfono.
- **La foto manda.** Cards con foto grande, casi sin borde, con nombre y zona superpuestos o
  justo debajo. Nada de tablas ni listas con thumbnail chico.
- **Una tipografía con carácter para títulos, una neutra para el resto.** Vía `next/font`,
  self-hosted, sin flash. Nada de Inter para todo.
- **Paleta cálida y con un acento**, no la paleta default de Tailwind. Tokens en CSS variables
  desde el inicio (`--color-primary`, etc.) para que el rebranding, cuando haya nombre, sea
  cambiar un archivo.
- **Los badges de verificación son el elemento de diseño más importante después de la foto.**
  Tienen que verse valiosos. Es el diferencial, hecho visible.
- **Estados vacíos y de carga diseñados**, no un spinner. Skeletons con la forma real del
  contenido; un estado vacío con una ilustración y una acción.
- **Microinteracciones sutiles pero abundantes.** Todo lo tocable responde. Ver catálogo en la
  sección de animaciones. Es lo que separa "una web" de "una web linda".
- **Modo oscuro: no en el MVP.** Pero los tokens de color quedan preparados.

## Presupuesto de performance

Se mide en Lighthouse, mobile, con throttling 4G, en la página de listado y en una ficha:

| Métrica | Objetivo |
|---|---|
| LCP | < 2,5 s |
| CLS | < 0,05 |
| INP | < 200 ms |
| JS inicial (gzip) | < 150 KB |
| Lighthouse Performance | ≥ 90 |

Se chequea antes de la beta. Si no da, se saca JS, no se agrega.

**Decisión (2026-09-19):** el LCP pasa de 2,0 a **2,5 s**, que es el umbral «bueno» de Core Web
Vitals y contra lo que compara todo el mundo; los 2,0 s eran un número propio, más exigente, sin
una medición detrás. La primera corrida real de Lighthouse (CI del PR de F00) dio 2,1 s en la
portada provisoria, un título y una nota. Lo que pesa antes de pintar el título son ~277 KB: el
piso de JS de Next (~136 KB) y la tipografía (131 KB, por llevar los ejes de peso, ancho y tamaño
óptico). Hernán eligió conservar el dibujo exacto de los títulos y alinear el presupuesto con el
estándar. Queda anotado lo que se sabe: sin el eje óptico la fuente baja a 78 KB, y es la primera
palanca si el listado con fotos no entra.

**Decisión (2026-10-07):** se tira esa palanca: la tipografía va sin el eje óptico (78 KB). La
portada con los animales quedó en el borde (2861 ms en local, 2274–2873 en CI) y trababa todo PR
que la rozara (#128). La simulación de Lighthouse cuenta lo que se pidió antes del primer pintado,
y el titular pinta en el primer cuadro: sin la tipografía da 2332 ms, sin el eje óptico 2484 ms.
Sin precarga da peor (2712 ms, el FCP se va a 1,5 s). En local el margen es chico (2481–2487 ms);
en CI la mejor de tres venía ~500 ms por debajo de local, y es la que cuenta. Si CI vuelve a
rozar, la palanca siguiente es un subset propio con fontTools (66 KB, ~90 ms menos), que suma
un paso de build. Lo que se pierde: los títulos grandes ya no se cierran con el tamaño, y en
afiche salen 5 % más anchos a 39 px y 10 % a 61 px (el titular de la portada cambia de corte en
el teléfono). La voz de afiche es el eje de ancho, que se queda. El respaldo de afiche
(`globals.css`) se recalibró contra la fuente nueva.

**Decisión (2026-10-04, product-owner):** el aviso de que la ficha o el listado se pasan del
presupuesto lo da la prueba automática de rendimiento que ya mide esas dos pantallas con red y
procesador de teléfono, que pasa de anotar el peso a fallar por encima de 150 KB; sumarlas a la
auditoría de Lighthouse sigue esperando la aprobación de Hernán (KL-57-3). Motivo: la
configuración de Lighthouse es una compuerta que el enjambre no toca solo (docs/09 §Las reglas
no se tocan solas), y sin un freno que falle la ficha vuelve a engordar cuando M3 sume «Quiero
adoptar». (docs/07 §Presupuesto de performance)

**Decisión (2026-10-04, product-owner):** lo que se baja después de abrir (el aviso de «Enlace
copiado», copiar a mano, los textos de error) llega apenas la pantalla terminó de abrir, no
recién al tocar. Motivo: quien abre el enlace en el teléfono con señal mala puede perderla
después; si el aviso esperara al toque, «Compartir» quedaría mudo justo para quien más lo usa
para pasarlo al grupo. (docs/07 §Presupuesto de performance)

**Decisión (2026-10-05, enjambre):** mientras Lighthouse no mida la ficha y el listado (KL-57-3), su
JS lo mide `tests/e2e/animales-rendimiento.spec.ts` contra `next start`, con red y procesador de
teléfono y sin caché: el **peso de apertura** es lo transferido en scripts pedidos antes de
`loadEventEnd` y debe quedar en 150 KB o menos; el **peso total** (después de `networkidle` + 1 s)
no puede pasar el que tenían antes de #95 (ficha 188,2 KB, listado 169,4 KB), para que el peso no se
esconda corriéndolo a después de abrir. Y la regla: lo que solo hace falta después de un toque
(avisos, copiar a mano, la medición de «Compartir», la vista viva del listado) llega después de
abrir, con `afterOpen` / `useAfterOpen` (`src/hooks/use-after-open.ts`); el HTML del servidor ya
sirve sin eso. Motivo: con #95 la ficha abre en 149,6 KB y el listado en 147,3 KB, y el piso de Next
más la cabecera ya ocupan ~145 KB: sin regla y sin freno, la próxima hoja cliente lo vuelve a pasar.
(docs/07 §Presupuesto de performance)

**Decisión (2026-10-09, Hernán):** el peso de JS se mide como dice la tabla, en gzip: el cuerpo
comprimido de cada script (`encodedBodySize`), no lo transferido (`transferSize`), que suma ~300
bytes de encabezados HTTP por archivo. Motivo: los encabezados no son JS y cambian de un servidor
a otro; con ellos la ficha abría en 149,94 KB en local y pasaba los 150 en CI por unos bytes, y
`main` quedó rojo con el mismo código que en otra corrida pasaba (#18, #153). Medida así, la ficha
abre en 146,4 KB. Los topes del peso total (188,2 y 169,4 KB) quedan como estaban, medidos con
encabezados: son unos 4 KB más holgados que antes y siguen lejos (ficha 176,7 KB con encabezados).
Lo mismo para el perfil (`perfil-rendimiento.spec.ts`). Frenar además por cuánto crece cada PR
contra `main` queda como propuesta sin decidir en #156.

**Decisión (2026-10-28, Hernán):** el tope del peso total del listado sube de 169,4 a 183 KB. Motivo:
el filtro de departamento pasa a usar el mismo `Select` que el resto de la app, con su lista, y eso
suma unos 13 KB después de abrir (el listado con filtro medido en CI: 182,3 KB). La apertura sigue
por debajo de 150 KB. Sin JavaScript, el filtro sigue siendo el `select` del navegador (`NativeSelect`).
Rearmar `Select` sobre el `select` personalizable del navegador (`appearance: base-select`), sin JS,
queda para cuando Safari lo tenga: hoy en iPhone mostraría la lista del sistema en todos los
formularios.

**Decisión (2026-10-29, enjambre, historia #265):** el tope del peso total del listado sube de 183
a 184 KB. Motivo: «Avisame cuando haya uno así» es una hoja cliente nueva dentro del listado (el
botón con sus estados y la acción que crea el aviso) y suma unos 0,7 KB en gzip después de abrir; el
listado con filtro medido en local quedó en 183,4 KB. Traer la acción recién al tocar no bajó nada
(el trozo aparte pesa lo mismo). La apertura sigue por debajo de 150 KB.

**Decisión (2026-11-18, product-owner):** la ficha y el listado tienen pantalla de espera al llegar desde dentro del sitio, y la ficha se sigue sin pedir antes del toque; quien abre el enlace desde afuera la recibe entera, como hoy. Motivo: contar las aperturas de cada ficha (#269) es una lectura de la hipótesis y vale más que medio segundo; la tarjeta apagada y la espera dan la respuesta al instante sin adelantar la vista, y la vista previa del enlace es lo que los rescatistas pegan en los grupos. (docs/07 §Presupuesto de performance)

Cómo se construyó (historia #302): la espera es un `Suspense` que solo existe en el pedido de un
toque dentro del sitio (`InSiteArrival`, con `isInSiteNavigation`: el router de Next pide con
`fetch` y el navegador manda `Sec-Fetch-Dest: empty`). No es un `loading.tsx`, que va siempre y haría
llegar la ficha en un segundo envío, escondida sin JavaScript. Va dentro de cada página y no en su
layout: así Next sube la pantalla al dibujar la espera, y no deja a la vista el pie de la página de
antes hasta que llega la ficha.

**Decisión (2026-11-18, product-owner):** un toque contesta cuando la pantalla muestra el primer cambio que provoca (la tirita arrancada, el botón trabajando, la pregunta de confirmación, la letra escrita), no cuando llega la respuesta del servidor; el tope es 200 ms con red y procesador de teléfono de gama media, la misma emulación que ya usa la prueba de rendimiento, y la prueba falla si se pasa. Motivo: es la línea de 200 ms que ya tiene el presupuesto y nunca se midió, y docs/10 §Principios 4 pide que todo lo tocable conteste en 100 a 250 ms; sin una prueba que falle, el próximo cambio la vuelve a pasar sin que nadie lo vea. (docs/07 §Presupuesto de performance)

**Decisión (2026-11-18, product-owner):** se miden los toques de las pantallas que mueven las métricas de docs/03: filtrar y compartir para quien busca, pausar, marcar en proceso, aceptar, rechazar y llenar «Publicar un animal» para quien rescata. Quedan afuera las pantallas de revisión y administrar, que usa una sola persona, y las de verificar, que se miden aparte (KL-018). Motivo: el producto es primero para rescatistas, y publicar y aceptar son la primera y la tercera métrica. (docs/07 §Presupuesto de performance)

**Decisión (2026-11-18, product-owner):** si para contestar a tiempo las fotos tienen que prepararse de otra forma, se siguen preparando en el teléfono, con los mismos tres tamaños, la misma calidad y la misma vista previa borrosa, y sin sumar código al abrir «Publicar un animal». Motivo: lo que se guarda de cada foto no cambia (docs/07, imágenes), y el peso al abrir de esa pantalla ya está en discusión en #304. (docs/07 §Presupuesto de performance)

Cómo se construyó (historia #313): el INP de la tabla lo mide `tests/e2e/toques-rendimiento.spec.ts`
(filtrar, «Compartir», «Marcar en proceso», «Pausar», «Rechazar» y «Aceptar solicitud», también con
«reducir movimiento» y con el servidor tardando 3 s) y `publicar-rendimiento.spec.ts` («Gato» y cada
letra del nombre mientras se preparan tres fotos de 12 megapíxeles), contra `next start` y con la
emulación de `throttleLikeAPhone`. Cada toque se cuenta desde el `pointerdown` o el `keydown` hasta
el primer cuadro en que se ve la respuesta, o hasta lo que diga el Event Timing del navegador si es
más; `tests/e2e/support/tap-latency.ts` falla nombrando el toque y por cuántos ms se pasó. En la
primera medición todo quedó por debajo de 200 ms, pero «Gato» con las fotos preparándose iba de 32 a
192 ms con varias pruebas a la vez: exportar cada foto a WebP con `toBlob` es una tarea de 50 a 90 ms
en el hilo que contesta los toques (con `OffscreenCanvas` en la página, lo mismo). Las fotos se
preparan ahora en un worker con `OffscreenCanvas` (`lib/pets/photo-preparer.ts` y
`photo-worker.ts`), con el mismo código y el mismo resultado. Si el worker no arranca, o el navegador
no exporta WebP desde el worker (Safari exporta PNG), la foto se prepara en la página como antes,
con libwebp; así el worker no carga ese código. Lo que prepara las fotos, con la vista previa
borrosa, sigue bajando después de abrir con `afterOpenModule`, como lo dejó #304: el worker no le
suma código a la apertura de «Publicar un animal».

**Decisión (2026-10-09, Hernán):** Lighthouse deja de frenar el peso de JS
(`resource-summary:script:size` sale de `.lighthouserc.json`); sigue frenando LCP, CLS, la nota de
performance y accesibilidad. Motivo: medía la portada con encabezados y sumando lo que llega después
de abrir, otra cuenta del mismo presupuesto que no coincide con la tabla. Con Next 16.4.0 (#157) la
portada sube 0,9 KB en gzip (143,3 KB, dentro del tope) y Lighthouse marcaba 154.555 bytes contra
153.600. El peso de apertura de la portada, la ficha y el listado lo frena
`tests/e2e/animales-rendimiento.spec.ts`, en gzip: una sola medida. El peso total de la portada,
que solo frenaba Lighthouse, pasa al e2e con el mismo tope (150 KB). Y el e2e cuenta ahora el
script de arranque que Next precarga con `<link rel="preload">` (3,5 KB que la prueba no veía):
bien contada, la ficha abre en 149,9 KB, la portada en 145,9 y el listado en 147,5. Con eso,
Next 16.4.0 (+0,9 KB) pasa la ficha por encima del tope, y se baja peso antes de subirlo
(`tailwind-merge`, §R5 de #95).

**Decisión (2026-10-09, Hernán):** `tailwind-merge` sale del cliente, en su propio PR por ser un
cambio transversal. `cn()` queda en `clsx`: junta clases y no resuelve conflictos. Lo que antes un
`className` pisaba (el relleno del `ghost`, el tamaño del código, la chapita chica, esconder un
botón) pasa a ser una variante del componente o un modificador que no compite
(`08-convenciones-codigo.md` §Estilos); nada cambia en pantalla. Medido con
`animales-rendimiento.spec.ts` contra `next start`, en gzip: la ficha abre en 141,6 KB (antes
149,9), el listado en 139,3 (antes 147,5) y la portada en 137,7 (antes 145,9): unos 8 KB menos en
cada pantalla, que es el aire para Next 16.4.0. Descartado: reimplementar la mezcla a mano, que
es volver a pagar el peso; y fijar el orden con `!important`, que esconde el conflicto en lugar
de sacarlo.

**Decisión (2026-11-18, product-owner):** las pantallas con sesión del camino a adoptar y las que más usa quien publica tienen el mismo tope que la ficha: 150 KB de código al abrir, menos de 2,5 segundos y corrimiento por debajo de 0,05, con red y procesador de teléfono, y la prueba de rendimiento falla si las pasan. Motivo: el cuestionario es el paso que sigue a la ficha, y quien publica acepta desde el teléfono; KL-53-4 se aceptó solo mientras ninguna pantalla con sesión fuera del camino a adoptar, y hoy lo son dos. (docs/07 §Presupuesto de performance)

**Decisión (2026-11-18, product-owner):** el peso total de cada una de las cinco pantallas, medido un rato después de abrir, no puede pasar el que tiene antes de esta historia, como se hizo con la ficha y el listado en #95. Motivo: sin ese tope, bajar el peso de apertura se resuelve mandando lo mismo un segundo después, y quien tiene mala señal lo paga igual. (docs/07 §Presupuesto de performance)

**Decisión (2026-11-18, enjambre, historia #304):** las cinco pantallas se miden en
`tests/e2e/con-sesion-rendimiento.spec.ts`, como la ficha y el listado, y los totales de partida son
los de `main` antes de #304: el cuestionario 206 KB, «Mis animales» 234,7, «Publicar un animal» 259,9,
las solicitudes de un animal 155,6 y una solicitud recibida 207,9. Lo que solo hace falta después de
un toque baja después de abrir, y el toque que llega antes lo pide en ese momento: las capas de Radix
de `Dialog`, `Sheet`, `Toast` y `Select` (`overlay-layer.tsx`, `toast-layer.tsx`,
`select-layer.tsx`: el disparador y la cáscara salen del servidor), los schemas de zod de lo que se
revisa al enviar (`afterOpenModule`) y el cuerpo de una hoja (`deferred`, hoy `deferredPart`, historia #316); lo que se dibuja pocas veces
baja solo cuando se dibuja (`drawnOnly`), porque una ruta trae todo lo que importa aunque no lo dibuje.
Los textos de los límites de error con sesión viajan sin next-intl en el navegador (13 KB). Los schemas
de esas pantallas se escriben con `zod/mini`, que pesa unos 7 KB menos que el clásico: Turbopack no
recorta zod por dentro y cada pantalla que lo baja paga su núcleo entero (23 KB). Motivo: la zona con
sesión abría entre 156 y 260 KB, y el piso de Next con la cabecera ya ocupa 139.

**Decisión (2026-11-18, agente, historia #304):** «Publicar un animal» abre con el título y las
fotos, y los campos con la tirita llegan apenas abre la pantalla; hasta entonces se ve su espera, la
misma forma de `PetFormSkeleton`. El servidor no los dibuja: un campo dibujado por el servidor y
despierto después pierde el toque y lo escrito antes de despertar (React 19.3 no los repite), y con
los campos al abrir la pantalla pesaba 154,4 KB, con 139,6 de piso. Así abre con 149,5 KB. Si los
campos no llegan, en su lugar queda «Reintentar» (`RetryNotice`), y lo elegido y el borrador
siguen en el formulario. Lo mismo
vale para editar, que es el mismo formulario. Descartado: partir el formulario en pasos, que cambia
cómo se carga un animal para ganar 5 KB y en la pantalla ancha deja una columna sola (docs/11,
2026-09-20); y subir el tope de esta pantalla, que es una regla de `CLAUDE.md`.

**Decisión (2026-11-18, product-owner):** lo de adentro sigue bajando apenas abre la pantalla, como hoy; la espera se ve solo si el toque llega antes. Motivo: con buena señal la hoja tiene que abrir igual que ahora, y el tope de 150 KB al abrir no se mueve (docs/07 §Presupuesto de performance). (docs/07 §Presupuesto de performance)

**Decisión (2026-11-18, agente, historia #316):** la espera y el aviso de lo que llega después de
abrir los dibuja el servidor (`LaterPart`: `laterConfirm`, `laterButton`) y el cliente solo decide
cuál mostrar (`deferredPart`), así viajan en el HTML y no suman código al abrir. Para que ninguna de
las cinco pantallas abra con más código que antes, lo que hace cada hoja al confirmar (rechazar,
preguntar, borrar, quitar una cría) llega con lo de adentro y no con la pantalla. Medido contra
`next start`, en bytes comprimidos al abrir: «Mis animales» −298, una solicitud recibida −890,
«Publicar un animal» −4; el cuestionario +53, por el lugar de «Retirar» de la pantalla del tope,
que vive en su misma ruta. Descartado: un `Skeleton` y un aviso cliente por hoja, que sumaban entre
0,2 y 1,4 KB a cada pantalla.

**Decisión (2026-11-18, agente, historia #318):** el botón que abre una hoja, una pregunta o una
lista que todavía no llegó trabaja mientras baja y, si no llega en 10 s, deja «Reintentar» debajo
(`useAfterOpenOrTap`, en su propio archivo; el aviso es `RetryNotice` y sus textos van en el `body`,
`tapFailedTexts`). Para que ninguna pantalla abra con más código que antes, lo que sumó se pagó con
lo que bajaba sin hacer falta: `useAfterOpenOrNow` se fue (el mismo gancho ahora también espera el
toque), `afterOpen`, `useAfterOpenWithRetry` y lo que cierra desde adentro de una hoja
(`overlay-close.tsx`) pasaron a su propio archivo, «Copiar enlace» elige su texto con
`lib/share/mode.ts` sin bajar el resto de cómo se comparte (que #304 ya quería después de abrir),
aceptar y pedir identidad traen sus botones después como rechazar, y las cards de «Mis animales»
comparten `StatusCard`. Medido contra `next start`, en bytes comprimidos al abrir y contra `main`:
el listado −255, la ficha −117, el cuestionario −97, «Mis animales» −123, «Publicar un animal» −14,
las solicitudes de un animal −130, una solicitud recibida −513, «Mi perfil» −77; la portada igual. Turbopack no recorta lo que un archivo exporta y no se usa:
cada pantalla baja el archivo entero, y por eso partirlos ahorra.
Descartado: un provider con los textos del aviso en el layout, que sumaba unos 300 bytes a cada
pantalla, también a las que no tienen nada que abrir; y copiar el aviso escondido en el HTML, que
pesaba más que dibujarlo.

**Decisión (2026-11-18, product-owner):** la portada se lleva con margen: cada corrida de la auditoría en 2,3 s o menos, y no solo la mejor de tres por debajo de 2,5 s, que es lo que mira la compuerta. El tope de la compuerta no cambia. Motivo: las corridas de una misma auditoría se separan hasta 0,3 s, y entre auditorías del mismo código hasta 0,7 s (de 2,12 a 2,86 s); con el tope justo, el próximo cambio que la roce vuelve a dejar main en rojo sin que cambie nada, como en #128 y el 2026-11-18. (docs/07 §Presupuesto de performance)

**Decisión (2026-11-19, agente, historia #320):** la tipografía baja después del primer pintado, en
todas las pantallas. Un script de una línea en el `<head>` (`lib/fonts/after-first-paint.ts`) pone
`font-later` en `<html>` y la saca cuando el navegador avisa el primer pintado (o en `load`, si no lo
avisa); mientras está puesta, `--font-sans` y `.afiche` nombran solo los respaldos y Bricolage no se
pide. next/font va sin precarga y sin su respaldo propio: el del texto de lectura es `Texto Fallback`,
con las métricas que next/font calculaba sobre Arial más Liberation Sans y Arimo, como ya tenía
`Afiche Fallback`. Sin JavaScript la clase nunca se pone y la fuente baja con el CSS.

Motivo, medido con la emulación de `.lighthouserc.json` contra `next start` en local: la simulación de
Lighthouse cuenta como necesario para el LCP todo lo que terminó de bajar antes de que se viera el
titular. La fuente precargada (77 KB) siempre entraba; sacarla bajó el LCP entre 300 y 450 ms en cada
corrida. La decisión del 2026-10-07 había probado sacar la precarga y daba peor porque la fuente la
pedía el CSS con prioridad máxima y Lighthouse la tomaba como bloqueante del primer pintado; pedida
después del pintado no cuenta para ninguno de los dos.

Lo segundo es el tamaño del HTML. Lighthouse simula la conexión del teléfono y lo que entra en el primer
envío (14.600 bytes con los encabezados) llega una ida y vuelta antes: unos 150 ms menos en el FCP y en
el LCP. Next comprime el HTML y el payload RSC por separado, así que cada URL firmada cuesta dos veces.
Las cards de «Recién publicados» llevan ahora una sola URL, el tamaño `card` (`cardSizeOnly`), que es el
que el navegador ya elegía en el teléfono y en pantallas de densidad 2; el HTML con los 8 de las
semillas pasó de 16,0 a 13,9 KB comprimido. `poweredByHeader: false` saca un encabezado que no usa nadie.
El margen es chico (unos 70 bytes): un cambio que le sume texto a la primera vista de la portada vuelve
a mandarla a dos envíos.

Medido después del cambio, quince corridas con animales (con foto) y quince sin ninguno: con animales,
de 1,56 a 2,26 s; sin animales, de 1,55 a 2,20 s; corrimiento 0 en todas. Antes, en `main`, de 2,12 a
2,75 s. Lo que todavía separa las corridas es si el código de React (71 KB) se evalúa antes o después
de que el titular llegue a la pantalla: cuando se evalúa antes, Lighthouse lo suma y la corrida da
unos 600 ms más. Esa carrera depende de la máquina; en CI, con menos procesador, puede tocar más seguido.

Descartado: sacar el ThumbHash de las cards de la portada (bajaba 1 KB más, pero una foto que no carga
tiene que dejar el borroso, FR-020 de la historia #61); poner el CSS dentro del HTML (`inlineCss`: le
sumaba 12 KB al documento y lo mandaba a dos envíos); `content-visibility` en «Recién publicados» (las
fotos se pedían igual y el primer cuadro no se acortó); y el subset de la fuente con fontTools que
proponía el 2026-10-07, que con la fuente fuera del LCP no cambia nada.

**Decisión (2026-11-19, product-owner):** las pantallas de verificar el teléfono y la identidad entran al mismo presupuesto que el camino a adoptar: 150 KB de código al abrir, menos de 2,5 segundos, corrimiento por debajo de 0,05 y cada toque en menos de 200 ms, con red y procesador de teléfono de gama media, y la prueba de rendimiento falla si se pasan. Motivo: son la puerta de las tres métricas de docs/03, y la segunda se lee entera en «Verificá tu identidad»; #304 y #313 las dejaron afuera solo porque KL-018 ya medía su carga, no su peso ni sus toques. (docs/07 §Presupuesto de performance)

**Decisión (2026-11-19, product-owner):** si para contestar a tiempo la foto de la cédula y la selfie tienen que prepararse de otra forma, se siguen preparando en el teléfono y lo que llega a revisión es lo mismo: sin la ubicación ni los demás datos de la foto, con el mismo peso máximo y el mismo formato. Motivo: borrar esos datos antes de que la imagen salga del teléfono es una regla de privacidad del pedido (Ley 18.331), y quien revisa tiene que poder leer la cédula igual que hoy. (docs/07, imágenes)

**Decisión (2026-11-19, product-owner):** quedan afuera las pantallas del número que ya usa otra cuenta. Motivo: son un desvío que casi nadie recorre; el camino de todos es el número, el código y, cuando se lo piden, la identidad. (docs/07 §Presupuesto de performance)

**Decisión (2026-11-19, agente, historia #322):** las tres pantallas de verificar abrían con 180,7,
181,2 y 185,1 KB; el piso común (Next, React y el encabezado) es 139,5 KB. Unos 34 KB eran zod, que
llegaba con la pregunta «¿Qué te frena?» de «Ahora no» aunque casi nunca se dibuja. Las reglas de esa
pregunta bajan ahora después de abrir, la pregunta misma y la pantalla de error de cada ruta bajan
solo cuando se dibujan, y el procesado de la foto de la cédula baja después de abrir. Quedan en 142,8,
143,4 y 146,4 KB, y la medición está en `tests/e2e/verificar-rendimiento.spec.ts`, con los totales
de antes como tope.

La foto de la cédula y la selfie se siguen preparando en el hilo de la página. Con el procesador
cuatro veces más lento, la tarea más larga mientras se preparan dos fotos de 12 megapíxeles dura de
59 a 75 ms, lejos de los 200. Se probó prepararlas en un worker, como las de un animal (#313): las
tareas largas desaparecen, pero suma dos archivos y un cambio en el preparador de publicar que esta
historia no necesita. La prueba mide además la tarea más larga del rato en que se preparan, porque un
toque que cae en ella espera a que termine: si un cambio la pasa de 200 ms, falla y dice cuánto.

**Decisión (2026-11-19, product-owner):** «Solicitudes recibidas», la página de un animal en «Mis animales», «Mis solicitudes» y «Mi solicitud» entran al mismo presupuesto que el camino a adoptar: 150 KB de código al abrir, menos de 2,5 segundos y corrimiento por debajo de 0,05, con red y procesador de teléfono de gama media, y la prueba de rendimiento falla si se pasan. Motivo: son las pantallas a las que se vuelve mientras se espera una respuesta y donde se lee la tercera métrica de docs/03; #304 y #322 cubrieron el camino hasta mandar la solicitud y no lo que pasa después. (docs/07 §Presupuesto de performance)

**Decisión (2026-11-19, product-owner):** el peso total de cada una de las cuatro, medido un rato después de abrir, no puede pasar el que tiene antes de esta historia, como en #95 y #304. Motivo: sin ese tope, bajar el peso al abrir se resuelve mandando lo mismo un segundo después, y quien tiene mala señal lo paga igual. (docs/07 §Presupuesto de performance)

**Decisión (2026-11-19, product-owner):** «Mi solicitud» se mide aceptada y con el contacto a la vista, que es su versión más pesada y la que importa para la tercera métrica; el contacto sigue sin aparecer, ni como hueco, en una solicitud que no fue aceptada. Motivo: es el momento en que el sitio le pasa la conversación a WhatsApp, y la regla de mostrar el contacto solo al aceptar no se toca (docs/03, Ley 18.331). (docs/07 §Presupuesto de performance)

**Decisión (2026-11-19, product-owner):** quedan afuera «Solicitud enviada», «Entrar», «Completar perfil», «Mi perfil», «Mis avisos» y «Mis avales». Motivo: se ven una vez o pocas; las cuatro de la historia se abren varias veces por día mientras se espera. (docs/07 §Presupuesto de performance)

Cómo se construyó (historia #324): las cuatro pantallas se miden en
`tests/e2e/solicitudes-rendimiento.spec.ts`, con los totales de `main` como tope: «Solicitudes
recibidas» 141,2 KB, la página de un animal 184,5, «Mis solicitudes» 144,6 y «Mi solicitud» aceptada
168,8. Solo «Mi solicitud» se pasaba: abría con 154,4 KB. Bajaban con ella el formulario del
seguimiento con sus fotos, «Acepto el compromiso» y «Yo no adopté», que solo se dibujan después de una
entrega, y las dos pantallas de error de la ruta. Esas partes bajan ahora solo cuando se dibujan
(`drawnOnly`, como la encuesta) y los dos límites de error comparten una pantalla que baja recién al
dibujarse. Queda en 147,3 KB al abrir y 161,7 en total; «Mis solicitudes» en 142,6, y las otras dos
como estaban (141,2 y 148,1). La misma prueba mide que el contacto aceptado esté a la vista antes de
los 2,5 s (se ve en el primer cuadro: viene en el HTML), que en una solicitud sin aceptar no aparezca ni
su lugar, y que «Retirar solicitud» tocado dos veces abra una sola pregunta en menos de 200 ms (112 ms)
o deje el aviso de #318 si la pregunta no llega.

**Decisión (2026-11-19, product-owner):** «Entrá sin contraseña», «Mirá tu correo» y «Contá quién sos» entran al mismo presupuesto que el camino a adoptar: 150 KB de código al abrir, menos de 2,5 segundos y corrimiento por debajo de 0,05, con red y procesador de teléfono de gama media; y el código total, medido un rato después de abrir, no pasa el de antes de esta historia, como en #95, #304 y #324. Motivo: toda persona nueva pasa por ellas antes de verificarse, y una pantalla lenta ahí mezcla en la métrica de docs/03 el costo de verificarse con el de esperar; #324 las dejó afuera porque se ven una vez por persona, y ahora son el único tramo del alta sin tope. (docs/07 §Presupuesto de performance)

**Decisión (2026-11-19, product-owner):** si la foto de perfil es lo que deja «Contá quién sos» arriba de los 150 KB, lo que prepara la foto puede llegar después de abrir, siempre que «Agregar foto» conteste desde el primer toque o diga que se está preparando; el nombre, el departamento y la localidad se escriben desde que aparecen. No se parte el formulario en pasos ni se sube el tope. Motivo: la foto es optativa y se elige una vez, y el nombre y la zona son lo que hace falta para seguir a verificar; es la salida que tomó #304 con «Publicar un animal». (docs/07 §Presupuesto de performance)

Cómo se construyó (historia #326): las tres pantallas se miden en
`tests/e2e/alta-rendimiento.spec.ts`, con los totales de `main` como tope: «Entrá sin contraseña»
142,8 KB (lo mismo con Google y sin Google), «Mirá tu correo» 141,9 y «Contá quién sos» 232,5. Solo
«Contá quién sos» se pasaba: abría con 186,9 KB, y 34 de esos eran zod, que el formulario usaba recién
al guardar. Las reglas del perfil bajan ahora después de abrir, y un «Guardar» que llega antes las
espera trabajando; el borrador se recupera después de abrir, como el de un animal; el guardia de salir
con cambios se monta con el primer cambio; lo que prepara la foto baja después de abrir y la
confirmación de «Borrar mi cuenta» baja recién al tocarlo. Con eso quedaba en 150,7 KB: lo que faltaba
salió de la pantalla de error del grupo `(auth)`, que ahora baja solo cuando se dibuja, como en #324, y
que alivia también a las otras dos. Queda en 149,2 KB al abrir y 219,4 en total; «Entrá sin
contraseña» en 142,0 y «Mirá tu correo» en 141,1. El servidor de las pruebas no tiene Google, como CI:
la prueba levanta un segundo servidor del mismo build con Google prendido para medir esa versión de la
pantalla y «Entrar con Google». Mide además «Entrar con Google», «Enviarme el enlace», «Enviar otro» y
«Guardar» tocados dos veces con un servidor que tarda 3 s (cada uno contesta en menos de 100 ms y sale
un solo pedido y un solo correo), y que lo escrito en «Cómo te llamás» antes de que la pantalla
despierte siga ahí, con el cursor en su lugar y sin corrimiento.

**Decisión (2026-11-22, product-owner):** el perfil público entra al presupuesto en su versión más pesada de verdad: con la foto de la persona, más de 24 animales en adopción con foto (así aparece «Ver más»), una camada, 50 avales y adopciones con seguimiento, sin sesión y con la sesión de otra persona; 150 KB de código al abrir, menos de 2,5 segundos y corrimiento por debajo de 0,05, con red y procesador de teléfono de gama media. Cierra KL-12-2, porque las pruebas ya publican animales con foto. Motivo: desde #238 es el enlace que la rescatista pega en el grupo, y la prueba de #12 lo mide sin foto y sin animales, que es justo lo que pesa. (docs/07 §Presupuesto de performance; docs/known-limitations.md KL-12-2)

**Decisión (2026-11-22, product-owner):** el código total del perfil, medido un rato después de abrir, no puede pasar el que tiene antes de esta historia, como en #95, #304 y #324. Motivo: sin ese tope, bajar el peso al abrir se resuelve mandando lo mismo un segundo después, y quien tiene mala señal lo paga igual. (docs/07 §Presupuesto de performance)

**Decisión (2026-11-22, product-owner):** «Ver más» suma la lista de toques que deben contestar en menos de 200 ms (#313), en el perfil y en el listado, porque es el mismo botón. Motivo: es el toque que separa ver la primera tanda de ver todos los animales de una rescatista, y quedó afuera de #313. (docs/07 §Presupuesto de performance; docs/10, «Ver más»)

Cómo se construyó (historia #332): el perfil se mide en `tests/e2e/perfil-rendimiento.spec.ts` con
una rescatista propia de la corrida: foto, 29 animales con foto y una camada a la vista, 50 avales
(los de las personas sembradas que avalan a Eva), la identidad verificada y 2 adopciones con el
seguimiento respondido. Ya entraba: abre con 149,2 KB (152.733 bytes) sin sesión y con la sesión de
otra persona, y no baja nada después de abrir, así que el tope del total es ese mismo número medido en
CI, que pesa unas decenas de bytes más que en local: 149,3 KB, el décimo de arriba. En local
el LCP queda entre 780 y 950 ms, la primera fila de fotos llega antes de los 700 ms y el corrimiento
es 0, también con las fotos de los animales demoradas 3 s. Quedan menos de 870 bytes de margen al abrir: lo
próximo que se le sume al perfil tiene que bajar después de abrir o sacar otra cosa. «Ver más»
contesta trabajando en 30 a 50 ms en el perfil y en el listado; la misma prueba mira que lo de antes no
se corra, que el primero nuevo quede a la vista, que dos toques seguidos sumen una sola vez y que sin
señal quede el aviso de siempre y volver a tocar pida la misma tanda. La prueba de Eva, con 50 avales
y sin animales, sigue igual.

## Estructura del proyecto

```
adopciones-mvp/
├── docs/                       ← esto
├── messages/
│   └── es.json
├── public/
├── src/
│   ├── app/
│   │   ├── [locale]/           ← rutas (next-intl); es sin prefijo en la URL
│   │   │   ├── (public)/       ← landing, listado, ficha (Server Components)
│   │   │   ├── (auth)/         ← login
│   │   │   ├── (app)/          ← perfil, verificación de teléfono, mis animales, bandeja, solicitudes
│   │   │   └── admin/
│   │   ├── api/
│   │   │   ├── cron/           ← expiración, seguimiento
│   │   │   └── og/             ← imagen de share
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 ← shadcn (copiado, personalizado)
│   │   ├── pets/
│   │   ├── applications/
│   │   └── verification/
│   ├── lib/
│   │   ├── supabase/           ← clients server/browser, tipos generados
│   │   ├── i18n/
│   │   ├── images/             ← resize, thumbhash
│   │   └── config.ts           ← APP_NAME, APP_URL (ver 04-nombre.md)
│   ├── actions/                ← Server Actions (mutaciones)
│   └── styles/
│       └── globals.css         ← tokens de diseño (CSS variables) + Tailwind
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── emails/                     ← React Email templates
```

## Versiones: siempre la última

**Regla (2026-09-16): toda tecnología que entre al proyecto entra en su última versión estable.**
Paquetes npm, majors de framework, APIs de terceros, SDKs, integraciones. Sin excepción.

Cómo se aplica:
- Antes de instalar o recomendar algo, **verificar la versión actual** (`npm view <pkg> version`,
  docs oficiales, context7). No fiarse de memoria: lo que "se sabe" suele tener un año.
- Instalar con `@latest`. Nunca fijar a un major viejo "porque lo conozco".
- **"Última" es la última que el gestor admite** (decisión 2026-09-19): pnpm 12 rechaza por
  defecto un paquete publicado hace menos de 24 h, que es la ventana en la que se detecta uno
  comprometido. Esa política no se relaja ni se exceptúa. Si `@latest` tiene menos de un día, entra
  la anterior y Renovate trae la nueva cuando cumpla el día (`minimumReleaseAge` en
  `renovate.json`). Se ve con `npm view <pkg> time`.
- Si una librería no soporta la última versión de otra (ej. no soporta Next 16), se busca
  alternativa antes que bajar la versión de la principal.
- Las versiones instaladas se listan en el README del código con fecha, para saber cuándo se
  revisaron por última vez.
- Renovate o Dependabot activos desde el primer commit, con PRs automáticas de actualización.

Versiones verificadas al escribir este doc (2026-09-16): Next.js 16.3.x, Tailwind v4, Motion
(paquete `motion`, ya no `framer-motion`). Volver a verificar al scaffoldear.

## Riesgos conocidos de los tiers gratuitos

- **Supabase free pausa el proyecto tras 7 días sin actividad.** Un cron diario de Vercel que
  pegue a la DB lo mantiene despierto. Documentarlo en el README para no asustarse.
- **Vercel Hobby es para uso no comercial.** Hoy encaja. Si algún día se monetiza, es Pro
  (US$20/mes).
- **Vercel Cron en Hobby corre una vez al día**, a cualquier minuto de su hora. Por eso las tareas
  de minutos y de horas corren en `pg_cron` (decisión 2026-09-26) y Vercel Cron solo llama a la
  vigilancia diaria (decisión 2026-10-10). No hay nada en tiempo real en el MVP.
- **Twilio** requiere tarjeta y aprobación de sender para WhatsApp. Empezar con SMS.
- **Twilio Messaging no trae lo que traía Verify** (decisión 2026-09-22): al crear la cuenta, solo
  Uruguay en *Messaging Geographic Permissions* y la protección contra fraude de mensajes
  encendida (KL-010). Y el proyecto de Supabase en la nube tiene que tener el proveedor de teléfono
  **apagado**: el check de `tests/gates/phone-sign-in.test.ts` solo ve la configuración local
  (KL-017).

## Dependencias instaladas

Una línea por dependencia, con la fecha en que entró y por qué (regla 7 de `CLAUDE.md`). Las
versiones exactas viven en `package.json` y el README las lista con su fecha de verificación;
Renovate las mantiene al día.

**2026-09-18, F00 (historia #1).** En ejecución:

- `next`, `react`, `react-dom`: el framework. Next 16.3 chequea tipos con el `tsc` del proyecto,
  que es lo que lo hace andar sobre TypeScript 7.
- `next-intl`: i18n, con un solo idioma y español sin prefijo (`06-i18n.md`).
- `@supabase/supabase-js`: el cliente de la base. **`@supabase/ssr` todavía no**: es plomería de
  sesión y entra con la historia de registro e ingreso.
- `@radix-ui/react-dialog`, `react-select`, `react-toast`: la base accesible de `Dialog`, `Sheet`,
  `Select` y `Toast`. Tres paquetes con alcance y no el unificado `radix-ui`, que arrastra unos
  cuarenta primitivos: manda el presupuesto de JS. `Toast` va sobre Radix y no sobre Sonner, que
  es lo que hoy sugiere shadcn, porque Sonner no está en este stack.
- `class-variance-authority`, `clsx`: variantes con `cva` y `cn()`, como pide
  `08-convenciones-codigo.md` §Estilos. `tailwind-merge` entró acá y salió el 2026-10-09
  (§Presupuesto de performance): pesaba unos 8 KB en cada pantalla.

De desarrollo:

- `typescript` 7, `@types/node`, `@types/react`, `@types/react-dom`.
- `tailwindcss`, `@tailwindcss/postcss`: Tailwind v4; los tokens entran por `@theme`.
- `oxlint` y `oxlint-tsgolint`: el linter, y su lint con tipos. El segundo recupera 59 de las 61
  reglas que typescript-eslint dejó sin soporte al romperse con TypeScript 7; entra ahora para que
  `no-floating-promises` exista antes que la primera Server Action (decisión de Hernán).
- `prettier`: formato, verificado dentro de `pnpm lint`. Gobierna el código, no la prosa.
- `vitest`: pruebas. `@stryker-mutator/core` y `@stryker-mutator/vitest-runner`: mutation testing.
- `@playwright/test`: e2e contra `next start`, y el navegador del driver de capturas.
- `@lhci/cli`: Lighthouse CI contra el build de producción local.
- `lefthook`: el gancho de pre-commit. Una sola dependencia, jobs en paralelo y filtrado de
  archivos preparados sin otra herramienta (decisión de Hernán).
- `supabase`: el CLI, como dependencia y no como herramienta de la máquina (ver §Decisiones).
- `renovate`: **solo por su validador de configuración**. Es pesado, pero no hay validador
  publicado aparte (`renovate-config-validator` en npm es un placeholder `0.0.1`), y la compuerta
  tiene que poder correr sin red.

**2026-09-19, F01 (historia #9, registro e ingreso).** En ejecución:

- `@supabase/ssr` 0.12.7: la plomería de sesión en cookies entre Server Components, Server Actions
  y el proxy. Estaba diferida a esta historia desde F00, como dice la línea de arriba.
- `react-hook-form` 7.88.0 y `@hookform/resolvers` 5.9.1: instalados para los dos formularios de
  la historia y no usados por ninguno. **Desinstalados el 2026-09-19** (ver §Decisiones).
- `zod` 4.6.5: un schema por formulario, el mismo en el cliente y en la Server Action, como pide
  `08-convenciones-codigo.md`.
- `resend` 6.28.1: el correo del enlace lo manda el producto y no el servicio de autenticación,
  para que su texto viva en `messages/es.json` y sea traducible desde el primer día (`06-i18n.md`).
  Sin dominio propio todavía (`04-nombre.md`), el envío real se enciende por variable; sin ella el
  mensaje se escribe a archivo y de ahí lo lee la prueba de punta a punta.
- **Decisión (2026-09-19): sin React Email.** El plan lo preveía, pero al instalar apareció que
  `@react-email/components` está **deprecado** y arrastra treinta subdependencias deprecadas, y
  que su sucesor, el paquete unificado `react-email` 6.x, importa `prismjs`, `marked` y
  `tailwindcss` en el bundle de runtime (issue abierto resend/react-email#3556). Con **un solo
  correo** en todo el producto, la plantilla se escribe como HTML con estilos en línea: cuarenta
  líneas, cero dependencias y ningún riesgo para `next build`, que es parte de `pnpm verify`. El
  texto igual sale de `messages/es.json`, que era el motivo de mandar el correo nosotros. Se
  reevalúa cuando haya varias plantillas que compartan diseño; ahí una librería paga su costo.

No entraron, y el motivo queda escrito para no rediscutirlo: `posthog-js`, `posthog-node` y
`@sentry/nextjs` (la medición y los errores salen del servidor por la API de cada servicio, con
`fetch`; decisión 2026-10-10, historia #169),
`browser-image-compression` (el canvas alcanza, también para las fotos de los animales, que
trajeron `thumbhash` en la historia #53), un decodificador de HEIC (ver `known-limitations.md`), y cualquier
primitiva de casilla o de combobox: `Checkbox` y `Suggest` se construyen sobre elementos nativos.

**No se usó el CLI de shadcn**, aunque el stack nombra shadcn/ui: su `init` reescribe la hoja de
estilos que vigila la compuerta de tokens, y sus componentes importan una librería de iconos que
este stack no registra. Las primitivas están escritas a mano sobre Radix, con tres iconos como
SVG inline. No hay `components.json`.

**2026-09-26, historia #53 (publicar un animal).** En el plan:

- `thumbhash` 0.1.1: el marcador de posición de cada foto de un animal, una mancha de color de
  unos 25 bytes guardada con la foto (§Imágenes). Es la última versión (publicada el 2023-03-22), del
  autor del formato, sin dependencias. Entra con esta historia, como anotaba «No entraron».
  `browser-image-compression` sigue afuera: el canvas alcanza, como en la foto de perfil.
- `@jsquash/webp` 1.5.0 (2026-09-27, revisión de la historia #53): la última (publicada el
  2025-05-12), libwebp compilado a WASM, del proyecto Squoosh. Safari no sabe exportar WebP desde un
  canvas y devuelve un PNG sin avisar, así que desde un iPhone ninguna foto pasaba la comprobación
  de WebP del servidor. `canvasToWebp` (`lib/images/`) usa el canvas cuando sabe y, si no, este
  codificador, que se baja solo en ese caso: en Chrome y Firefox no suma nada al JS inicial. Se
  mantiene la decisión de guardar solo WebP en vez de aceptar también JPEG.

**2026-10-09, historia #73 (administrar el sitio desde un solo lugar).** Sin dependencias nuevas.

- **Decisión (2026-10-09, historia #73): el resumen de la mañana corre por `pg_cron` y `pg_net`,
  no por Vercel Cron.** `cron.schedule('admin-digest', '0 11 * * *', ...)` (las 8 de Uruguay, que
  no tiene horario de verano) llama a `admin_digest_tick`, que con `pg_net` despierta
  `/api/cron/resumen` con el secreto de Vault, como las tareas de #11 y #59. Hasta el MVP no hay
  Vercel, y así el resumen corre igual en local que en la nube. `claim_admin_digests` reclama a
  cada persona en una sola sentencia y deja una fila por persona y día (`admin_digest_sends`), que
  impide el segundo envío aunque la tarea corra dos veces; un resumen que no salió no se reintenta
  ese día (KL-73-1, research R8).
- **Decisión (2026-10-09, historia #73): la búsqueda por nombre pliega tildes en la base, sin
  `unaccent` ni `pg_trgm`.** `private.fold_name` traduce las letras con tilde del español, baja a
  minúsculas y junta los espacios; alcanza para nombres de Uruguay y no suma una extensión
  (KL-73-2, research R6).
- **Decisión (2026-10-09, historia #73): quien administra lee por funciones `admin_*` que preguntan
  `is_admin()` adentro;** ninguna policy de tabla se ensancha (como lo público desde #57). La única
  policy nueva es de Storage, `avatars_select_admin`: quien administra firma la foto de perfil de
  cualquiera, que la ficha y la búsqueda muestran (research R1, R10).

**2026-10-05, historia #13 (reportar, bloquear y suspender).** Sin dependencias nuevas: `pgcrypto`
(`extensions.hmac`) y Vault, que trae Supabase, guardan el número retenido; `pg_cron` (#11) lo purga.

- **Decisión (2026-10-05, historia #13): la puerta de la cuenta suspendida vive en cada página y en
  `getSessionUser`, cerrada ante la duda.** `getAccountStanding()` (una consulta por pedido, solo
  con sesión, cacheada con `cache`) devuelve `active`, `suspended` o `unknown`, y `standingGate`
  (`lib/moderation/standing-gate.ts`) manda `suspended` y `unknown` a `/cuenta-suspendida`, que
  vuelve a preguntar. La usan las Server Actions, los Route Handlers con sesión y `requireProfile`;
  cada `page.tsx` de `(public)` y `(auth)` llama a `redirectIfSuspended()`. Va en la página y no en
  el layout porque un layout no se vuelve a pintar al navegar dentro de su grupo. `lookupSession`
  (la sesión sin puerta) queda para una lista cerrada que fija `src/lib/auth/session-gate.test.ts`.
  No es un cambio transversal de stack: no cambia el proveedor ni cómo se guarda la sesión, agrega
  una pregunta dentro de la puerta que ya existía. Descartado: el chequeo en `proxy.ts` (una ida a la
  base en cada pedido), un claim en el JWT (dura una hora) y abrir ante la duda. Detalle en
  `specs/013-reportar-bloquear-suspender/research.md` (R4).
- **Decisión (2026-10-05, historia #13): el número retenido es un HMAC con fecha.** El número
  verificado de una cuenta suspendida no se verifica en otra; al borrarla, un trigger `before
  delete` sobre `auth.users` guarda en `withheld_numbers` el HMAC-SHA-256 del número con una clave
  que vive solo en Vault (`withheld_number_key`) y `until` a 12 meses, sin nada que lo una a la
  cuenta y sin ninguna policy: nadie lo lee, tampoco quien administra. Un `pg_cron` diario borra los
  vencidos. El trigger nunca impide el borrado (Ley 18.331): si algo falla, deja un `warning` y la
  cuenta se borra igual. Descartado: el número en claro, un SHA-256 sin clave (se invierte
  recorriendo los ~10 millones de números uruguayos) y `hashtext` (32 bits: choques). Detalle en
  research R8.
- **Medido (2026-10-05, historia #13, T061):** con red y CPU de teléfono, la ficha abre en 149,9 KB
  (149,6 en `main`), «no está publicado» en 149,9, el listado en 147,3, la portada en 145,1, y la
  ficha con sesión en 149,9. La puerta suma una consulta en el servidor y nada de JS. Lo que la
  pasaba (+1,6 KB) era el cargador de `next/dynamic`, que la ficha no tenía: «Desbloquear» y los
  avisos que se cargan solos (`lazy-notices`) pasaron a `lazy` de React, que ya está en el bundle,
  como `ListingShell`. A la ficha le quedan 0,1 KB de aire.

**2026-09-30, historia #59 (mantener al día cada publicación).** Sin dependencias nuevas: `sharp`
(#57) pasa la portada a JPEG para el correo y `pg_cron` y `pg_net` (#11) despiertan la tarea.

- **Decisión (2026-09-30, historia #59): vencida y dada de baja se derivan, no se guardan.**
  `pets.status` guarda solo lo que elige el publicador (`available`, `in_process`, `paused`,
  `adopted`); vencida es `expires_at <= now()` sobre una a la vista y dada de baja es
  `taken_down_at` no nulo. Una sola función de la base, `private.pet_state`, dice el estado, y
  `lifecycleOf` (`lib/pets/lifecycle.ts`) hace la misma cuenta en TypeScript, con un test de
  paridad. Así una publicación sale del listado en el instante en que vence, sin una tarea que
  llegue tarde (research R1).
- **Decisión (2026-09-30, historia #59): «Sigue disponible» es un enlace guardado como hash.** El
  token son 32 bytes al azar en base64url; la base guarda su SHA-256 en `pet_renewal_links`, sin
  acceso para `anon` ni `authenticated`, con vencimiento a los 30 días y borrado en cascada con el
  animal: borrarlo invalida el enlace sin una lista de revocados, que un token firmado con un
  secreto necesitaría. El toque es un Route Handler que renueva y redirige a una página que solo
  lee; los lectores de vista previa no renuevan (research R5, KL-59-1).

**2026-09-28, historia #57 (ver los animales y compartir la ficha).** En el plan:

- `sharp` 0.35.5: la última (verificada con `npm view` el 2026-09-28), ya en el árbol como
  dependencia opcional de Next, pasa a dependencia directa. La imagen de la vista previa se arma con
  `next/og` (§El stack), que solo decodifica PNG, JPEG, GIF y SVG, y todas las fotos de los animales
  son WebP: `sharp` pasa la portada a JPEG en el servidor antes de armarla. Corre solo en la ruta de
  la imagen, en Node; no llega al navegador. Detalle en `specs/009-ver-animales-compartir/research.md`
  (R6).
- **Decisión (2026-09-28, historia #57): lo público se lee por funciones de la base, no por
  policies anchas.** `listed_pets`, `pet_by_code` y `pet_share_card` son `security definer`, llevan
  adentro la regla «a la vista» (el publicador tiene hoy nivel 1) y devuelven solo columnas
  públicas: RLS filtra filas y no columnas, y abrir la fila de `profiles` de un publicador abriría
  también su zona. Las páginas leen con la sesión de quien mira o como anónimo, nunca con la clave
  de servicio. El TTL del número a medias, que las escrituras reciben como parámetro, acá está
  fijo en `private.pending_ttl()`, con un test de paridad contra `lib/verification/rules.ts`
  (research R1).
- **Decisión (2026-09-28, historia #57): las fotos siguen en el bucket privado** y se firman por
  una hora con la sesión de quien mira; dos policies de Storage dejan firmar solo las fotos de un
  animal a la vista y la foto de perfil de quien tiene uno. Resuelve lo que la decisión de #53 de
  abajo dejaba para «la historia que hace públicas las fichas»: una URL vence sola, y un bucket
  público dejaría la foto abierta para siempre a quien guardó la dirección (research R2, KL-57-1).
- **Decisión (2026-09-28, historia #57): la vista previa es una imagen propia** armada con
  `next/og` y `sharp` en `/animales/{code}/imagen`: la portada entera y, al lado, el nombre y la
  zona (nunca texto sobre la foto; debajo obligaba a recortar la portada), en JPEG de menos de
  300 KB, con la versión en la dirección para que las apps pidan la nueva cuando cambia (research
  R6).
- **Decisión (2026-09-26, plan de la historia #53): las fotos de los animales van a un bucket
  privado mientras nadie más que su dueña las ve.** §Imágenes dice «bucket público», pensado para
  las fichas públicas; en esta historia la publicación la ve solo quien la publicó, así que las
  fotos se sirven con URLs firmadas, con carpeta por dueña, como la foto de perfil. La historia que
  hace públicas las fichas decide cómo se leen las de una publicación disponible.
- **Decisión (2026-09-26, historia #53): las fotos de un animal se muestran con un `<img>` con
  `srcSet` y no con `next/image`.** Las URLs firmadas cambian en cada carga: el optimizador
  guardaría una copia por firma, y el WebP ya viene del tamaño justo. El ThumbHash va de fondo,
  armado como data URL en el servidor, y se va con un fundido cuando llega la foto. Mismo criterio
  que `Avatar`. Reemplaza el paso 5 de §Imágenes mientras las fotos sean privadas.
- **Decisión (2026-10-20, historia #169): las fotos de un animal se piden al mismo origen que la
  página.** `/fotos/:path*` es un rewrite de Next (`lib/supabase/storage-rewrite.ts`) a los
  objetos firmados de Storage: Vercel lo reenvía sin función, y la URL lleva la misma firma de una
  hora, así que la foto deja de abrirse igual que antes (FR-018 de #57) y sin firma Storage
  responde 400. Motivo: en
  el sitio de verdad el LCP del listado (2,7 s) y de la ficha (2,9 s) pasaba los 2,5 s, y el
  desglose mostraba casi 1 s antes de bajar la portada: el teléfono abría una segunda conexión, a
  Supabase. React 19 ya precargaba la portada desde el `<head>`, así que avisar o precargar no
  alcanzaba. Cambia el descarte del proxy en la research R2 de #57, y su costo sigue en pie: cada
  foto pasa ahora por Vercel y cuenta en los 100 GB por mes y en los pedidos de Hobby, que al
  llegar al tope pausa el proyecto, además de la salida de Supabase. Se acepta porque una card
  pesa decenas de KB y la beta cerrada es de pocas personas; se mira en Vercel → Usage, y si se
  acerca al tope, lo siguiente son fotos con dirección fija y caché. Lo que sí cambia frente a R2:
  no hay una función que ejecutar. El rewrite acepta solo la forma exacta de una foto
  (`pet-photos/{dueña}/{foto}/{thumb|card|full}.webp`), no otra ruta de Supabase. La primera card
  del listado sube a `fetchPriority="high"`, como la portada de la ficha.
- **Decisión (2026-09-26, historia #53): la ruta de cada foto es
  `pet-photos/{dueña}/{foto}/{thumb|card|full}.webp`**, y no `pets/{pet_id}/…`. La foto sube
  antes de que exista la publicación —a una zona de espera, una por una, para que el progreso y el
  reintento sean posibles— y la carpeta de la dueña es la que la policy compara con la sesión y la
  que barre el borrado de la cuenta. Sube solo el servicio: el bucket no tiene policy de escritura.
- **Decisión (2026-09-26, historia #53): `experimental.serverActions.bodySizeLimit` a 2 MB.** Cada
  foto viaja sola en su acción con sus tres tamaños, que juntos no pasan de 1,5 MB (si pasan, se
  vuelve a exportar con menos calidad y, si igual pasan, se rechaza). El default de 1 MB la
  cortaría; 2 MB deja lugar al multipart sin abrir la puerta a cargas grandes.
- **Decisión (2026-09-26, plan de la historia #53): `serverActions.bodySizeLimit` a 2 MB.** Cada foto
  sube en su propia Server Action con sus tres tamaños (hasta 1,5 MB juntos); el default de Next es
  1 MB. Detalle en `specs/007-publicar-animal/research.md` (R1, R2).

## Descartado

Notas visuales de este doc que la guía de diseño dejó sin efecto. Siguen en su lugar como
historia, marcadas arriba de su sección; no se construye con ellas.

- **Aparición escalonada de cards al scroll con `whileInView` (2026-09-17).** `10-design-system.md`
  principio 4: nada se mueve solo; es el default genérico.
- **El borde del input toma el color de acento al foco (2026-09-18).** El acento es para error y
  urgencia. Al foco, la línea de tinta del renglón engrosa.
- **Chips de filtro que cambian de color al activarse (2026-09-18).** Son tiritas: la activa se
  llena de tinta, baja y se inclina.
- **Una tipografía con carácter para títulos y una neutra para el resto (2026-09-17).** Una sola
  familia variable; la voz de afiche es su ancho condensado.
- **Paleta cálida (2026-09-17).** Fondo blanco: las fotos se ven mejor, y el crema con terracota
  es el look genérico que se evita a propósito.
- **Cards con foto casi sin borde y nombre superpuesto (2026-09-18).** La foto va pegada con
  cinta, sin texto encima; nombre y zona debajo.

## Decisiones

- **Decisión (2026-09-27, product-owner):** los avisos de error no llevan datos de la persona ni lo
  que escribió, igual que la medición (#9, #71). Motivo: es el mínimo que alcanza para arreglar el
  error (docs/01 §Legal / datos), y así no sale ningún dato personal nuevo del sitio. (docs/07)
- **Decisión (2026-10-10, product-owner):** el sitio de verdad arranca sin las personas ni los
  animales sembrados de prueba; el equipo prueba con cuentas propias y lo que crea se borra antes
  de invitar (#76). Motivo: un animal de prueba en el listado de la beta es lo primero que vería un
  rescatista, y una persona sintética contaría en las métricas de éxito. (docs/07)
- **Decisión (2026-10-10, enjambre, historia #169): `engines.node` baja el piso a `>=24` para que
  Vercel construya y corra el sitio.** La página de versiones de Vercel (actualizada el 2026-02-27,
  consultada el 2026-10-10) ofrece 24.x, 22.x y 20.x para construcciones y funciones; con `>=26`
  no hay versión que lo cumpla. La regla de las últimas versiones manda buscar otra cosa antes que
  bajar, pero cambiar de alojamiento es un cambio transversal (su propio PR) y Vercel es el que
  eligió esta doc. No se fija nada viejo: la máquina del equipo y CI siguen en Node 26, la última;
  solo se declara un piso más bajo, y Vercel toma la 24.x más nueva. Se comprobó antes del cambio
  con Node 24.21 en la máquina: las pruebas unitarias y de compuertas, `pnpm build` y las e2e,
  verdes. Vuelve a `>=26` cuando Vercel lo ofrezca (KL-169-1). Detalle en
  `specs/021-sitio-andando-de-verdad/research.md` R4.
- **Reemplazada el 2026-10-18 (abajo).** **Decisión (2026-10-10, agente, historia #169): los datos de las personas viven en la Unión
  Europea.** La base y sus imágenes en Supabase Cloud `eu-central-1` (Frankfurt), las funciones en
  Vercel `fra1`, PostHog en su nube EU y Sentry en la región `de`. Motivo: la Ley 18.331 (art. 23)
  solo permite llevar datos personales a un país con nivel adecuado según la Unidad Reguladora, que
  incluye a la UE (Res. 23/021); Brasil quedó como no adecuado y de Estados Unidos no se pudo
  confirmar que los proveedores estén en el Data Privacy Framework. La distancia (~230 ms de ida y
  vuelta) se paga una vez por pedido porque el servidor está al lado de la base; si una pantalla no
  entra en el presupuesto, gana la ley y se trabaja el caché, no la región. Detalle en research R2.
- **Decisión (2026-10-16, Hernán): para la prueba de rendimiento, la base en Supabase `sa-east-1`
  (São Paulo) y las funciones en Vercel `gru1`.** Cambia la decisión anterior solo mientras el
  sitio es una prueba sin personas reales.
  **Verificado (2026-10-16): Brasil no es adecuado.** La Resolución 47/021 de la URCDP lo cita dentro
  del catálogo de países no adecuados de la 23/021; la 63/023 amplió la lista con Corea y las
  organizaciones del Marco de Privacidad de Datos de EE. UU., sin sumar a Brasil. Trasladar datos de
  personas a `sa-east-1` pediría una excepción del art. 23 o la autorización de la URCDP. Por eso
  **antes de invitar a cualquier persona la base y las funciones vuelven a la UE** (`eu-central-1` y
  `fra1`); mientras tanto el sitio de São Paulo solo lleva cuentas y datos del equipo. No es
  asesoramiento legal: antes de abrir la beta lo confirma quien corresponda.
- **Decisión (2026-10-18, Hernán): todo en Brasil, donde se pueda; la Unión Europea queda
  descartada y no hay mudanza.** La base y sus imágenes siguen en Supabase `sa-east-1`, las
  funciones en Vercel `gru1`. Los servicios sin región en Brasil van a la más cercana: PostHog US
  Cloud, Sentry US, Twilio US1; Resend manda desde `sa-east-1` cuando exista el dominio propio
  (#76). Motivo: la velocidad desde Uruguay y una sola región para todo. Lo que cambia de la ley:
  Brasil y EE. UU. no son adecuados para la URCDP (verificado el 2026-10-16), así que el traslado
  se apoya en una excepción del art. 23 de la Ley 18.331, el consentimiento expreso de la persona.
  Pedirlo al registrarse queda para antes de invitar a alguien (#76). El proyecto de Frankfurt
  (`adopciones-mvp`, pausado) no se usa.
- **Decisión (2026-10-10, agente, historia #169): sin direcciones de prueba.** `vercel.json`
  despliega solo `main` (`git.deploymentEnabled`). Motivo: una dirección de prueba contra la base de
  verdad le mostraría datos personales a un cambio sin revisar, y el pipeline ya prueba todo contra
  `next start` en local. Lo que haría falta para prenderlas (otro proyecto de la base, sin
  `TWILIO_*`) está en `docs/puesta-en-marcha.md`. Detalle en research R1.
- **Decisión (2026-10-10, agente, historia #169): las migraciones llegan a la base en la
  construcción, antes que el código.** El comando de construcción de Vercel es
  `node scripts/deploy/build.mjs`: en producción corre `supabase db push` (sin `--include-seed`,
  con `--skip-vault`) y después `pnpm build`. Motivo: el enjambre mergea solo, y el código nuevo
  nunca tiene que salir antes que su base; las migraciones son aditivas, así que una base un paso
  adelante no rompe nada. Descartado: un paso de GitHub Actions (`.github/` es compuerta) y la
  integración de GitHub de Supabase (no corre antes del código). Detalle en research R3.
- **Decisión (2026-10-10, agente, historia #169): PostHog y Sentry sin SDK, desde el servidor.**
  `track.ts` y `lib/errors/report.ts` arman el cuerpo con una función pura y probada
  (`posthogEvent`, `failureEnvelope`) y lo mandan con `fetch` después de responder (`deliver()`,
  `after()` de Next, 3 s de tope); solo en Vercel y con la clave del servicio (`shouldDeliver`).
  Motivo: sale exactamente lo que dicen los contratos, sin un byte más en el navegador (la ficha
  abre en 141,6 KB de 150), sin una cookie que una visitas y sin grabar la pantalla. Descartado:
  `posthog-js`, `posthog-node`, `@sentry/nextjs`. Detalle en research R5, R8 y R9.
- **Decisión (2026-10-10, agente, historia #169): cada tarea anota su vuelta y una vigilancia
  avisa la que se atrasa.** `private.task_runs` guarda la última vuelta completa de cada tarea;
  `/api/cron/vigilancia` la lee y, con `staleTasks` (`lib/cron/`), avisa al registro de errores la
  que pasó el doble de su frecuencia (25 h las diarias, 26 h la de Vercel), una vez por tarea y por
  día de Uruguay. Avisa también la tarea cuya llamada a la aplicación no respondió 2xx: la base no
  espera la respuesta y anota la vuelta igual, así que cada pedido de `pg_net` queda anotado con su
  tarea (`private.task_calls`) y sin los secretos de Vault la tarea falla. La llaman la base cada 15
  minutos y Vercel Cron una vez por día, que además mantiene despierta la base del plan gratuito.
  Con la aplicación caída nadie avisa (KL-169-3).
  Detalle en research R6 y R7.
- **Decisión (2026-09-26, historia #11): `pg_cron` y `pg_net`, las extensiones de Postgres que trae
  Supabase, para lo que no puede esperar al cron diario.** El pedido de verificación de identidad
  vence a los 7 días y sus imágenes se tienen que borrar dentro de la hora siguiente; el borrado se
  hace en la base, cada 5 minutos, sin depender de que la aplicación esté levantada. `pg_net` solo
  avisa a una ruta de la aplicación para que mande el correo de vencimiento. Vercel Cron sigue para
  las tareas diarias. Sin versión propia: son las de la imagen de Supabase, local y en la nube. No
  es un cambio transversal: no toca framework, estilos, componentes ni auth.
- **Decisión (2026-09-22): el código del teléfono es del producto; Twilio solo lo entrega**
  (historia #10). La fila decía «Twilio Verify vía Supabase Auth». Se probaron tres caminos:

  | Camino | Por qué no |
  |---|---|
  | OTP de teléfono de Supabase Auth (`updateUser({ phone })` + `verifyOtp`) | Dice "teléfono ya registrado" al pedir el código, que le cuenta a cualquiera si un número tiene cuenta; no cuenta intentos por código; no tiene un número a medias que se cancele y devuelva el anterior; su texto vive en `config.toml` y no en `messages/es.json`; y hace del teléfono una forma de entrar |
  | Twilio Verify directo | Twilio genera el código y el texto (fuera de `messages/es.json`); un reenvío dentro de los 10 minutos manda el mismo código; y en local habría que simular Verify entero, así que las reglas se probarían contra la simulación |
  | **El producto genera y comprueba; Twilio Messaging entrega** | Una sola implementación de las reglas, la misma en local, en CI y en producción. Es lo que la historia #9 hizo con el correo |

  No es un cambio transversal de stack: el ingreso sigue en Supabase Auth, el teléfono no es una
  forma de entrar, y el proveedor sigue siendo Twilio. Las reglas con consecuencias —topes,
  intentos, verificar— viven en funciones de Postgres con candado; el código se guarda como HMAC
  con una clave derivada de la de servicio. Sin dependencias nuevas: el mensaje sale con `fetch`
  y el HMAC con `node:crypto`. Detalle en `specs/003-verificacion-de-telefono/plan.md`.
  **A validar por Hernán.**
- **Decisión (2026-09-19): sin librería de formularios.** `react-hook-form` y
  `@hookform/resolvers` se instalaron en F01 y no los importó nadie: el formulario de ingreso
  tiene un campo y el de perfil cuatro, y los dos quedaron más cortos con el estado de React y
  `validateProfile` llamado a mano que con el registro de la librería. El motivo original de la
  fila —«el cuestionario es un formulario largo»— sigue siendo cierto, pero ese cuestionario
  todavía no se escribió: sostener una dependencia por un formulario que no existe es la
  abstracción especulativa que la regla 2 de CLAUDE.md prohíbe, y para cuando llegue, la
  versión fijada hoy va a estar vieja (regla 1). Volver a entrar cuesta un `pnpm add
  react-hook-form@latest` y su línea acá, decidido con el cuestionario a la vista y no antes.
- **Decisión (2026-09-16):** Next.js 16 + Supabase + Tailwind v4 + shadcn/ui + Motion + next-intl.
- **Decisión (2026-09-16):** imágenes procesadas en el cliente al subir, 3 tamaños WebP + ThumbHash.
- **Decisión (2026-09-16):** sin modo oscuro, sin app nativa, sin monorepo en el MVP.
- **Decisión (2026-09-16):** presupuesto de performance como gate para la beta.
- **Decisión (2026-09-16):** siempre últimas versiones estables de todo. MUST.
- **Decisión (2026-09-17):** la guía de diseño es `10-design-system.md`; donde difiera de las notas
  visuales de este doc, gana la guía.
- **Decisión (2026-09-19):** presupuesto de **LCP en 2,5 s**, el estándar de Core Web Vitals, en
  lugar de 2,0 s (ver §Presupuesto de performance).
- **Decisión (2026-09-19):** **"última versión" significa la última con más de 24 h**, que es lo
  que pnpm 12 admite (`minimumReleaseAge`). La CI del PR de F00 falló al instalar porque el
  lockfile traía `renovate` 44.103.0, publicado ese mismo día; `renovate` saca varias versiones
  por día, así que su `@latest` nunca cumple el día. Quedó en 44.97.4. Se mantuvo la política en
  lugar de exceptuar el paquete: `renovate` arrastra cientos de dependencias, y que sean de
  desarrollo no las saca de la máquina de Hernán ni de la CI.
- **Decisión (2026-09-18):** el **Supabase CLI entra como dependencia de desarrollo**
  (`supabase` en npm, 2.117.0 ese día), no como herramienta instalada en la máquina. El motivo es
  la paridad que pide el flujo de trabajo: con el CLI en el `package.json`, el lockfile garantiza
  que la máquina y CI corran la misma versión, y Renovate la mantiene al día. Con la instalación
  del sistema la paridad dependía de que un pin en la CI coincidiera con lo que hubiera instalado,
  y el bucket de scoop estaba congelado en 2.101.0 desde mayo: una versión vieja terminaba
  decidiendo la del proyecto, al revés de la regla de últimas versiones. La 2.117.0 además avisó
  de una clave de `config.toml` que la 2.101.0 aceptaba en silencio (`[inbucket]` →
  `[local_smtp]`). Los scripts invocan el CLI **por ruta** y no por PATH, porque un `supabase` a
  secas puede resolver a la instalación del sistema: pasó en esta corrida y falló con un error de
  config confuso.

- **Decisión (2026-09-18):** **Stryker corre sin verificador de tipos, y eso tiene un costo que
  ahora está escrito.** Su verificador importa el paquete `typescript` para utilidades que la 7
  ya no expone, así que no puede usarse. Sin él, Stryker muta y Vitest transpila sin chequear
  tipos: un mutante que sería un error de tipos se ejecuta igual, y si los tests no lo matan
  cuenta como sobreviviente. Con el umbral en 100 %, eso puede poner la compuerta roja por un
  mutante imposible. No se toca el stack; se cierra la regla: `09-flujo-de-trabajo.md` tiene una
  segunda categoría de anotación, "no compila", distinta de "equivalente". Detalle y condición de
  reapertura en `known-limitations.md` (KL-003). F00 no muta nada, así que el costo empieza en M1.
- **Decisión (2026-09-17):** todo el proyecto corre sobre **TypeScript 7** y el linter es
  **oxlint**. Verificado en la máquina de Hernán ese día: `tsc` 7.0.2, `next build` 16.3.5
  (chequea tipos y falla ante un error), Vitest 5 y Stryker 10 con `inPlace` funcionan sobre
  TypeScript 7. El paquete de TypeScript 7 solo exporta su versión, así que typescript-eslint
  aborta y el verificador de tipos de Stryker no se puede usar. oxlint no depende del
  compilador y cubre TypeScript, React, Next.js, accesibilidad, imports y Vitest; lo que no
  trae (`no-restricted-syntax`) se resuelve con un check propio del repo.
- **Decisión (2026-10-16, Hernán): claves de API nuevas de Supabase (`sb_publishable_…` y
  `sb_secret_…`), nunca las legacy `anon` y `service_role`.** Las variables pasan a
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY`, los nombres de la guía oficial.
  Motivo: Supabase deprecará `anon` y `service_role` a fines de 2026; las nuevas no son JWT de larga
  vida, se rotan sin tocar la firma de las sesiones y la secreta responde 401 desde un browser. Lo
  que se sigue de la guía (docs/guides/api/api-keys, auth/server-side/nextjs, api/securing-your-api):
  - **El proxy verifica con `getClaims()`**, no con `getUser()` ni `getSession()`: con claves de firma
    asimétricas valida la firma en local, sin un viaje a Auth por pedido; `getSession()` no se usa
    para decidir nada en el servidor. El refresco vive solo en `src/proxy.ts`.
  - **La clave secreta nunca sale del servidor**: sin `NEXT_PUBLIC_`, y la compuerta `service-key`
    falla si aparece expuesta o versionada. Cada componente de servidor con su propia secreta, y
    se rota creando la nueva, reemplazándola en todos lados y recién después borrando la vieja.
  - **Cada tabla nueva trae sus `GRANT` y su RLS en la misma migración**: desde el 2026-10-30
    Supabase deja de exponer tablas nuevas a la Data API por defecto en todos los proyectos.
  - **Las claves viajan en el header `apikey`**, no en `Authorization: Bearer`.
  Las claves legacy se desactivan en el panel del proyecto de la nube; el CLI local imprime las dos
  familias y el repo usa solo las nuevas.
