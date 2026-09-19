# Research: Scaffold y compuertas

Lo que se verificó el **2026-09-18** para este plan, con su fuente. FR-048 manda reverificar cada
versión al instalar: esta lista dice qué se sabía al planificar, no qué se instaló.

## Versiones estables confirmadas

Todas por `npm view <pkg> version` el 2026-09-18, y todas coinciden con la lista que la historia
trae del 2026-09-17.

| Paquete | Versión | Paquete | Versión |
|---|---|---|---|
| `next` | 16.3.5 | `vitest` | 5.0.1 |
| `react` / `react-dom` | 19.3.0 | `@stryker-mutator/core` | 10.0.0 |
| `typescript` | 7.0.2 | `@stryker-mutator/vitest-runner` | 10.0.0 |
| `tailwindcss` | 4.3.3 | `@playwright/test` | 1.63.0 |
| `oxlint` | 1.83.0 | `@lhci/cli` | 0.15.1 |
| `oxlint-tsgolint` | 7.0.2001 | `lefthook` | 2.1.14 |
| `prettier` | 3.9.8 | `@supabase/supabase-js` | 2.116.0 |
| `next-intl` | 4.14.5 | `@supabase/ssr` | 0.12.7 — **no entra en F00** |
| `class-variance-authority` | 0.7.1 | `renovate` | 44.97.4 |
| `clsx` | 2.1.1 | `shadcn` (CLI) | 4.21.0 |
| `tailwind-merge` | 3.7.0 | `create-next-app` | 16.3.5 |
| `@radix-ui/react-dialog` | 1.1.23 | `@radix-ui/react-select` | 2.3.7 |
| `@radix-ui/react-toast` | 1.2.23 | `@radix-ui/react-slot` | 1.3.3 |

Entorno de la máquina, verificado el mismo día: Node 26.4.0 · pnpm 12.4.2 · Supabase CLI 2.101.0 ·
Docker 29.7.2 (corriendo, sin contenedores de Supabase todavía: el primer `supabase start` baja
imágenes).

`@supabase/ssr` figura con su versión porque se verificó, pero **no se instala en esta historia**:
es plomería de sesión y FR-020 excluye la sesión de la app. Entra con la historia de registro e
ingreso, con su línea en `docs/07` ese día. Lo mismo vale para el paquete unificado `radix-ui`
1.6.7, que existe y se evaluó: se eligieron los cuatro paquetes con alcance porque el unificado
arrastra unos cuarenta primitivos y el presupuesto de JS manda.

## Decisiones que se investigaron

### oxlint acepta plugins JavaScript con la API de ESLint

`docs/09` §Compuertas dice que las dos reglas que oxlint no trae se resuelven "con un check propio
del repo", y el comentario de Hernán en la issue deja el mecanismo al plan. oxlint 1.83 acepta
plugins locales por `jsPlugins` con la misma API de ESLint (`create(context)` devolviendo visitantes
de nodos, `context.report`), y una variante de mayor rendimiento con `createOnce` vía
`@oxlint/plugins`. Por eso las reglas propias viven **dentro** del linter y no en un script aparte:
un comando, un reporte, una configuración, y editor integrado.

Fuente: `https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html` y
`.../linter/js-plugins.html` (vía context7, 2026-09-18).

### El lint con tipos existe y cubre casi todo typescript-eslint

`oxlint --type-aware` delega en tsgolint (Go) y cubre 59 de las 61 reglas type-aware de
typescript-eslint, las que quedaron sin soporte cuando la 7 rompió typescript-eslint. Eso es lo que
recupera `no-floating-promises` y `no-misused-promises` antes de que exista la primera Server Action,
que es el motivo por el que Hernán decidió que entrara ahora.

Fuente: `https://oxc.rs/docs/guide/usage/linter/type-aware` (vía context7, 2026-09-18).

### Stryker no puede usar su verificador de tipos, y eso cuesta algo

