# adopciones-mvp (codename provisorio)

Plataforma que conecta personas que dan animales en adopción con personas que quieren adoptar.
Diferencial: **verificación de las personas** antes de intercambiar datos.

> El nombre `adopciones-mvp` es un codename. El nombre real se define antes de la beta con rescatistas.
> Ver `docs/04-nombre.md`.

## Levantar el proyecto de cero

Hace falta **Node 26**, **pnpm 12** y **Docker** corriendo. El Supabase CLI no: viene con las
dependencias, y se invoca siempre con `pnpm exec supabase` para que no se cuele otra versión
instalada en la máquina.

```bash
pnpm install                           # dependencias y el gancho de pre-commit
pnpm exec playwright install chromium  # el navegador que usan e2e y el driver de capturas
pnpm exec supabase start               # la primera vez baja imágenes: tarda unos minutos
cp .env.example .env.local             # PowerShell: Copy-Item .env.example .env.local
pnpm exec supabase status -o env       # imprime los valores; se copian a .env.local
```

En `.env.local` van tres variables: `NEXT_PUBLIC_SUPABASE_URL` (el `API_URL` de la salida),
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (`ANON_KEY`) y `SUPABASE_SERVICE_ROLE_KEY` (`SERVICE_ROLE_KEY`).
La clave de servicio va **sin** el prefijo `NEXT_PUBLIC_`: todo lo que lleva ese prefijo viaja al
browser, y hay una compuerta que falla si aparece así.

```bash
pnpm dev       # http://localhost:3000 · las primitivas vivas en /muestra (solo en desarrollo)
pnpm verify    # las siete etapas, en orden, igual que corre CI
```

`pnpm verify` corre lint, typecheck, test, mutation, build, e2e y lighthouse, corta en la primera
que falla y cierra diciendo qué omitió. Sin base local las pruebas que la necesitan se omiten con
aviso; en CI, fallan.

**En Windows, `pnpm lighthouse` no termina** (KL-001 en `docs/known-limitations.md`): las otras
seis etapas sí corren en local, y esa se verifica en CI.

Capturas para revisar diseño, con `pnpm dev` levantado:

```bash
node scripts/walk.mjs --story <slug> / /muestra
```

## Versiones instaladas

Verificadas como última estable el **2026-09-18**. Renovate abre los PRs de actualización; el por
qué de cada una está en `docs/07-stack.md` §Dependencias instaladas.

| Paquete | Versión | Paquete | Versión |
|---|---|---|---|
| `next` | 16.3.5 | `typescript` | 7.0.2 |
| `react` · `react-dom` | 19.3.0 | `tailwindcss` · `@tailwindcss/postcss` | 4.3.3 |
| `next-intl` | 4.14.5 | `oxlint` | 1.83.0 |
| `@supabase/supabase-js` | 2.116.0 | `oxlint-tsgolint` | 7.0.2002 |
| `@radix-ui/react-dialog` | 1.1.23 | `prettier` | 3.9.8 |
| `@radix-ui/react-select` | 2.3.7 | `vitest` | 5.0.1 |
| `@radix-ui/react-toast` | 1.2.23 | `@stryker-mutator/core` · `vitest-runner` | 10.0.0 |
| `class-variance-authority` | 0.7.1 | `@playwright/test` | 1.63.0 |
| `clsx` | 2.1.1 | `@lhci/cli` | 0.15.1 |
| `tailwind-merge` | 3.7.0 | `lefthook` | 2.1.14 |
| `@types/node` | 26.6.1 | `supabase` (CLI) | 2.117.0 |
| `@types/react` · `@types/react-dom` | 19.3.0 | `renovate` | 44.97.4 |

Entorno: Node 26.4.0 · pnpm 12.4.2 · Docker 29.7.2.

## Estructura

- `src/` — la app. El mapa está en `CLAUDE.md` §Estructura.
- `docs/` — ideas, decisiones, investigación y planificación. Un archivo por tema; el índice es
  `docs/README.md`. La guía de diseño es `docs/10-design-system.md`.
- `tests/`, `tools/` — las compuertas del repo demostradas con ejemplos, el arnés de privacidad y
  las reglas propias de lint.
- `.claude/`, `.specify/`, `.github/`, `scripts/` — el flujo de trabajo automatizado. Cómo se
  trabaja: `docs/09-flujo-de-trabajo.md`.

## Estado

- [ ] Nombre definido
- [ ] Entrevistas con rescatistas (10-15)
- [ ] MVP construido
- [ ] Beta cerrada con 3-5 rescatistas
