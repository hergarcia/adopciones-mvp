# adopciones-mvp

Plataforma de adopción de animales cuyo diferencial es la **verificación de las personas** antes de
intercambiar datos. Uruguay primero. Sin objetivo de lucro inicial, capital mínimo, foco en aprender.

`adopciones-mvp` es un codename provisorio. El nombre real se define antes de la beta
(ver `docs/04-nombre.md`). Nada en el código debe depender del nombre: una sola constante
`APP_NAME` / `APP_URL` en `src/lib/config.ts`.

## Leer primero

`docs/README.md` es el índice. Antes de tocar código o proponer algo, leer el doc del tema:

| Tema | Doc |
|---|---|
| Producto, alcance, riesgos | `docs/01-idea.md`, `docs/03-mvp-features.md`, `docs/05-ideas-futuras.md` |
| Stack, imágenes, animaciones, diseño, performance | `docs/07-stack.md` |
| Convenciones de código y checklist | `docs/08-convenciones-codigo.md` |
| SEO, AEO, GEO | `docs/08-convenciones-codigo.md` §Encontrable |
| i18n y glosario del dominio | `docs/06-i18n.md` |
| Referencia de mercado | `docs/02-referencia-adoptapet.md` |
| Flujo de trabajo, historias, pipeline | `docs/09-flujo-de-trabajo.md`, `.specify/memory/constitution.md` |
| Diseño: tokens, componentes, reglas visuales | `docs/10-design-system.md` |

Las decisiones tomadas están marcadas como **Decisión (fecha):** en cada doc. No se reabren sin
un motivo nuevo. Al tomar una decisión nueva, registrarla en el doc correspondiente con fecha.
Lo descartado no se borra: va a una sección "Descartado" con el motivo.

## Reglas (MUST)

1. **Últimas versiones, siempre.** Antes de instalar o recomendar cualquier paquete, API o
   integración, verificar la versión estable actual (`npm view <pkg> version`, docs oficiales,
   context7). Instalar con `@latest`. Nunca fijar a un major viejo "porque se conoce". Si A no
   soporta la última de B, buscar alternativa a A antes que bajar B.
2. **Componentizar.** Todo elemento visual o lógica que se repite, o que tiene nombre en el
   dominio, es un componente, hook o función con nombre. Extraer a la segunda repetición. Capas
   `app → components/<dominio> → components/ui`, dependencias solo hacia abajo; los componentes
   de dominio nunca hacen fetch. Una página con más de ~50 líneas de JSX tiene componentes
   escondidos. Checklist completo en `docs/08-convenciones-codigo.md`.
3. **Multilingüe.** Ningún string visible hardcodeado: todo en `messages/es.json` con claves
   semánticas por namespace. Enums en DB como claves en inglés. UI en español rioplatense con
   voseo. Sin selector de idioma hasta que exista un segundo idioma.
4. **Liviana y linda.** Server Components por defecto, `"use client"` en la hoja más chica.
   Imágenes procesadas en el cliente al subir (3 tamaños WebP + ThumbHash). Microinteracciones
   sutiles pero abundantes, en CSS, 100-250 ms. Presupuesto: LCP < 2,5 s, JS inicial < 150 KB,
   Lighthouse mobile ≥ 90. **La guía de diseño es `docs/10-design-system.md`**: tokens,
   componentes y reglas visuales. Antes de escribir JSX o CSS se carga el skill
   `frontend-design:frontend-design`; un valor que no está en la guía no existe.
5. **Sin scope creep.** Perdidos/encontrados, donaciones, sitters, chat in-app, pagos, app
   nativa, modo oscuro: fuera del MVP. La tentación va a `docs/05-ideas-futuras.md`, no al código.
6. **Privacidad.** Teléfono, contacto e identidad nunca son públicos: se revelan solo cuando una
   solicitud fue aceptada, y las imágenes de identidad se borran después de revisar (Ley 18.331).
   Cada regla de visibilidad vive en RLS y tiene un test que intenta leer lo que no debe verse.
7. **Dependencia nueva = decisión.** Última versión estable y una línea con fecha en
   `docs/07-stack.md`, en el mismo PR. Un cambio transversal de stack (framework CSS, librería
   base de componentes, auth) es su propio PR con decisión previa de Hernán.
8. **Encontrable.** Cada pantalla nace encontrable; no se le agrega SEO al final. El HTML del
   servidor trae el contenido (ningún crawler de IA ejecuta JavaScript), toda `page.tsx`
   exporta `metadata` o `generateMetadata` con los textos en `messages/es.json`, lo privado
   lleva `noindex` y una publicación que expira responde 410. **Nada se indexa hasta que
   exista el dominio definitivo** (`docs/04-nombre.md`): mudarse de dominio después tira la
   autoridad. Reglas y descartes (`llms.txt`, `FAQPage`, `hreflang`) en
   `docs/08-convenciones-codigo.md` §Encontrable.

## Cómo se trabaja

Pipeline casi desatendido. Detalle en `docs/09-flujo-de-trabajo.md`; principios en
`.specify/memory/constitution.md`.

