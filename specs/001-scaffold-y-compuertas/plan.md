# Implementation Plan: Scaffold y compuertas

**Branch**: `feature/1-scaffold-y-compuertas` | **Date**: 2026-09-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-scaffold-y-compuertas/spec.md`

**Revisión**: dos rondas de `plan-reviewer`, que es el tope que fija `stages/spec.md`. Ronda 1: 9
altos, 17 medios, 7 bajos. Ronda 2: 5 altos, 6 medios, 4 bajos, dos de ellos arreglos incompletos
de la ronda 1 (la exclusión de los fixtures y la forma de los globs). Todos aplicados; **no hubo
tercera ronda que verifique los arreglos de la segunda**, así que las suposiciones de esta revisión
—que el `--ignore-pattern` alcanza, que los globs `**/src/…` matchean los dos árboles, que la
función de identidad es la forma correcta de preguntarle a la base quién es la sesión— las verifica
el Build al primer intento, y cada una tiene su fila en §Riesgos.

## Desvíos al construir

Lo que el código terminó haciendo distinto de este plan, y por qué. El resto del documento quedó
como se planificó: es el registro de lo que se pensaba, y esto es lo que pasó.

- **No se usó el CLI de shadcn** (§Diseño «Cómo se crean», T046). Su `init` reescribe la hoja de
  estilos que vigila la compuerta de tokens, y sus componentes importan una librería de iconos
  que `docs/07` no registra. Las once primitivas están a mano sobre Radix, con tres iconos como
  SVG inline. No hay `components.json`.
- **`@radix-ui/react-slot` salió.** Estaba en el plan "por las dudas" y nada lo importaba: FR-049.
- **La identidad visual cambió a «Cartel»** después de que Hernán viera las primitivas y las
  encontrara genéricas. Toda la sección «Diseño» de este plan describe la dirección anterior.
  Manda `docs/10-design-system.md`; los tokens pasaron de 47 a 58.
- **El Supabase CLI es una dependencia de desarrollo**, no una herramienta de la máquina fijada
  en CI. El bucket de scoop estaba congelado en una versión vieja y terminaba decidiendo la del
  proyecto. CI ya no usa `supabase/setup-cli`.
- **`.lighthouserc.json` cambió más que la aserción de CLS**: traía `preset: "mobile"`, que
  Lighthouse rechaza, así que la etapa no podía correr en ninguna plataforma. Quedó con
  `formFactor` y emulación de pantalla explícitos (KL-002).
- **`/muestra` es dinámica**, no estática: con prerender, su `notFound()` quedaba congelado como
  una página 404 servida con estado 200.
- **El gancho corre la suite entera**, no un subconjunto: las exclusiones del plan no funcionaban
  y mantener en dos lugares qué corre es la divergencia que ya lo había hecho fallar.
- **La ronda 1 de revisión cerró compuertas que pasaban sin mirar.** Las claves de mensajes no
  estaban tipadas (next-intl 4 lee `AppConfig`, no `IntlMessages`); la demo de reglas de test
  probaba una sola; la regla de acceso a datos dejaba pasar `@supabase/*` desde `src/`;
  `jsx-no-literals` no ve atributos ni expresiones, y entró `adopciones/no-literal-visible-text`;
  la paridad de tokens comparaba el valor de 28 de 53 y ahora compara todos menos `--font-sans`;
  el chequeo de la service key corre también en el gancho y falla si no miró ningún archivo.
- **La muestra tiene un bloque cliente, no uno con los tres disparadores**: `Sheet` y `Dialog`
  se abren solos (Radix), así que sus bloques son Server Components; solo `toast-block.tsx`
  necesita estado.
- **`Sheet` no tiene variante `side`**: de dónde entra lo decide el ancho de la pantalla. `Card`
  solo se despega con `interactive`. El ceibo pasó a `#D23F2C` para llegar a AA en texto chico.
- **Los valores por defecto de Tailwind están apagados** en las familias que gobierna `docs/10`
  (ronda 2): sin eso, `max-w-sm` o `animate-spin` compilaban al lado de los tokens y la regla «un
  valor que no está en la guía no existe» no la vigilaba nadie. El anillo de foco global vive en
  `@layer base`: fuera de capa le ganaba a cualquier utilidad.
- **El driver de capturas apunta a `localhost`**: con `127.0.0.1` Next 16 no hidrata la página y
  las capturas de las primeras rondas eran de botones que no hacían nada.
- **`pnpm lighthouse` no termina en Windows** (KL-001), así que SC-001 se cumple en seis de siete
  etapas en la máquina de Hernán y la séptima se verifica en CI.

## Summary

Crear el proyecto Next.js con TypeScript `strict`, los doce comandos de `CLAUDE.md` §Comandos, y
convertir en checks ejecutables las filas mecanizables de `docs/09` §Compuertas mecánicas, de modo
que `pnpm verify` sea una sola orden idéntica a la que corre CI. Sobre esa base entran la base local
con el arnés de privacidad, los 47 tokens de `docs/10` con las once primitivas `ui/`, una portada
provisoria y una muestra de primitivas solo-desarrollo, y el driver de capturas.

Cuatro decisiones sostienen el resto:

1. **`pnpm verify` es un runner de Node** (`scripts/verify.mjs`), no una cadena de `&&`. Corre las
   siete etapas en orden, imprime un encabezado por etapa, junta las omisiones y cierra con el
   resumen de FR-005. Es lo único que se comporta igual en PowerShell 7 y en bash (FR-008).
2. **Las reglas propias viven dentro de oxlint**, como plugin JavaScript local (`jsPlugins`, API de
   ESLint). Un comando, un reporte, una configuración.
3. **Las ocho reglas de la demostración son todas reglas de oxlint**, y la demostración las corre
   con **la configuración real** sobre árboles de ejemplo que **espejan las rutas reales**, porque
   la mitad de esas reglas están atadas a la carpeta.
4. **Los tokens se declaran una sola vez**, en los nombres que `docs/10` usa, y solo entran a
   `@theme` los que caen en un namespace de Tailwind v4. Los demás son custom properties. No hay
   alias: FR-026 dice "ninguno de más".

## Technical Context

**Language/Version**: TypeScript 7.0.2 en modo `strict`, Node 26.4.0, pnpm 12.4.2. Decisión de
`docs/07` (2026-09-17): todo corre sobre TypeScript 7. `next build` 16.3 usa el `tsc` del proyecto
en lugar de la API JavaScript del compilador, que la 7 no expone.

**Primary Dependencies** (verificadas el 2026-09-18; FR-048 manda reverificar al instalar):
Next.js 16.3.5 · React 19.3.0 · Tailwind CSS 4.3.3 · next-intl 4.14.5 · oxlint 1.83.0 +
`oxlint-tsgolint` 7.0.2001 · Prettier 3.9.8 · Vitest 5.0.1 · Stryker 10.0.0 (core + vitest-runner)
· Playwright 1.63.0 · `@lhci/cli` 0.15.1 · lefthook 2.1.14 · `@supabase/supabase-js` 2.116.0 ·
`renovate` 44.97.4 (solo por su validador) · `class-variance-authority` 0.7.1, `clsx` 2.1.1,
`tailwind-merge` 3.7.0 · Radix para cuatro primitivas: `react-dialog` 1.1.23, `react-select` 2.3.7,
`react-toast` 1.2.23, `react-slot` 1.3.3.

**`@supabase/ssr` no entra en esta historia.** Es plomería de sesión, y FR-020 excluye la sesión de
la app; nada de F00 lee la base desde el servidor. Entra con la historia de registro e ingreso, con
su línea en `docs/07` ese día. F00 solo necesita un cliente para el arnés y la generación de tipos.

**Radix: cuatro paquetes con alcance, no el unificado.** Existe `radix-ui` 1.6.7, que es la
distribución nueva, pero depende de unos cuarenta primitivos cuando esta historia usa cuatro. La
regla de últimas versiones es sobre versiones, no sobre preferir un paquete paraguas, y el
presupuesto de JS manda. Verificado el 2026-09-18; queda con su motivo en `docs/07`.

**Storage**: Supabase local por CLI 2.101.0 sobre Docker, sin ninguna tabla del producto. Los tipos
generados viven en `src/lib/supabase/types.ts` y nunca se editan a mano.

**Testing**: Vitest para la demostración de reglas, el arnés de privacidad, la deriva de tipos y la
lógica pura del driver. Playwright configurado y sin especificaciones: `pnpm e2e` pasa con
`--pass-with-no-tests` (confirmado en su `--help`), que es como FR-017 se cumple sin saltear en
silencio. Stryker con umbral 100 y, en esta historia, nada que mutar.

**Target Platform**: web mobile-first, diseñada a 390 px. Se verifica en Windows 11 / PowerShell 7 y
en el runner Linux de CI. Sin Vercel hasta el MVP.

**Project Type**: una sola aplicación web Next.js App Router, un `package.json`, sin monorepo.

**Performance Goals**: presupuesto de `docs/07`, medido con el preset mobile de
`.lighthouserc.json`: performance y accesibilidad ≥ 90, LCP < 2 s, JS inicial < 150 KB, CLS < 0,05.
La aserción de CLS no existe hoy en ese archivo y este PR la agrega: es el único cambio autorizado
ahí (FR-041).

**Constraints**: ninguna dependencia fuera de las de arriba (FR-049). Ningún texto visible fuera de
`messages/es.json`, ningún valor de diseño fuera de los tokens. La CI no puede tener pasos
condicionales. Sin tablas, sin sesión de app, sin personas sembradas.

**Scale/Scope**: dos rutas, once primitivas, siete etapas, quince filas de compuertas al mergear.

## Constitution Check

*GATE: pasa antes de escribir código; se re-chequea en la etapa Review.*

| Principio | Cómo lo cumple este plan | Riesgo |
|---|---|---|
| **I. La historia dice el qué** | La spec no decide mecanismo; este plan sí, y es el único lugar donde aparecen `jsPlugins`, `verify.mjs`, Radix o `@theme`. | — |
| **II. Una feature, un PR, una corrida** | Seis user stories priorizadas, de a una, un commit cada una. Decisión de Hernán (2026-09-18). | PR grande; mitigado con un commit por user story. |
| **III. Compuertas verdes y revisión fresca** | `pnpm verify` = CI, siete etapas, sin pasos condicionales. Se testea solo la lista de `docs/09` (§Qué se testea). Mutation al 100 % sin nada que mutar, dicho en voz alta. | El umbral puede enrojecer por un mutante que no compila; cerrado con la anotación de FR-016 y su KL. |
| **IV. Reglas como código** | 14 filas mecanizadas + la fila nueva de la clave de servicio, cada regla con su demostración corriendo la configuración real. | Las 3 filas no mecanizables quedan nombradas con dónde corren, no simuladas. |
| **V. Datos personales, mínimos y privados** | Sin tablas ni personas sembradas. El arnés crea personas sintéticas y las borra incluso al fallar. La clave de servicio tiene su check. | — |
| **VI. Sin deriva** | Nada de "Fuera del MVP". Los hallazgos fuera de alcance van al umbral de `docs/09`. | — |
| **VII. Liviana y linda, medido** | Server Components por defecto; `"use client"` solo en las primitivas interactivas y en una hoja de la muestra. Sin `NextIntlClientProvider`: los textos bajan por props desde el servidor. Tokens de `docs/10` como única fuente. | Radix suma JS; la portada no importa ninguna primitiva interactiva, y es la ruta que mide Lighthouse. |

**Sin violaciones que justificar.** Complexity Tracking queda vacía a propósito.

## Project Structure

### Documentation (this feature)

```text
specs/001-scaffold-y-compuertas/
├── spec.md · story.md · plan.md · research.md · quickstart.md
└── checklists/requirements.md          # tasks.md lo escribe /speckit-tasks
```

No hay `data-model.md` ni `contracts/`: esta historia no modela datos ni expone interfaces.

### Source Code (repository root)

```text
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx              # html/body, fuente, export metadata con APP_NAME
│       ├── page.tsx                # portada provisoria
│       └── muestra/
│           ├── page.tsx            # compone los bloques; notFound() en producción
│           └── _components/        # privados de la ruta, uno por primitiva
│               ├── button-block.tsx  … empty-state-block.tsx
│               └── toast-block.tsx        # "use client": el único bloque con estado
├── components/ui/                  # las once primitivas
│   ├── button.tsx  input.tsx  textarea.tsx  select.tsx  chip.tsx
│   ├── card.tsx    sheet.tsx  dialog.tsx    toast.tsx   skeleton.tsx
│   └── empty-state.tsx
├── lib/
│   ├── config.ts                   # APP_NAME, APP_URL
│   ├── env.ts                      # lee y valida el entorno; nombra la que falta
│   ├── cn.ts                       # clsx + tailwind-merge
│   ├── i18n/
│   │   ├── routing.ts              # defineRouting: ['es'], localePrefix 'as-needed'
│   │   └── request.ts              # getRequestConfig
│   └── supabase/
│       ├── client.ts               # fábrica de clientes; sin sesión de app
│       └── types.ts                # generado, nunca a mano
├── styles/globals.css              # los 47 tokens, @theme, y .lift/.press/.shimmer
└── proxy.ts                        # next-intl; es sin prefijo

messages/es.json                    # un solo namespace: common

scripts/
├── verify.mjs                      # las siete etapas, el corte y el resumen
├── walk.mjs                        # driver
├── walk/
│   ├── args.mjs  args.test.mjs     # argumentos y códigos de salida
│   ├── paths.mjs paths.test.mjs    # ruta → nombre de archivo
│   └── noise.mjs noise.test.mjs    # lista permitida + ruido del dev server
├── check-service-key.mjs           # FR-023, corre dentro de lint
├── db-types.mjs                    # genera tipos y los escribe con LF
└── mutation.mjs                    # ya en main, no se toca

tools/oxlint-rules/
├── index.mjs                       # plugin local
├── no-hex-color-in-component.mjs
└── no-use-client-in-route-entry.mjs

tests/
├── gates/
│   ├── gates.test.ts               # corre la config real contra los ejemplos
│   └── fixtures/<regla>/{bad,good}/src/…   # espeja las rutas reales
├── db/
│   ├── roles.ts  roles.test.ts     # arnés y su prueba de ejemplo
│   └── types-drift.test.ts
└── setup/env-report.ts             # omisiones → archivo que verify.mjs lee

supabase/
├── config.toml
├── migrations/
│   └── <ts>_whoami.sql             # una función no-producto: quién es la sesión
└── seed.sql                        # sin personas

lefthook.yml · .oxlintrc.json · components.json · renovate.json · .env.example
vitest.config.ts · playwright.config.ts · next.config.ts · tsconfig.json · .prettierignore
```

**Structure Decision**: la de `CLAUDE.md` §Estructura con el segmento de idioma que piden juntos
`docs/07` §Estructura y `docs/06` §URLs, incluida `lib/i18n/`, que es donde ese doc pone la
configuración de idioma: usar `src/i18n/` como muestran las guías de next-intl habría sido un
desvío del contrato sin decisión fechada. `supabase/migrations/` queda con una migración real —la
función de identidad de US3—, así que no hace falta un `.gitkeep` y la entrada del contrato existe
con contenido. Los bloques de la
muestra son privados de su ruta (`_components/`, que Next excluye del enrutado) y no
`components/<dominio>/`: no son dominio, son una herramienta de desarrollo. Las pruebas sin sujeto
al lado viven en `tests/`; las que tienen sujeto —la lógica del driver— van al lado de su archivo,
como manda `docs/08`. Nada de esto entra al alcance de mutation, limitado a `src/**`.

## Diseño

Guía: `docs/10-design-system.md`; skill `frontend-design:frontend-design` cargado antes de escribir.
El brief fija la dirección visual y se sigue al pie: fondo blanco, verde yerba como marca, ceibo
como acento escaso, Bricolage Grotesque, alineación a la izquierda. La guía ya descartó el crema con
terracota y la serif de contraste, que es además el default genérico; no se reabre.

### Portada provisoria — `/` (390 px)

```
┌──────────────────────────┐   gutter 16 px, contenido a la izquierda
│                          │
│  Adopciones              │   APP_NAME · --text-2xl · --font-weight-bold
│                          │   --tracking-tight · --color-ink
│  Estamos construyendo    │   --text-base · --color-ink-muted
│  esto. Volvé pronto.     │   medida máxima --measure
│                          │
└──────────────────────────┘   sin header, sin footer, sin acento, sin sombra
```

- **Componentes de la tabla de `docs/10`**: ninguno. Es texto en el layout; un componente que
  envuelve dos líneas sería abstracción especulativa (`docs/08`).
- **Tokens**: `--color-canvas`, `--color-ink`, `--color-ink-muted`, `--text-2xl`, `--text-base`,
  `--font-sans`, `--font-weight-bold`, `--font-weight-regular`, `--tracking-tight`, `--space-4`,
  `--measure`.
- **El único elemento que llama la atención**: el nombre, por su peso y su tracking en Bricolage
  Grotesque. `docs/10` reserva el elemento audaz para la chapita, que es de dominio y no existe acá,
  y el acento para la urgencia, que una pantalla de espera no tiene: **la portada no usa
  `--color-accent`**. Nada se mueve solo; no hay animación de entrada.
- **Tres estados**: no aplica, y FR-034 lo dice: no carga datos. Las páginas de error siguen siendo
  las de Next.js hasta M5.
- **`--text-3xl` no se usa**: `docs/10` lo reserva para el nombre del animal en la ficha y el
  titular de la landing. Esta no es la landing.
- **Título de pestaña**: `layout.tsx` exporta `metadata` con `title` desde `APP_NAME`, que es lo que
  US1-AC6 observa.

### Muestra de primitivas — `/muestra`, solo desarrollo (390 px)

Once bloques, cada uno un componente privado con nombre, más una hoja cliente para lo que necesita
estado. La página compone y no tiene detalle visual: así se queda bajo las ~50 líneas de JSX de
`docs/08` y bajo el `max-lines` de 150.

```
┌──────────────────────────┐
│ Primitivas               │   --text-2xl, un solo h1
│                          │
│ Button                   │   --text-xl por bloque
│ [primary] [secondary]    │
│ [ghost] [danger]         │   danger: el único uso del acento acá
│ [sm] [md] [lg]           │
│ [cargando] [inactivo]    │
│                          │
│ Input                    │   normal / error / deshabilitado
│ ┌──────────────────────┐ │   16 px mínimo; borde --color-primary al foco
│ └──────────────────────┘ │
│ No pudimos guardarlo     │   error debajo, en --color-accent (exento)
│                          │
│ Textarea                 │   normal / error / deshabilitado
│ Select                   │   normal / error / deshabilitado
│                          │
│ Chip                     │
│ (perro) (gato activo)    │   inactivo --color-surface
│                          │   activo --color-primary-soft con borde primario
│ Card                     │
│ ┌──────────────────────┐ │   --radius-card, sin sombra en reposo
│ └──────────────────────┘ │   --shadow-lift al hover
│                          │
│ Skeleton                 │
│ ▓▓▓▓▓▓▓▓ ▓▓▓▓            │   shimmer sobre --color-surface
│                          │
│ EmptyState               │
│ ┌──────────────────────┐ │   SVG inline, trazo --color-ink con un toque
│ │    (ilustración)     │ │   de --color-primary, máximo 200 px de alto
│ │ Todavía no hay nada  │ │   una frase, una acción, centrado
│ │      [Empezar]       │ │
│ └──────────────────────┘ │
│                          │
│ Sheet                    │
│ [abrir abajo]            │   bottom en teléfono
│ [abrir al costado]       │   side desde 768
│ Dialog                   │
│ [abrir]                  │   solo confirmaciones irreversibles
│ Toast                    │
│ [mostrar éxito]          │   success: --color-primary-soft
│ [mostrar error]          │   error: --color-accent-soft
└──────────────────────────┘
```

- **Componentes**: las once primitivas de la tabla de `docs/10` §Componentes, **todas creadas acá**,
  con **todas** las variantes y estados que esa tabla declara, incluidos `Sheet` bottom y side y
  `Toast` success y error. Ninguna entra como fila nueva a la tabla: ya están listadas; lo que esta
  historia agrega es su implementación.
- **Cómo se crean**: `pnpm dlx shadcn@4.21.0` scaffoldea las ocho con equivalente —Button, Input,
  Textarea, Select, Card, Sheet, Dialog, Skeleton— y **cada una se reescribe** con los tokens y con
  `cva`, como manda `docs/08` §Estilos. Se corre por `dlx` y no se instala, así que no suma
  dependencia ni línea en `docs/07`; `components.json` **sí** queda versionado, para que la próxima
  historia scaffoldee con la misma configuración. `Chip` y `EmptyState` se escriben a mano: shadcn
  no tiene equivalente. `Toast` se escribe sobre `@radix-ui/react-toast` en lugar de adoptar Sonner,
  que `docs/07` no registra; Radix sí está sancionado ahí.
- **Tokens**: los 47. Esta pantalla es el único lugar de la historia donde se ven todos.
- **El acento**: aparece una sola vez como decisión de diseño, en el `Button` `danger`. El texto de
  error del `Input` también lo usa, y está exento: `docs/10` §Color dice "como máximo una vez por
  pantalla **fuera de los estados de error**".
- **Tres estados de cada bloque con datos**: ninguno carga datos. `Skeleton` y `EmptyState`
  aparecen como ejemplos estáticos de sus propios estados (FR-035), que es lo que los hace
  revisables antes de que exista una pantalla con datos.
- **Movimiento**: hover, foco y presión en `--dur-fast` / `--dur-base` con `--ease-out`, desde las
  utilidades `.lift`, `.press` y `.shimmer` que `docs/07` §Microinteracciones manda tener en
  `globals.css`, para que ninguna primitiva reimplemente su hover. Con
  `prefers-reduced-motion: reduce`, duraciones en 0 y shimmer detenido. Nada aparece al scroll.
- **Accesibilidad**: un `h1`, `button` que son `button`, anillo de foco de 2 px con 2 px de
  separación desde `--color-focus`, objetivos ≥ 44 px, inputs a 16 px. `Dialog`, `Sheet` y `Toast`
  reciben su nombre accesible por props (FR-033).

### Textos

Voseo, oración con mayúscula inicial, sin signos de exclamación. El botón dice lo que pasa.
**Todo** texto visible sale de `messages/es.json`, incluidos los nombres de las primitivas: van como
claves con valor en inglés (`common.ui.button` → `"Button"`), porque son nombres de componentes pero
igual son texto en pantalla, y `react/jsx-no-literals` solo exime `components/ui/**`. Un solo
namespace, `common`: `docs/06` §Convenciones pide namespaces por dominio, y esta historia no tiene
dominio, así que no se inventa uno por pantalla.

## Implementación por user story

### US1 — Proyecto y comandos

`create-next-app@latest` en un directorio temporal, con TypeScript, App Router, Tailwind, `src/`,
alias `@/*`, pnpm y **sin** ESLint. Se mueve a la raíz comparando contra la lista de archivos
preexistentes; `AGENTS.md`, si el generador lo crea, se descarta y el PR lo dice.

`scripts/verify.mjs` define las siete etapas como datos (`{ name, run }`), las corre en orden, corta
en la primera falla propagando su código, lee `.verify-skips.json` si existe y cierra con el resumen
de omisiones. Los doce scripts de `package.json`: `dev`, `lint`, `typecheck`, `test`, `mutation`,
`mutation:all`, `build`, `start`, `e2e`, `lighthouse`, `verify`, `db:types`.

`src/lib/config.ts` exporta `APP_NAME = 'Adopciones'` y `APP_URL`. Los dos tienen consumidor
observable en `layout.tsx`, que exporta `metadata` con `title` desde `APP_NAME` y `metadataBase`
desde `APP_URL`: sin eso, la segunda mitad de US1-AC6 no se podría mirar. `src/lib/env.ts` lee las
variables del entorno, y cuando falta una **lanza nombrándola y diciendo cómo obtenerla**
(`supabase status -o env`): es el dueño de FR-025 y US3-AC6, y lo consumen el cliente de Supabase y
el arranque de las pruebas. Sin zod, que no es dependencia de esta historia. `.env.example` lista
las tres variables con su comentario.

### US2 — Compuertas

`.oxlintrc.json` con los plugins (typescript, react, next, jsx-a11y, import, vitest), las reglas de
la tabla de `docs/09`, `jsPlugins: ["./tools/oxlint-rules/index.mjs"]`, y `max-lines` 150 como
**warning**.

Las capas salen de `no-restricted-imports` con `overrides` por carpeta, en los cuatro sentidos que
pide la fila 4 de `docs/09`: `ui/` no importa de un dominio ni del cliente de la base; un componente
no importa del cliente de la base **ni de `app/`**; nadie fuera de `lib/supabase/queries/` importa
el cliente. **Los globs se escriben con `**/src/…` y no `src/…`**, para que la misma configuración
matchee el árbol real y el árbol de cada fixture, desde cualquier directorio de trabajo. Eso es lo
que hace que la demostración corra la configuración real sin trucos de `cwd`: sin ese prefijo,
`src/components/ui/**` no matchea `tests/gates/fixtures/<regla>/bad/src/components/ui/…` ni desde
la raíz ni desde el fixture. El override que restringe el cliente se acota a `**/src/**`, porque
`tests/db/roles.ts` **tiene** que importarlo: es el arnés.

`react/jsx-no-literals` con excepción solo para `**/components/ui/**`.

El lint con tipos entra como `oxlint --type-aware`, explícito en el script, y las reglas que
justifican encenderlo se nombran en la configuración porque son opt-in y la tabla de `docs/09` no
las trae: `typescript/no-floating-promises` y `typescript/no-misused-promises`. Sin nombrarlas,
US2-AC9 no fallaría nunca. El build confirma la clave exacta con `oxlint --help` antes de fijarla.

El plugin local implementa `no-hex-color-in-component` y `no-use-client-in-route-entry`.

`pnpm lint` corre, en orden: `prettier --check .`, `node scripts/check-service-key.mjs`,
`renovate-config-validator`, y
`oxlint --type-aware src scripts tools tests --ignore-pattern "tests/gates/fixtures/**"`.

La exclusión de los fixtures es **ese flag**, no una ruta omitida ni `ignorePatterns`:

- si fuera `ignorePatterns` en `.oxlintrc.json`, invocar oxlint sobre un fixture reportaría cero
  archivos y la demostración pasaría vacía;
- y no alcanza con elegir rutas, porque pasar `tests` como directorio arrastra
  `tests/gates/fixtures` adentro y la corrida normal quedaría roja por el material que está roto a
  propósito.

`check-service-key.mjs` declara qué mira, porque una compuerta de privacidad sin sujeto declarado
puede pasar en verde sin mirar nada: recorre los archivos **versionados** (`git ls-files`) buscando
(a) cualquier nombre de variable que combine el prefijo expuesto al browser con la clave de
servicio, (b) un valor con forma de clave de servicio escrito literal, y (c) que `.env.example` no
traiga ningún valor real. Falla nombrando el archivo, la línea y cuál de las tres cosas encontró.

`tests/gates/fixtures/**` queda fuera de las cinco compuertas que lo verían, y cada exclusión tiene
su lugar concreto: listado en `.prettierignore`, listado en el `exclude` de `tsconfig.json`, fuera
del `include` de Vitest, fuera de las rutas de oxlint por el `--ignore-pattern` de arriba, y fuera
del `mutate` de Stryker, que ya está limitado a `src/**`.

**Las ocho reglas de la demostración son todas de oxlint**, incluidas las dos que antes este plan
mandaba a la herramienta equivocada: `any` es `typescript/no-explicit-any` (`tsc` no falla por un
`any` explícito, solo por uno implícito), y las de test son el plugin `vitest`
(`expect-expect`, `no-disabled-tests`, `no-conditional-expect`).

`tests/gates/gates.test.ts` recorre una tabla de las ocho reglas. Por cada una invoca `oxlint` con
la configuración real sobre `fixtures/<regla>/bad/` y afirma que **sale distinto de 0 y que el
reporte nombra la regla y cuenta al menos un diagnóstico** —no solo el código de salida, que también
sería distinto de 0 si no encontrara archivos—, y sobre `fixtures/<regla>/good/` afirma que pasa.
Cada fixture es un árbol que **espeja la ruta real** que la regla vigila, porque la mitad de estas
reglas están atadas a la carpeta o al nombre del archivo:

```
tests/gates/fixtures/hex-color/bad/src/components/pets/thing.tsx
tests/gates/fixtures/use-client-entry/bad/src/app/[locale]/page.tsx
tests/gates/fixtures/ui-imports-domain/bad/src/components/ui/thing.tsx
tests/gates/fixtures/from-outside-queries/bad/src/components/pets/thing.tsx
```

oxlint se invoca sobre el directorio del caso con la configuración real y **sin** el
`--ignore-pattern` del script, así que sí ve los fixtures. Los globs con prefijo `**/src/…` hacen
que los `overrides` apliquen igual en ese árbol que en el real, que es lo que permite demostrar las
reglas atadas a carpeta sin una segunda configuración.

**La demostración del mutante sobreviviente (US2-AC4) es efímera**: se rompe a propósito una
aserción de `scripts/walk/paths.test.mjs`, se corre `pnpm mutation` para verlo sobrevivir y fallar
por debajo del 100 %, se anota el mutante para ver que pasa, y se revierte todo. No queda en el
repo —un mutante vivo versionado rompería el umbral para siempre— y el resultado se reporta en el
PR, como dice el supuesto de la spec.

`lefthook.yml`: un job de formato sobre los archivos preparados con `stage_fixed: true`, y tres en
paralelo — `oxlint`, `tsc --noEmit`, y el subconjunto rápido de pruebas.

Tres detalles que el gancho tiene que respetar o rompe sus propios requisitos:

- corre `oxlint`, **no** `pnpm lint`, que incluye `prettier --check` y bloquearía el commit por
  formato, contra FR-015/SC-015;
- su job de `oxlint` **excluye `tests/gates/fixtures/**` de los archivos preparados**, porque si no,
  el commit que agrega los fixtures no se podría crear: son archivos que violan reglas a propósito;
- su subconjunto de pruebas excluye `tests/gates` y `tests/db`, que levantan procesos externos y la
  base. La compuerta completa es `pnpm verify`, no el commit.

### US3 — Base local y arnés

`supabase init`. `supabase/seed.sql` con una línea de propósito y ninguna persona.

**Una migración, una función.** Preguntarle a la base quién es la sesión no se puede hacer con un
select genérico: la API de datos expone tablas y funciones, no expresiones, así que confirmar
`auth.uid()` necesita un objeto en la base. F00 agrega una única función no-producto,
`public.whoami()`, que devuelve el identificador de la sesión actual, con `security invoker` —nunca
`security definer`, que correría con privilegios del creador y saltearía RLS— y con `execute`
otorgado a los roles anónimo y autenticado. Es exactamente el caso que FR-022 previó: **no es una
tabla del producto, y queda registrado en el PR** porque M1 lo hereda. Vive en
`supabase/migrations/`, que así queda con contenido real.

`tests/db/roles.ts` expone tres constructores: `anonClient()`, `asNewUser()` (crea la persona con la
clave de servicio por la API de administración, la ingresa para obtener un JWT real, y devuelve el
cliente más su `cleanup`) y `serviceClient()`. La prueba de ejemplo llama `whoami()` con cada uno y
afirma: sin sesión devuelve vacío, la persona sintética devuelve su propio identificador, y el
servicio se distingue de los dos. `cleanup` corre en `afterEach`, así se ejecuta también cuando la
prueba falla a mitad (FR-022).

Que el JWT sea real importa: el patrón que M1 va a usar es
`to authenticated using ((select auth.uid()) = user_id)`, y un contexto falseado no lo probaría.

`pnpm db:types` es `node scripts/db-types.mjs`, no una redirección de shell: `>` en PowerShell
escribe CRLF, y con `.gitattributes` normalizando a LF el archivo versionado quedaría distinto del
generado y la compuerta enrojecería **solo en Windows**. El script invoca el CLI, captura la salida
y la escribe con LF en `src/lib/supabase/types.ts`.

`tests/db/types-drift.test.ts` genera los tipos **a un archivo temporal**, normaliza los finales de
línea de los dos lados y recién entonces compara. No reescribe `src/lib/supabase/types.ts`: eso
ensuciaría el árbol y el diff con el que `scripts/mutation.mjs` decide qué mutar.

`tests/setup/env-report.ts` corre como `setupFiles` de Vitest y hace dos cosas. Carga `.env.local`
en `process.env` si existe —Vitest no lo hace solo, y sin eso no se distinguiría "falta el entorno"
de "falta una variable"— y sondea la API local **una** vez en la URL de `src/lib/env.ts`, cuyo valor
por defecto es el puerto local de Supabase cuando no hay variable. Si no responde, marca como
omitidas las suites que la necesitan con un aviso visible; si `process.env.CI` está, falla. Las
omisiones se escriben en `.verify-skips.json` (ignorado por git), que es el canal por el que llegan
al resumen de `verify.mjs` (FR-005/SC-002).

### US4 — Diseño e idioma

`src/styles/globals.css` declara los 47 tokens **una sola vez**, con los nombres de `docs/10`, y los
reparte según el namespace de Tailwind v4:

| Grupo | Nombres | Va a `@theme` | Por qué |
|---|---|---|---|
| Color (13) | `--color-*` | sí | namespace `--color-*`: genera utilidades |
| Escala tipográfica (7) | `--text-*` | sí | namespace `--text-*`; la interlínea viaja como `--text-*--line-height`, modificador del mismo token, así el conteo sigue siendo 47 |
| Familia, pesos, tracking (5) | `--font-sans`, `--font-weight-*`, `--tracking-tight` | sí | namespaces `--font-*`, `--font-weight-*`, `--tracking-*` |
| Radio (4) | `--radius-*` | sí | namespace `--radius-*` |
| Sombra (2) | `--shadow-*` | sí | namespace `--shadow-*` |
| Curvas (2) | `--ease-*` | sí | namespace `--ease-*` |
| Espacio (10) | `--space-1`…`--space-16` | no | Tailwind usa `--spacing-*`; renombrar sería un alias, y FR-026 dice "ninguno de más" |
| Duraciones (3) | `--dur-*` | no | Tailwind no tiene namespace de duración |
| Medida (1) | `--measure` | no | sin namespace |

Los que no van a `@theme` son custom properties en `:root` y se consumen con `var()` desde las
utilidades de movimiento y desde CSS. Para que el espaciado de Tailwind coincida con la escala de
`docs/10` sin inventar nombres, se fija la base `--spacing: 4px`: así `p-4` son 16 px, exactamente
`--space-4`, y la escala generada cae sobre los mismos pasos de 4 px. `--spacing`, los breakpoints,
el gutter y los anchos de página son configuración del tema, no tokens: FR-027 los separa.

`globals.css` también trae `.lift`, `.press` y `.shimmer`, el catálogo de microinteracciones que
`docs/07` manda tener ahí, y el bloque `prefers-reduced-motion` que apaga duraciones y shimmer.

Y trae **keyframes con nombre para la entrada y la salida de las tres capas superpuestas**, que las
utilidades de hover no cubren y que `docs/10` §Componentes pide explícitamente: el `Sheet` entra
deslizando (desde abajo en teléfono, desde el costado a partir de 768), el `Toast` entra deslizando
desde abajo y sale con fade, y el `Dialog` entra y sale con fade. Se enganchan a los atributos de
estado que Radix expone en cada parte, así que no hace falta ninguna dependencia de animación:
Motion no entra en esta historia. Las duraciones salen de `--dur-fast` y `--dur-base`, y el bloque
de `prefers-reduced-motion` también las apaga.

next-intl: `src/lib/i18n/routing.ts` (`locales: ['es']`, `defaultLocale: 'es'`,
`localePrefix: 'as-needed'`), `src/lib/i18n/request.ts`, y `src/proxy.ts`, el nombre que Next 16 usa
para el middleware. La carpeta es la de `docs/07` §Estructura, no la `src/i18n/` de las guías de
next-intl: el contrato del repo gana, y desviarse habría necesitado una decisión fechada. Las claves se tipan declarando `IntlMessages` desde `messages/es.json`, así una
clave inexistente falla `typecheck` (US4-AC7). **No se monta `NextIntlClientProvider`**: mandaría
todos los mensajes al cliente sin ningún consumidor cliente, contra el presupuesto de JS y
constitución §VII. Los textos se leen en el servidor con `getTranslations` y bajan por props; la
única hoja cliente de la muestra recibe los suyos ya traducidos.

La fuente entra por `next/font/google` con `Bricolage_Grotesque`, `subsets: ['latin']`,
`display: 'swap'`, `preload: true`, expuesta como `--font-sans`. Se autohospeda en el build, así que
no hay pedidos a terceros; lo observable es eso y el CLS, no "que no cambie nunca" (FR-028).

### US5 — Pantallas y driver

`page.tsx` y `muestra/page.tsx`, Server Components. La muestra llama `notFound()` cuando
`process.env.NODE_ENV === 'production'`. Solo `toast-block.tsx` y las primitivas que necesitan
estado llevan `"use client"`, nunca la página: es justo lo que la regla propia vigila.

`scripts/walk.mjs` usa el Chromium de Playwright, instalado con
`pnpm exec playwright install chromium` en el paso de preparación (está en `quickstart.md` y va al
README); CI ya lo instala en su paso de e2e. Preflight: un `fetch` a la URL base; si no responde,
código 2 antes de abrir el navegador. Después, por ruta: navega, espera que se asiente, captura
página completa a 390 × 844, y si hay un elemento interactivo enfocable lo hace hover y foco y
captura de nuevo. Limpia `.artifacts/<slug>/` antes de empezar.

Los helpers puros van en `scripts/walk/` con su test al lado: `args.mjs` (incluye los códigos 3 de
invocación inválida y de `--user`), `paths.mjs` (ruta → nombre, raíz → `home`, sufijo `.desktop`),
`noise.mjs` (lista permitida vacía, más el ruido del servidor de desarrollo que se ignora).

### US6 — Registro

Las líneas fechadas en `docs/07` (incluidas las de Radix con su motivo y la de `renovate` con el
suyo), el README con versiones y el paso de preparación tomado de `quickstart.md`, «Verified» y el
contrato marcado en `run-app/SKILL.md`, `CLAUDE.md` §Estado y §Estructura **sin podar** las entradas
de lo que crean historias posteriores, la fila nueva y la segunda categoría de anotación en
`docs/09`, y el `KL` de Stryker en `docs/known-limitations.md`.

La segunda categoría de anotación se declara con su forma exacta, para que `code-reviewer` pueda
distinguirla de un equivalente:

```
// Stryker disable next-line <Mutator>: no compila — <por qué el mutante no es TypeScript válido>
```

`ci.yml`: sacar «Detect the project» y sus **catorce** condiciones (doce simples y dos que conservan
su `always()`), cambiar la acción de Lighthouse por `pnpm lighthouse`, sacar el condicional de
Playwright, y fijar la versión del Supabase CLI. `.lighthouserc.json` recibe la aserción de CLS que
FR-041 pide, y nada más.

El PR lista el paso manual que queda para Hernán: **instalar la app de Renovate en GitHub**
(FR-018/US6-AC7). El automerge de actualizaciones queda fuera.

## Qué se testea, y por qué

Contra `docs/09` §Qué vale la pena testear. Esta historia no tiene reglas de negocio, schemas zod,
cálculos de dominio ni componentes de dominio, así que **no deja ningún archivo con test bajo
`src/`**, y `pnpm mutation` informa que no hay nada que mutar. Lo que sí se testea:

| Qué | Por qué entra | Dónde |
|---|---|---|
| Las ocho reglas, con su ejemplo violado y su corregido | Una regla que nunca se vio fallar no es una compuerta | `tests/gates/` |
| El arnés de privacidad, con sus tres roles | Constitución §V: toda regla de visibilidad se prueba en la base; el arnés es su instrumento | `tests/db/roles.test.ts` |
| La deriva de tipos generados | FR-021 lo pide como compuerta, no como prosa | `tests/db/types-drift.test.ts` |
| La lógica pura del driver | Transformaciones con casos borde; un driver roto muestra pantallas equivocadas al revisor | `scripts/walk/*.test.mjs` |
| La paridad de los 47 tokens | SC-005 exige que la coincidencia con `docs/10` la verifique una compuerta; sin esto, "el conteo de la compuerta" no tendría compuerta | `tests/gates/tokens.test.ts` |

La prueba de tokens lee `docs/10` §Tokens, extrae los nombres y valores que declara —tablas y
listas, más los cinco de familia, pesos y tracking— y los compara con lo que `globals.css` define,
fallando por nombre faltante, valor distinto o token de más. Es lo más cerca de "un valor que no
está en este doc no existe" que se puede poner en una máquina. Está en `tests/gates/` y no al lado
de `globals.css` porque es una compuerta, no el test de un módulo, y porque `docs/09` excluye probar
configuración por sí misma: acá lo que se prueba es la correspondencia entre el doc y el código.

**No se testea**, a propósito: las dos páginas, los bloques de la muestra, las once primitivas
`ui/`, el cliente de Supabase, `config.ts`, `env.ts` ni el resto de la configuración. Nada de eso
engaña a una persona, expone un dato ni calcula mal, y `docs/09` lo excluye por nombre.

## Riesgos y cómo se cierran

| Riesgo | Cierre |
|---|---|
| `oxlint --type-aware` usa otra clave o flag que la verificada | El build confirma con `oxlint --help` antes de fijarla; si no existe, es un hallazgo para Hernán, no un silencio. |
| Los globs de `overrides` no matchean el árbol del fixture | Resuelto por diseño con el prefijo `**/src/…`, que matchea los dos árboles desde cualquier directorio. Se verifica con el primer fixture antes de escribir los ocho; si fallara, el arreglo es el glob, no un segundo config ni un truco de `cwd` (invocar desde la raíz tampoco matchearía). |
| Los finales de línea de los tipos generados difieren entre Windows y CI | `pnpm db:types` escribe con LF desde Node en lugar de redirigir en el shell, y la prueba de deriva normaliza los dos lados antes de comparar. |
| `renovate` como dependencia de desarrollo es pesado | Es la única forma de tener el validador oficial offline: el paquete publicado aparte es un placeholder `0.0.1`. Queda con su línea y su motivo en `docs/07`. |
| Radix suma JS al bundle | Ninguna primitiva interactiva se importa en la portada, la ruta que mide Lighthouse. La muestra no existe en producción. |
| Excluir los fixtures de cuatro lugares se olvida en uno | `gates.test.ts` afirma el verde de la corrida limpia, así que una inclusión accidental pone la compuerta roja. |
| El primer `supabase start` baja imágenes y tarda | Se hace una vez al comenzar US3; Docker ya corre (verificado: 29.7.2). |
| El gancho se vuelve lento | Formato y lint acotados a los archivos preparados; las pruebas del gancho son el subconjunto rápido, sin `tests/gates` ni `tests/db`. |
