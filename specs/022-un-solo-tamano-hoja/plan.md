# Implementation Plan: Un solo tamaño de hoja y el menú quieto al navegar

**Branch**: `feature/187-un-solo-tamano-hoja` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/022-un-solo-tamano-hoja/spec.md`

## Summary

Desde 1024, toda pantalla con menú vive en la misma hoja de 1200 y el menú no se corre al navegar;
la cuenta suspendida, sin menú, conserva la hoja angosta. Cinco pantallas de una sola tarea
(Opinar, Entrar, «Mirá tu correo», Completar el perfil, Cuenta borrada) se arman en dos partes con
un layout nuevo. `PaperFrame` deja de recibir un tamaño: lo deriva de si lleva el menú. La barra de
desplazamiento deja de mover el centro. Sin datos, sin textos nuevos, sin dependencias.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router), React Server Components

**Primary Dependencies**: Tailwind v4, `class-variance-authority`, next-intl (sin claves nuevas)

**Storage**: N/A

**Testing**: ninguno nuevo (research R7); `pnpm gates:affected` y capturas con `scripts/walk.mjs`

**Target Platform**: navegador, 390 → 1920

**Project Type**: web

**Performance Goals**: sin JavaScript nuevo: `SingleTaskLayout` es un Server Component

**Constraints**: debajo de 1024 nada cambia (FR-009); tokens existentes solamente

**Scale/Scope**: 1 componente nuevo, 2 modificados, 5 layouts, 6 páginas, `globals.css`, docs/10

## Constitution Check

- **§I La historia dice el qué**: la spec no nombra componentes; este plan sí. ✓
- **Componentizar**: la forma de las cinco pantallas es `SingleTaskLayout`, extraída a la segunda
  repetición; capas app → components → ui respetadas (el layout vive en la app, no importa del
  dominio). ✓
- **Multilingüe**: ningún texto nuevo; se reubican los que ya están en `messages/es.json`. ✓
- **Liviana y linda**: Server Components; CSS solamente; tokens de docs/10; docs/10 actualizado con
  la decisión (FR-030). ✓
- **Sin scope creep**: no toca el menú, el pie, la tipografía ni las pantallas de columna de lectura
  de la cuenta. ✓
- **Privacidad**: la dirección de «Mirá tu correo» se sigue leyendo de la misma cookie; solo cambia
  de lado. ✓
- **Dependencia nueva**: ninguna. ✓
- **Encontrable**: `metadata` de cada página sin cambios. ✓

## Project Structure

### Documentation (this feature)

```text
specs/022-un-solo-tamano-hoja/
├── story.md
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── quickstart.md
└── tasks.md
```

Sin `data-model.md` ni `contracts/`: la historia no toca datos ni interfaces.

### Source Code

```text
src/styles/globals.css                                  scrollbar-gutter y la pared desde 1024 (R2)
src/app/[locale]/_components/paper-frame.tsx            ancho derivado de `menu` (R1)
src/app/[locale]/_components/page-shell.tsx             variante `wide` (R4)
src/app/[locale]/_components/single-task-layout.tsx     NUEVO (R3)
src/app/[locale]/(public)/layout.tsx                    sin `size`
src/app/[locale]/(app)/layout.tsx                       sin `size`
src/app/[locale]/(auth)/layout.tsx                      sin `size`
src/app/[locale]/(open)/layout.tsx                      sin `size`, comentario al día
src/app/[locale]/(suspended)/layout.tsx                 sin `size`, `menu={false}` sigue
src/app/[locale]/(open)/opinar/page.tsx                 SingleTaskLayout
src/app/[locale]/(auth)/entrar/page.tsx                 SingleTaskLayout
src/app/[locale]/(auth)/entrar/revisa-tu-correo/page.tsx SingleTaskLayout
src/app/[locale]/(auth)/completar-perfil/page.tsx       SingleTaskLayout
src/app/[locale]/(auth)/cuenta-borrada/page.tsx         SingleTaskLayout (R5)
src/app/[locale]/(auth)/entrar/enlace/page.tsx          PageShell `wide` (FR-027)
docs/10-design-system.md                                la decisión, el descarte, las filas
```

**Structure Decision**: el layout nuevo va en `src/app/[locale]/_components/` porque es parte del
marco de la app, como `PageShell`, y no tiene dominio; `components/ui/` son las once primitivas de
docs/10 y no crece por esto.

## Cómo se construye, por user story

### US1 — La hoja y el menú quietos (P1)

1. `PaperFrame`: el `cva` `sheet` pasa a una variante booleana `menu` (`true` → `max-w-listing`,
   `false` → `max-w-[var(--measure)]`); se borra `size` de `Props` y su `VariantProps`. El
   comentario de arriba cambia a la decisión nueva (una línea: el ancho sale de si hay menú, porque
   el menú es el mismo en todas las pantallas).
2. Los cinco layouts dejan de pasar `size`. El de `(open)` deja de decir «un volante».
3. `globals.css`, en la capa base y solo en `@media (width >= 1024px)`:
   `html { scrollbar-gutter: stable; }` y `body { background-color: var(--color-surface); }`.
4. `PageShell`: variante `wide` (R4). «El enlace no sirve» la usa: su bloque centrado queda centrado
   en la hoja desde 1024 y como hoy debajo.

Errores, «no encontrado» y esqueletos de carga ya usan `PageShell width="full"` o la columna dentro
de la hoja del grupo: con el cambio de `PaperFrame` quedan en 1200 sin tocarse (FR-007).

### US2 — Las pantallas de una sola tarea en dos partes (P2)

`SingleTaskLayout({ presentation, task })`, Server Component sin estado:

```tsx
<PageShell width="wide">
  <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-16">
    <div className="lg:sticky lg:top-6">{presentation}</div>
    <div className="lg:[&>:first-child]:mt-0">{task}</div>
  </div>