- **Las historias dicen el qué**, a tamaño feature (una capacidad de punta a punta, ~16 en todo
  el MVP), en español, sin tablas, endpoints, componentes ni códigos HTTP. `/story-map new |
  review | refine`. El cómo lo decide `plan.md` en cada corrida y lo revisa `plan-reviewer`.
- **Hernán aprueba con la etiqueta `lista`.** Nada sin `lista` entra a un batch.
- **`/story-ship <#>`** corre una historia hasta el PR. **`ship-batch`** (Workflow,
  `.claude/workflows/ship-batch.js`) corre varias, una por vez, y las mergea. Las etapas están
  una sola vez en `.claude/skills/story-ship/stages/`.
- **Nada entra a `main` sin `pnpm verify` verde en local y en CI** y la revisión de
  `code-reviewer` + `design-reviewer` (contexto fresco, hallazgos tipados). Loops con tope; si
  no converge, PR en borrador.
- **Hallazgos fuera de alcance:** plegar, aceptar en `docs/known-limitations.md`, o **un**
  seguimiento por historia. El umbral está en docs/09.
- **Nunca** force push, `--no-verify`, `--admin` ni push directo a `main`; lo bloquea
  `.claude/hooks/guard-git.mjs`. Todo entra por PR, los docs también.
- Spec-kit v1.0.7: `skills/speckit-*` y `.specify/templates` no se editan a mano.
- **Skills por tema, obligatorios antes de escribir:** UI → `frontend-design:frontend-design` +
  `docs/10-design-system.md` (y `vercel:shadcn`, `vercel:nextjs` cuando aplican); base de datos,
  migraciones, RLS y sus tests → `supabase:supabase-postgres-best-practices`; auth, sesiones,
  `@supabase/ssr` → `supabase:supabase`; después de editar varios TSX →
  `vercel:react-best-practices`. Los MCP de Supabase y Vercel (proyecto cloud, deploy) se
  autentican recién en M5.

## Estructura (la creó F00; nadie inventa otra)

Lo marcado *(pendiente)* todavía no existe: lo crea la historia que lo necesite, en ese lugar.

```
src/
  app/[locale]/           rutas y layouts bajo el segmento de idioma (es sin prefijo): composición
                          + fetch + acciones · loading.tsx, error.tsx y los grupos de ruta
                          (public) (auth) (app) (pendiente)
  app/[locale]/muestra/   las primitivas vivas, solo en desarrollo; 404 en producción
  components/<dominio>/   PetCard, VerificationBadge, ApplicationInbox…: reciben el objeto por
                          props (pendiente)
  components/ui/          las once primitivas de docs/10, a mano sobre Radix: sin dominio, sin
                          i18n, sin datos
  hooks/                  useX: lógica cliente con estado (pendiente)
  lib/<dominio>/          lógica pura · lib/schemas/ (zod) · lib/supabase/queries/ (única puerta
                          a la DB) (pendiente)
  lib/supabase/client.ts  el cliente de la base; nadie lo importa fuera de lib/supabase/
  lib/supabase/types.ts   generado desde la DB con `pnpm db:types`, nunca a mano
  lib/i18n/               routing.ts y request.ts de next-intl
  lib/config.ts           APP_NAME, APP_URL
  lib/env.ts              lee el entorno y nombra la variable que falta
  actions/<dominio>.ts    Server Actions → ActionResult<T> (pendiente)
  styles/globals.css      los tokens de docs/10 y los recursos del cartel (.afiche .cinta …)
  proxy.ts                next-intl; en Next 16 se llama proxy, no middleware
messages/es.json          todos los textos visibles, por namespace
supabase/migrations/      SQL forward-only · supabase/seed.sql datos sintéticos (hoy sin personas)
tests/gates/              cada regla del repo demostrada con un ejemplo que la viola; paridad de
                          tokens contra docs/10
tests/db/                 arnés de privacidad: visitante anónimo, persona sintética, servicio
tools/oxlint-rules/       las reglas propias del repo, como plugin de oxlint
specs/<nnn-slug>/         spec.md, plan.md, tasks.md de cada historia (spec-kit)
docs/design/              referencia visual de la identidad; no es código
scripts/verify.mjs        las siete etapas de `pnpm verify`, en orden
scripts/walk.mjs          driver de capturas → .artifacts/<slug>/ (gitignored)
```

## Comandos (contrato: F00 los crea con estos nombres; las etapas los usan tal cual)

- `pnpm exec supabase start` · `pnpm exec supabase db reset` (migraciones + seed en local) ·
  `pnpm dev`. El CLI es una dependencia del proyecto: un `supabase` a secas puede ser otra
  versión instalada en la máquina.
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (Vitest, incluye RLS contra Supabase local) ·
  `pnpm mutation` (Stryker sobre los archivos tocados desde `main`; `pnpm mutation:all` todo) ·
  `pnpm build` · `pnpm start` · `pnpm e2e` (Playwright contra `next start`) · `pnpm lighthouse`
  (Lighthouse CI contra `next start`, presupuesto en `.lighthouserc.json`)
