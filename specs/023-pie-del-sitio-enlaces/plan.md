# Implementation Plan: Pie del sitio con los enlaces que más se buscan

**Branch**: `feature/200-pie-del-sitio-enlaces` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/023-pie-del-sitio-enlaces/spec.md`

## Summary

El pie de todas las pantallas pasa de tres renglones sueltos (pregunta + enlace) a tres grupos con
nombre —Animales, Confianza, Ayuda— con seis enlaces, y la firma del sitio debajo. Qué grupos y
enlaces van lo decide una función pura y probada (`footerGroups`); `SiteFooter` la traduce y la
pinta; `PaperFrame` le dice si es el pie entero o solo Ayuda (la cuenta suspendida). Una columna
debajo de 1024, tres columnas lado a lado desde ahí. Sin datos, sin base, sin dependencias nuevas.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 App Router, React 19

**Primary Dependencies**: next-intl, Tailwind v4 con los tokens de `globals.css`, `class-variance-authority`. Ninguna nueva.

**Storage**: N/A: el pie no lee ni guarda datos. El número de soporte sale de `SUPPORT_WHATSAPP` (`lib/config.ts`), como hoy.

**Testing**: Vitest (unit, `src/lib/footer/groups.test.ts`), Stryker al 100 % sobre ese archivo, Playwright (`tests/e2e/suspension.spec.ts`, ampliado)

**Target Platform**: web, 390 px primero; la hoja desde 1024

**Project Type**: web app (Next.js)

**Performance Goals**: el presupuesto de docs/07 (LCP < 2,5 s, JS inicial < 150 KB). El pie suma una hoja cliente mínima (`FooterLink`, `usePathname`), el mismo costo que `NavLink`, que ya está en el paquete de todas las pantallas.

**Constraints**: Server Components; todo texto en `messages/es.json`; solo tokens de docs/10; el pie es el mismo con sesión y sin ella (no lee la sesión)

**Scale/Scope**: un componente de layout que aparece en todas las pantallas

## Constitution Check

- **§I La historia dice el qué**: la spec no nombra componentes; este plan sí. ✓
- **§III Qué se testea**: la regla de visibilidad y orden (pura) y que la cuenta suspendida recibe
  solo Ayuda (e2e). Nada para componentes que pintan (research R10). ✓
- **§V Datos personales**: ninguno. El pie no lee la sesión. ✓
- **§VI Sin deriva**: nada de «Fuera del MVP»; redes, legales, novedades, idioma y mapa del sitio
  quedan fuera, como dice la historia. ✓
- **Componentizar**: `footerGroups` (regla con nombre), `BrandSignature` (la firma, segunda
  aparición), `useIsCurrentPath` (segunda repetición de la comparación de `NavLink`),
  `FooterGroup` y `FooterLink`. Capas app → components → ui respetadas. ✓
- **Multilingüe**: namespace `footer` nuevo; se borran las tres claves que ya no se usan (R8). ✓
- **Liviana y linda**: Server Components salvo `FooterLink`; CSS solamente; tokens de docs/10. ✓
- **Dependencia nueva**: ninguna. ✓
- **Encontrable**: no toca `metadata`; los enlaces del pie son `a` reales en el HTML del servidor,
  que un crawler puede seguir (hoy nada se indexa: docs/04). ✓

## Project Structure

### Documentation (this feature)

```text
specs/023-pie-del-sitio-enlaces/
├── story.md             # cuerpo verbatim de la historia #200
├── spec.md
├── checklists/requirements.md
├── plan.md              # este archivo
├── research.md
├── quickstart.md
└── tasks.md             # /speckit-tasks
```

Sin `data-model.md` ni `contracts/`: no hay datos ni interfaces externas.

### Source Code

```text
src/
  lib/footer/
    groups.ts                     # NUEVO: footerGroups({ scope, supportHref }) → FooterGroup[]
    groups.test.ts                # NUEVO: orden y visibilidad, 100 % de mutación
  hooks/
    use-is-current-path.ts        # NUEVO: la comparación de NavLink, extraída
  app/[locale]/_components/
    site-footer.tsx               # REESCRITO: async server; traduce y pinta los grupos y la firma
    footer-link.tsx               # NUEVO: hoja cliente, textLink + aria-current
    brand-signature.tsx           # NUEVO: la firma (pata + APP_NAME), sin enlace
    wordmark.tsx                  # usa BrandSignature adentro de su Link
    nav-link.tsx                  # usa useIsCurrentPath
    paper-frame.tsx               # prop questions → footer: 'site' | 'help'; deja de armar los renglones
  app/[locale]/(suspended)/layout.tsx   # footer="help" en vez de questions={false}
