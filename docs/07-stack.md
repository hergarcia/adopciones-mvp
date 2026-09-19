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
| Base de datos + Auth + Storage | **Supabase Cloud** (managed; Postgres, Auth, Storage, RLS) | Todo en uno, cero operación. Magic link, Google y OTP por teléfono nativos. Tipos generados como en Camellia. | 0 (free: 500 MB DB, 1 GB storage, 50k MAU) |
| Estilos | **Tailwind CSS v4** + **shadcn/ui** | Componentes accesibles (Radix) que se copian al repo y se personalizan a fondo. No se ve "de template" si se le pone diseño propio. | 0 |
| Animaciones | **Motion** (ex Framer Motion) con `LazyMotion` + `m` | ~5 KB en el render inicial. Layout animations, gestos, `whileInView`. Lo único "nuevo" del stack. | 0 |
| Transiciones de página | **View Transitions API** (nativa del browser) | Transición ficha → listado sin JS extra. Degrada elegante donde no hay soporte. | 0 |
| i18n | **next-intl** | Ver `06-i18n.md`. | 0 |
| Formularios | **react-hook-form** + **zod** | El cuestionario es un formulario largo. Zod comparte validación entre cliente y Server Actions. | 0 |
| Email | **Resend** + **React Email** | 3.000 emails/mes gratis. Templates en React, traducibles. | 0 |
| OTP teléfono | **Twilio Verify** (SMS o WhatsApp) vía Supabase Auth | Pago por uso, centavos por verificación. | ~US$0.05/OTP |
| Contacto | Link `wa.me` con texto prellenado | Cero costo, cero mantenimiento, es donde la gente ya habla. | 0 |
| Imagen de share (OG) | **`next/og`** (`ImageResponse`) | Imagen dinámica con la foto del animal, nombre y zona. Se genera en el edge. | 0 |
| Analytics + feedback | **PostHog** | Funnels, encuestas in-app (las 2 preguntas post-adopción) y session replay en una sola herramienta. 1M eventos/mes gratis. | 0 |
| Errores | **Sentry** | Free tier alcanza. Opcional hasta la beta. | 0 |
| Tareas programadas | **Vercel Cron** (diario) → route handler | Expiración de fichas, seguimiento a 30 días, recordatorios. Una corrida por día alcanza. | 0 |
| Lint/format | **oxlint** + Prettier | ESLint quedó atado a TypeScript 6; oxlint trae su propio analizador, corre sobre TypeScript 7 y no necesita el compilador. | 0 |
| Tests | **Vitest** para schemas y utils; **Playwright** para 2-3 flujos críticos, recién en beta | Lo mínimo que evita romper la solicitud de adopción sin darse cuenta. | 0 |

**Total estimado: dominio (~US$15/año) + OTPs. Menos de US$10/mes hasta tener volumen.**

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
| LCP | < 2,0 s |
| CLS | < 0,05 |
| INP | < 200 ms |
| JS inicial (gzip) | < 150 KB |
| Lighthouse Performance | ≥ 90 |

Se chequea antes de la beta. Si no da, se saca JS, no se agrega.

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
│   │   │   ├── (auth)/         ← login, verificación
│   │   │   ├── (app)/          ← perfil, mis animales, bandeja, solicitudes
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
- **Vercel Cron en Hobby corre una vez al día.** Alcanza para expiración y seguimiento; no
  alcanza para nada "en tiempo real". No hay nada en tiempo real en el MVP.
- **Twilio** requiere tarjeta y aprobación de sender para WhatsApp. Empezar con SMS.

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
- `class-variance-authority`, `clsx`, `tailwind-merge`: variantes con `cva` y `cn()`, como pide
  `08-convenciones-codigo.md` §Estilos.

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

**No se usó el CLI de shadcn**, aunque el stack nombra shadcn/ui: su `init` reescribe la hoja de
estilos que vigila la compuerta de tokens, y sus componentes importan una librería de iconos que
este stack no registra. Las primitivas están escritas a mano sobre Radix, con tres iconos como
SVG inline. No hay `components.json`.

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

- **Decisión (2026-09-16):** Next.js 16 + Supabase + Tailwind v4 + shadcn/ui + Motion + next-intl.
- **Decisión (2026-09-16):** imágenes procesadas en el cliente al subir, 3 tamaños WebP + ThumbHash.
- **Decisión (2026-09-16):** sin modo oscuro, sin app nativa, sin monorepo en el MVP.
- **Decisión (2026-09-16):** presupuesto de performance como gate para la beta.
- **Decisión (2026-09-16):** siempre últimas versiones estables de todo. MUST.
- **Decisión (2026-09-17):** la guía de diseño es `10-design-system.md`; donde difiera de las notas
  visuales de este doc, gana la guía.
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