- `pnpm verify` = todo lo anterior en orden. Es la compuerta completa: corre en local antes de
  abrir el PR y es exactamente lo que corre CI. **Sin Vercel hasta el MVP (decisión 2026-09-17).**
- `pnpm db:types` → regenera `src/lib/supabase/types.ts` (`scripts/db-types.mjs`, que invoca el CLI del proyecto y escribe con LF)
- `node scripts/walk.mjs --story <slug> [rutas]` → capturas a 390 y 1280 px para el
  design-reviewer (`--phone-only` deja solo la primera)
- Compuerta local mínima antes de cada commit: `pnpm lint && pnpm typecheck && pnpm test`

## Convenciones rápidas

- Código en inglés, UI en español. `application`, no `solicitud`. Glosario en `docs/06-i18n.md`.
- Archivos kebab-case; componentes PascalCase; hooks `useX`; actions verbo+sustantivo
  (`createPet`); queries `getX` / `listX`; booleanos `isX` / `hasX` / `canX`.
- Server Actions devuelven `ActionResult<T>`, no lanzan. El `error` es una clave de i18n.
- Un schema zod por form en `lib/schemas/`, compartido entre cliente y server.
- Queries de Supabase solo en `lib/supabase/queries/`. Nadie hace `.from('pets')` fuera de ahí.
- Tokens de diseño en `globals.css`. Nunca un hexadecimal en un componente. `cva` para variantes.
- Todo componente con datos tiene tres estados diseñados: cargando (skeleton), vacío, error.
- TypeScript `strict`, cero `any`. Commits: Conventional Commits, en inglés. Issues y PRs en español.
- **Comentarios solo cuando hacen falta.** El código dice qué hace; un comentario dice por qué,
  y solo cuando el porqué no es obvio: una regla de negocio no evidente, un workaround con su
  causa, una decisión que parece rara. Nunca narrar lo que hace el código, repetir el nombre de
  la función ni contar la historia de cómo se llegó ahí (eso va al commit o al doc). Sin bloques
  de encabezado; un archivo arranca con una línea de propósito solo si el nombre no alcanza.
- **No se testea todo.** Se testea lo que, si se rompe, engaña a una persona, expone un dato o
  calcula mal: reglas de negocio (función pura o RLS), schemas zod, cálculos con casos borde,
  componentes cuya conducta cambia con el estado del dominio, y los 2-3 flujos críticos con
  Playwright. Nada para páginas, `ui/`, queries finas, componentes que solo pintan ni
  "renderiza sin explotar". El plan dice qué y por qué (`docs/09` §Qué vale la pena testear).
  Nunca se debilita ni se borra un test para que el código pase.
- **Cada test prueba lo que dice probar.** Stryker al **100 %** sobre lo que tiene test
  (`stryker.config.mjs`, `scripts/mutation.mjs`): un mutante que sobrevive es una aserción que
  falta; un mutante equivalente se anota en su línea con el motivo y el revisor lo verifica.
- Ramas `feature/<n>-<slug>` desde `main`; squash al mergear.

## Stack

Next.js 16 (App Router, TS) · Supabase Cloud (Postgres, Auth, Storage, RLS; CLI local con Docker)
· Tailwind v4 + shadcn/ui · Motion (`LazyMotion` + `m`) · View Transitions API · next-intl ·
zod (sin librería de formularios) · Resend con plantilla propia · Twilio Verify (OTP) ·
PostHog · `next/og` · Vercel Hobby + Vercel Cron diario (recién para la beta; hasta el MVP
todo corre en local).
Detalle y justificación en `docs/07-stack.md`.

## Estado (2026-09-18)

- **F00 construido** (historia #1, `M0 - Base`): proyecto Next.js 16 sobre TypeScript 7, los doce
  comandos, `pnpm verify` igual a la CI, las compuertas de `docs/09` como checks con su
  demostración, base local con el arnés de privacidad, los tokens y las once primitivas `ui/`, la
  portada provisoria, `/muestra` y el driver de capturas. Sin producto todavía: ni cuentas, ni
  animales, ni tablas propias. Sin nombre. Sin Vercel hasta el MVP.
- **La identidad visual es «Cartel»** (decisión 2026-09-18): el cartel de "se busca hogar". La
  acción es tinta y el verde es confianza. Antes de tocar UI: `docs/10-design-system.md` §Cómo se
  aplica, que dice dónde *ver* el sistema (`/muestra`, `docs/design/`, las capturas).
- **El Supabase CLI es una dependencia de desarrollo**: se invoca con `pnpm exec supabase`, no con
  el del sistema.
- Limitaciones aceptadas en `docs/known-limitations.md`. La que más se nota: `pnpm lighthouse` no
  termina en Windows (KL-001), así que esa etapa se verifica en CI.
- Próximo paso: M1 arranca con F01 «Registro e ingreso sin contraseña con perfil básico», vía
  `/story-map new` y `/story-ship`. Esa historia trae la sesión de la app, las personas sembradas
  y la opción `--user` del driver.