`@stryker-mutator/typescript-checker@10.0.0` declara `typescript: '>=3.6'` como peer dependency y
usa el paquete `typescript` para utilidades de configuración que la 7 ya no expone. `docs/07` ya lo
había decidido; lo que no estaba registrado es la consecuencia: sin verificador, Stryker muta y
Vitest transpila sin chequear tipos, así que **un mutante que no compila se ejecuta igual** y, si
los tests no lo matan, cuenta como sobreviviente. Con el umbral en 100, eso puede poner la compuerta
roja por un mutante imposible.

Decisión de Hernán (2026-09-18): no se toca el stack; se cierra la regla. FR-016 pide una segunda
categoría de anotación distinguible ("no compila"), FR-046 la registra en `docs/09`, en `docs/07` y
en `docs/known-limitations.md` con su condición de reapertura. F00 no muta nada, así que el costo
empieza en M1.

Verificado por `npm view @stryker-mutator/typescript-checker@10.0.0 dependencies peerDependencies`.

### El validador oficial de Renovate sale del paquete `renovate`

No hay validador publicado por separado: `renovate-config-validator` en npm es un placeholder
`0.0.1-placeholder`, y `@renovatebot/config-validator` no existe. FR-018 pide el validador oficial
dentro de `pnpm lint`, así que `renovate` entra como dependencia de desarrollo solo por su binario,
y queda con su línea y su motivo en `docs/07`. Es pesado, pero es dev-only y funciona offline, que
es lo que la compuerta necesita.

### Playwright pasa en verde sin especificaciones

`playwright test --pass-with-no-tests` existe en 1.63 (confirmado en su `--help`). Es lo que
permite cumplir FR-017 sin saltear en silencio: la etapa corre, dice que no había nada y termina
en 0. Sin ese flag, Playwright sale distinto de 0 cuando no encuentra tests.

### next-intl con un solo idioma y sin prefijo

next-intl 4 lo arma con `defineRouting` en `src/i18n/routing.ts`, `getRequestConfig` en
`src/i18n/request.ts`, el archivo de middleware —que Next 16 llama `proxy.ts`— y las rutas bajo
`src/app/[locale]/`. Con `localePrefix: 'as-needed'` y un único locale, las URLs de español quedan
sin prefijo, que es lo que pide `docs/06` §URLs, y el segmento queda listo para `pt-BR` sin
reestructurar rutas.

Fuente: docs de next-intl (vía context7, 2026-09-18).

### Next 16.3 sobre TypeScript 7

`next build` corre el `tsc` del proyecto en lugar de cargar la API JavaScript del compilador, que
la 7 no expone. `docs/07` ya lo tenía verificado en la máquina de Hernán el 2026-09-17, y este plan
no lo reabre. Consecuencia práctica para el plan: `pnpm typecheck` con `tsc --noEmit` y el chequeo
de `next build` son dos pasadas distintas, y las dos son legítimas.

### La clave de servicio necesita su propia regla

El skill de Supabase es explícito: nunca exponer la clave de servicio en un cliente público, y en
Next **cualquier** variable `NEXT_PUBLIC_*` viaja al browser. `docs/09` §Compuertas no tenía fila
para eso, así que ninguna historia posterior la iba a crear, y M5 (Supabase cloud) heredaría el
patrón que deje F00. De ahí FR-023 y su fila nueva.

Nota para M5: Supabase ahora prefiere claves *publishable* y *secret* sobre las heredadas
`anon` / `service_role`. En local, `supabase status -o env` solo entrega las heredadas, que son las
que `ci.yml` ya usa, así que F00 se queda con esas y el cambio de nombres es problema de M5.

## Lo que no hizo falta investigar

- **Tailwind v4 con tokens**: `@theme` en `globals.css` es el camino documentado y ya decidido en
  `docs/07`; no hay alternativa a evaluar.
- **El formateador**: `docs/07` dice Prettier. Cambiarlo sería mover una pieza registrada del
  stack, y eso es decisión previa de Hernán en su propio PR.
- **La dirección visual**: `docs/10` la fija y ya tiene su sección «Descartado». El skill de diseño
  coincide con ella en lo que hay que evitar.