messages/es.json                  # + footer.*; − feedback.footer, support.footer, questions.footer
docs/10-design-system.md          # SiteFooter y PaperFrame al día, filas nuevas, la decisión (FR-021)
tests/e2e/suspension.spec.ts      # amplía la prueba del pie de la cuenta suspendida
tests/e2e/animales.spec.ts        # acota «Animales en adopción» a la cabecera (R9)
tests/e2e/portada.spec.ts         # acota «Publicar un animal» al contenido (R9)
tests/e2e/enlace-no-sirve.spec.ts # acota «Publicar un animal» al contenido (R9)
```

`FooterGroup` (el `h2` y su lista) vive dentro de `site-footer.tsx`, como hoy `FooterLine`: se usa
solo ahí y no tiene otro consumidor.

## Cómo se construye, por user story

### US1 — Llegar desde el pie a donde se suele querer ir (P1)

1. `src/lib/footer/groups.ts`:

   ```ts
   export type FooterScope = 'site' | 'help'
   export type FooterGroupId = 'animals' | 'trust' | 'help'
   export type FooterLinkId = 'listing' | 'publish' | 'levels' | 'questions' | 'feedback' | 'support'
   export type FooterLink = { id: FooterLinkId; href: string; external: boolean }
   export type FooterGroup = { id: FooterGroupId; links: FooterLink[] }

   export function footerGroups(options: {
     scope: FooterScope
     supportHref: string | null
   }): FooterGroup[]
   ```

   Destinos: `LISTING_PATH`, `PUBLISH_PATH` (`lib/pets/paths`), `LEVELS_PATH`
   (`lib/profile/public-paths`), `QUESTIONS_PATH` (`lib/questions/paths`), `FEEDBACK_PATH`
   (`lib/feedback/screens`) y el `supportHref` recibido (la ruta propia que mide y redirige). El
   orden es el de la spec (FR-001–FR-004). `external` es `true` solo para `support`.
2. Test `groups.test.ts` (research R10).
3. `useIsCurrentPath(href)` en `src/hooks/`, y `NavLink` pasa a usarlo sin cambiar su conducta.
4. `FooterLink` (`'use client'`): `Link` con `textLink({ weight: 'medium', placement: 'block' })`,
   `prefetch={false}`, `aria-current="page"` y `decoration-4` cuando `useIsCurrentPath` da `true`.
5. `BrandSignature` y `Wordmark` sobre ella.
6. `SiteFooter({ scope })`, async: lee `getTranslations('footer')` y `supportWhatsAppHref(SUPPORT_WHATSAPP)`,
   llama a `footerGroups` y pinta cada grupo como `FooterGroup` (`h2` con `id` + `ul
   aria-labelledby`); cada enlace interno es un `FooterLink`, el de soporte es
   `SupportWhatsAppLink` (otra pestaña, `rel="noopener"`, como hoy). Debajo, `BrandSignature`.
7. `PaperFrame`: deja de traducir y armar los renglones; pasa `scope={footer}` a `SiteFooter`. Prop
   `footer?: FooterScope` (por omisión `'site'`), en lugar de `questions`.
8. `messages/es.json` (research R8).
9. Acotar los localizadores de e2e que chocan (research R9).

### US2 — El pie se acomoda al ancho y a cada situación (P2)

1. Las clases responsivas de `SiteFooter` (§Diseño): una columna debajo de 1024, `lg:grid-cols-3`
   desde ahí.
2. `(suspended)/layout.tsx` pasa `footer="help"`.
3. Ampliar `tests/e2e/suspension.spec.ts` (research R10).
4. Error, «no encontrado» y carga: no hay trabajo. `error.tsx`, `not-found.tsx` y `loading.tsx`
   viven dentro de los layouts de grupo que ponen `PaperFrame`, así que el pie ya está; el
   quickstart lo comprueba.
5. docs/10 (FR-021): la fila de `SiteFooter` con la decisión nueva; la de `PaperFrame` con `footer`
   en lugar de `questions`; filas nuevas para `BrandSignature` y `FooterLink`; la decisión del
   2026-10-09 de la historia #8 sobre el primer renglón del pie a §Descartado, con el motivo.

## Diseño

Se cargó `frontend-design:frontend-design` y se trabajó con docs/10 abierto. El pie es un plano
secundario: piedra (`--color-surface`) separada del contenido por el divisor entre planos, como hoy.
No compite con la `tirita` de la pantalla.

### Wireframes

```
Teléfono (390)                          Desde 1024 (la hoja, 1200)
┌──────────────────────────┐            ┌──────────────────────────────────────────────────────────┐
│ … contenido de la pantalla│            │ … contenido de la pantalla                               │
├══════════════════════════┤ 2px line   ├══════════════════════════════════════════════════════════┤
│ Animales          (afiche)│            │ Animales              Confianza            Ayuda          │
│ Animales en adopción      │ 44 px      │ Animales en adopción  Qué dice cada nivel  Opinar         │
│ Publicar un animal        │ 44 px      │ Publicar un animal    Preguntas y resp.    Escribinos por │
│                           │ 32 px      │                                            WhatsApp       │
│ Confianza                 │            │                                                          │
│ Qué dice cada nivel       │            │ [pata] Nombre                                            │
│ Preguntas y respuestas    │            └──────────────────────────────────────────────────────────┘
│                           │
│ Ayuda                     │            Cuenta suspendida (hoja angosta, 640)
│ Opinar                    │            ┌────────────────────────────┐
│ Escribinos por WhatsApp   │            │ Ayuda                      │
│                           │ 40 px      │ Opinar                     │
│ [pata] Nombre    (firma)  │            │ Escribinos por WhatsApp    │
└──────────────────────────┘            │                            │
                                         │ [pata] Nombre              │
                                         └────────────────────────────┘