</PageShell>
```

Cada página mueve lo que tenía, sin cambiar textos ni márgenes del teléfono:

| Pantalla | `presentation` | `task` |
|---|---|---|
| Opinar | `h1` + bajada con `SupportReply` | `<div className="mt-6">` + `FeedbackForm` |
| Entrar | `h1` + bajada + el aviso (`layout.notice`) | el bloque `mt-8` de Google y el correo |
| «Mirá tu correo» | «Volver» + `h1` + «Te mandamos un enlace a …» | `Card mt-6` + `ResendLinkButton` |
| Completar el perfil | `h1` + bajada | `ProfileForm` (con `accountActions`) |
| Cuenta borrada | `h1` + `EmptyState` sin acción (R5) | «Crear otra cuenta» + «Volver al inicio» |

## Diseño

Guía: docs/10 §Pantallas anchas (decisión 2026-10-17, ya escrita en esta rama) y §Layout.

### Wireframes (1280; la hoja mide 1200)

```
Cualquier pantalla con menú
┌─────────────────────────────── pared ───────────────────────────────┐
│   ┌──────────────────────────── hoja 1200 ───────────────────────┐  │
│   │ [Marca]       Animales en adopción  Mis animales … Mi perfil │  │  ← mismo lugar siempre
│   ├──────────────────────────────────────────────────────────────┤  │
│   │  contenido (columna de lectura, pared, dos partes…)          │  │
│   ├──────────────────────────────────────────────────────────────┤  │
│   │  pie                                                         │  │
│   └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

Opinar (y Entrar, «Mirá tu correo», Completar el perfil con la misma forma)
┌──────────────────────────── hoja 1200 ───────────────────────┐
│ [Marca]                 Animales en adopción  Entrar  Opinar │
├──────────────────────────────────────────────────────────────┤
│ Opinar                        │ Tu opinión                   │
│ (afiche --text-2xl)           │ ┌──────────────────────────┐ │
│ Llega sin tu nombre y la lee  │ │                          │ │
│ el equipo. (+ la frase del    │ │                          │ │
│ WhatsApp, si hay número)      │ └──────────────────────────┘ │
│ ↑ sticky, top --space-6       │ ┄┄┄┄┄┄┄┄ Enviar ┄┄┄┄┄┄┄┄┄┄┄ │
│        542                    64          542                │
├──────────────────────────────────────────────────────────────┤
│ pie                                                          │
└──────────────────────────────────────────────────────────────┘

Cuenta borrada
┌──────────────────────────── hoja 1200 ───────────────────────┐
│ Listo, no queda nada tuyo     │ [Crear otra cuenta]          │
│ (cartel en blanco)            │ Volver al inicio             │
│ Borramos tu perfil, tu foto…  │                              │
└──────────────────────────────────────────────────────────────┘

«El enlace no sirve» (centrada en la hoja, como un error)
┌──────────────────────────── hoja 1200 ───────────────────────┐
│                     El enlace no sirve                       │
│                     (cartel en blanco)                       │
│               Este enlace venció. Duran una hora…            │
│                  [Enviarme otro enlace]                      │
└──────────────────────────────────────────────────────────────┘

Debajo de 1024: todas como hoy, una columna, presentación y después tarea.
```

### Componentes

- **Reusados**: `PaperFrame`, `AccountMenu`, `SiteFooter`, `PageShell`, `EmptyState`, `LinkButton`,
  `Card`, `FeedbackForm`, `EmailLinkForm`, `GoogleButton`, `EmailFallback`, `ResendLinkButton`,
  `ProfileForm`, `AccountActions`, `LinkProblemScreen`, `ErrorScreen`.
- **Creado**: `SingleTaskLayout` (app), con su fila en la tabla de componentes de docs/10.
- **Modificados**: `PaperFrame` (variantes `con menú · sin menú`), `PageShell` (variante `wide`).

### Tokens

`--container-listing`, `--measure`, `--space-16` (entre las dos partes), `--space-6` (el `top`
del `sticky`), `--spacing-gutter-wide`, `--color-surface` (la pared y el lugar de la barra),
`--color-ink` (el borde). Ninguno nuevo.

### Lo que llama la atención

No cambia: en cada pantalla sigue siendo lo que era (la tirita de Opinar, la dirección de «Mirá tu
correo», la tirita de Completar el perfil). La presentación en voz de afiche ancla la izquierda; la
tarea no suma ningún acento.

### Los tres estados

- **Cargando**: los `loading.tsx` existentes viven dentro de la misma hoja; las cinco pantallas de
  una sola tarea no tienen datos que cargar del lado del cliente salvo el envío, cuyo estado
  (`loading` del botón) queda en la tarea.
- **Vacío**: los estados vacíos de cada pantalla no cambian; los centrados siguen centrados en la
  hoja de 1200 (FR-010).
- **Error**: los de cada formulario quedan en la tarea, junto al campo (FR-025); las pantallas de
  error del grupo, centradas en la hoja (FR-007).

## Verificación

- `pnpm gates:affected` en cada user story.
- `node scripts/walk.mjs --story un-solo-tamano-hoja / /animales /entrar /opinar /preguntas
  /cuenta-borrada /entrar/enlace?motivo=expired` y, con `--user`, `/mis-animales /mi-perfil
  /completar-perfil`: capturas a 390 y 1280 para el `design-reviewer`.
- La medición de `quickstart.md` (posición de cada enlace del menú a 1280, 1100 y 1920).

## Complexity Tracking

Sin violaciones.