```

Todo alineado a la izquierda (docs/10 §Layout). Sin número de soporte, Ayuda tiene solo «Opinar».

### Componentes

| Componente | Capa | Reutiliza / crea | Notas |
|---|---|---|---|
| `PaperFrame` | app | reutiliza, cambia la prop | `footer: 'site' \| 'help'` en lugar de `questions` |
| `SiteFooter` | app | reescribe | `scope`; los grupos, la firma |
| `FooterGroup` | app (dentro de `site-footer.tsx`) | crea | `h2` + `ul`, sin variantes |
| `FooterLink` | app, hoja cliente | crea | `textLink` `medium` `block`; actual: `aria-current` + subrayado de 4 px quieto |
| `SupportWhatsAppLink` | support | reutiliza sin cambios | ya es `textLink` `medium` `block` |
| `BrandSignature` | app | crea, extraída de `Wordmark` | `.afiche` `--text-xl`, `.firma`, `BrandMark` `compacta` |
| `Wordmark` | app | reutiliza | envuelve `BrandSignature` en su enlace |
| `NavLink` | app | reutiliza | usa `useIsCurrentPath` |
| `textLink` | ui | reutiliza | — |

### Tokens

- Color: `--color-surface` (fondo del pie), `--color-line` (divisor de 2 px arriba), `--color-ink`
  (nombres de grupo, enlaces, firma, anillo de foco vía `--color-focus`).
- Tipo: `.afiche` con `--text-lg` para el nombre de cada grupo; `--text-base` `--font-weight-medium`
  para los enlaces (la receta `textLink`); `.afiche` `--text-xl` para la firma.
- Espacio: `--spacing-gutter` / `--spacing-gutter-wide` a los costados (como hoy); `--space-8`
  arriba y abajo del pie; `--space-2` entre el nombre del grupo y su primer enlace; `--space-8`
  entre grupos apilados; `--space-12` entre columnas desde 1024; `--space-10` arriba de la firma.
- Movimiento: el de `textLink` (`--dur-fast`, `ease-out`) en el subrayado; nada más.
- Breakpoint: `lg` (1024), el de la hoja.

Ningún token nuevo.

### Lo que llama la atención

**La firma**, abajo de todo: el cartel se firma al pie. Es el único elemento del pie en voz de
afiche a `--text-xl` y el único con dibujo. Los nombres de grupo son afiche pero a `--text-lg` y sin
nada al lado; los enlaces, texto de lectura. Nada en verde (el verde es confianza, y ninguno de
estos enlaces es un estado verificado) ni en ceibo.

### Los tres estados

El pie no tiene datos que carguen ni puedan fallar: los grupos salen de una función pura y de la
configuración.

- **Cargando**: el pie lo pone el layout del grupo, así que ya está entero mientras la pantalla
  muestra su esqueleto (`loading.tsx` vive adentro del layout) y no cambia al llegar el contenido.
- **Vacío**: no aplica; Ayuda siempre tiene «Opinar» (spec §Edge Cases). Un grupo sin enlaces no se
  dibuja, con su nombre.
- **Error**: no aplica al pie; en una pantalla de error o de «no encontrado» de una zona, el pie es
  el de esa zona (FR-012, FR-013).

### Piso de accesibilidad

`<footer>` (contentinfo, como hoy). Cada grupo: `h2` con `id` y `ul aria-labelledby` con ese `id`,
así un lector de pantalla anuncia «Animales, lista, 2 elementos». El orden del DOM es el visual en
los dos anchos (FR-020). Los enlaces miden 44 px (`placement: 'block'`, `min-h-11`) y muestran el
anillo de foco del sitio. El WhatsApp se sigue abriendo en otra pestaña, como hoy.

## Verificación

- `pnpm gates:affected` en cada user story; `pnpm verify` al cerrar el build.
- `quickstart.md` y capturas con `node scripts/walk.mjs --story 200-pie-del-sitio-enlaces`
  (y `--user` para las pantallas con sesión) a 390 y 1280: portada, listado, ficha, una página de
  preguntas, «Mi perfil», Opinar, una «no encontrado» y la cuenta suspendida.

## Revisión del plan

El entorno de esta corrida no tenía la herramienta para lanzar subagentes: la pasada de
`plan-reviewer` la hizo la misma sesión, contra su definición, en una ronda. Sin CRITICAL ni HIGH.
Plegados: el `py-8` del pie difiere de la fila actual de docs/10 (`--space-6`) y se registra con la
decisión (T017); el contenedor `flex-1` que deja el pie al fondo se nombra para que no se pierda
(FR-018); los `id` de los encabezados son estáticos por grupo, porque hay un solo pie por pantalla.

## Complexity Tracking

Sin desvíos de la constitución.
