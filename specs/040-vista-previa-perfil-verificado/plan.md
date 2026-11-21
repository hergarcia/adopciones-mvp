# Implementation Plan: Que la vista previa del enlace de mi perfil diga qué tengo verificado

**Branch**: `feature/280-vista-previa-perfil-verificado` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/040-vista-previa-perfil-verificado/spec.md`

## Summary

El perfil público suma a sus metadatos, solo con nivel 1 a 3, el texto debajo del título con las
palabras de la chapita y una imagen que depende solo del nivel: tres tarjetas fijas, una por nivel,
con el nivel en verde dentro del cuadrado del centro y el nombre del sitio (research R1, R2, R7). Sin
nada verificado o con «Este perfil no existe», los metadatos quedan como hoy (R3). robots.txt abre
`/perfil` a los lectores de vista previa, porque hoy Facebook no arma la tarjeta de un perfil (R4).
«Mi perfil» suma una línea en «Tu perfil público» con nivel 1 o más (R6). En la medición,
`profile_link_copied` y `public_profile_viewed` suman `owner_level`, el nivel de la dueña del perfil
leído en el servidor (R5). Sin migración ni dependencia nueva. docs/03 §Métricas de éxito suma la
lectura 16.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components, Route Handlers y
Server Actions)

**Primary Dependencies**: las de siempre (`next/og` para la imagen, next-intl). **Ninguna dependencia
nueva.**

**Storage**: ninguno nuevo. Se lee el perfil público que ya existe (data-model.md)

**Testing**: Vitest (unitarias), Stryker al 100 % sobre lo que tiene test, Playwright (el test de
vista previa de `aval.spec.ts`, partido en dos y ampliado; research R8)

**Target Platform**: web mobile-first, 390 px y 1280 px; la imagen, 1200 × 630 para WhatsApp y
Facebook

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: cero JS nuevo en el cliente: la línea es texto del servidor y la imagen es una
ruta. La imagen se dibuja una vez por nivel y queda en caché para siempre (R1). La medición del
enlace ya no espera respuesta en el cliente. Presupuesto de siempre: JS inicial < 150 KB, LCP < 2,5 s,
Lighthouse mobile ≥ 90

**Constraints**: Ley 18.331 (la vista previa y la imagen, solo el nombre y el nivel; la imagen, solo
el nivel); nunca un nivel más alto que el del perfil público; la medición sin la persona; nada se
indexa (el perfil sigue `noindex` y robots.txt solo se abre a los lectores de vista previa)

**Scale/Scope**: beta de 3-5 rescatistas y pocos adoptantes; una página con metadatos nuevos, una
ruta de imagen, una línea en «Mi perfil», dos momentos con una propiedad más

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra rutas, eventos ni componentes; el cómo vive acá, en research y en los contratos. |
| II. Una feature, un PR | Tres user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R8: lo puro con Stryker al 100 %, el e2e de vista previa partido sin borrar aserciones. |
| IV. Reglas como código | «Sin nivel, la vista previa de hoy» vive en `profileShareMetadata`; «sin nivel, sin propiedad», en `profileLinkProps` y `profileViewProps`; «solo 1, 2 o 3 tienen imagen», en `parseShareLevel`. Cada una con su prueba. |
| V. Datos mínimos y privados | Nada nuevo se guarda. La imagen no sabe de quién es (R1). robots.txt se abre solo a los lectores de vista previa, que ya ven el perfil sin fotos (R4); queda en el reporte de la semana. Sin tabla nueva: no hay regla de RLS nueva que probar en `tests/db`. |
| VI. Sin deriva | No cambian el perfil público, su dirección, su `noindex`, la vista previa de un animal, de una camada, del listado ni de la portada, ni los botones de compartir. |
| VII. Liviana y linda | Cero JS nuevo; tokens y componentes de docs/10; estados en §Diseño. |
| VIII. Autonomía con veto | Las seis decisiones de la historia ya están en docs/03 en esta rama (cinco en §1, la de la medición en §7); ninguna regla que juzga a los agentes cambia. |

Sin violaciones. Re-chequeado después del diseño: igual.

## Project Structure

### Documentation (this feature)

```text
specs/040-vista-previa-perfil-verificado/
├── story.md             # La historia #280, verbatim
├── spec.md
├── plan.md              # Este archivo
├── research.md          # R1–R8
├── data-model.md        # Sin migración; los valores nuevos
├── quickstart.md
├── contracts/
│   ├── link-preview.md      # Lo que lee un lector de vista previa
│   └── analytics-events.md  # Los dos momentos con owner_level
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
  app/
    robots.ts                                   # CAMBIA: /perfil en el allow de los lectores (R4)
    robots.test.ts                              # CAMBIA
    [locale]/(public)/perfil/
      [id]/page.tsx                             # CAMBIA: generateMetadata con profileShareMetadata; owner_level en la visita
      nivel/[level]/imagen/route.tsx            # NUEVO: la imagen de un nivel (R1)
    [locale]/(app)/mi-perfil/_components/
      my-profile-sections.tsx                   # CAMBIA: la línea con level >= 1 (R6)
  components/profile/
    profile-share-image.tsx                     # NUEVO: la tarjeta (R7)
    public-profile-links.tsx                    # CAMBIA: note opcional
  lib/
    profile/share-metadata.ts (+ .test.ts)      # NUEVO: profileShareMetadata, parseShareLevel, profileLevelImagePath (R3)
    og/share-layout.ts (+ .test.ts)             # CAMBIA: profileLevelSize (R7)
    analytics/events.ts                         # CAMBIA: owner_level en los dos momentos
    analytics/view-origin.ts (+ .test.ts)       # CAMBIA: profileViewProps con el nivel
    analytics/profile-events.ts (+ .test.ts)    # NUEVO: profileLinkProps (R5)
    supabase/queries/profiles.ts                # CAMBIA: getOwnPublicLevel (R5)
  actions/profile.ts                            # CAMBIA: trackProfileMoment suma owner_level
messages/es.json                                # CAMBIA: profile.public.preview_note
tests/e2e/aval.spec.ts                          # CAMBIA: la vista previa en dos casos (R8)
docs/03-mvp-features.md                         # CAMBIA: lectura 16 en §Métricas de éxito
docs/10-design-system.md                        # CAMBIA: fila de ProfileShareImage, PublicProfileLinks
docs/06-i18n.md                                 # sin cambio salvo que sin-slop pida un término
```

**Structure Decision**: la estructura de siempre (CLAUDE.md §Estructura). La ruta de la imagen vive
bajo el perfil público porque es lo que se abre a los lectores de vista previa (R1, R4).

## Diseño

Cargado antes de escribir: docs/10 (§Componentes, §Color, §Textos, §Cómo se aplica) y las filas de
`PetShareImage`, `SiteShareImage`, `PublicProfileLinks`, `ProfileLinkLine`, `MyProfileLayout` y
`CopyProfileLink`. El skill `frontend-design:frontend-design` no está en esta sesión; la build lo
carga antes de escribir JSX. Nada nuevo en tokens.

### Imagen de la vista previa de un perfil — 1200 × 630 (`ProfileShareImage`)

```
x 0            285                          915           1200
┌───────────────┬────────────────────────────┬──────────────┐
│               │                            │              │
│               │                            │              │
│               │       Identidad            │              │  ← OG_PALETTE.primary, voz de afiche,
│   (papel,     │       verificada           │   (papel)    │    profileLevelSize (56–96 px),
│    vacío)     │       y avalada            │              │    centrado, hasta 2 renglones
│               │                            │              │
│               │                            │              │
│               │        Adopciones          │              │  ← 28 px, OG_PALETTE.inkMuted, a
└───────────────┴────────────────────────────┴──────────────┘    SHARE_LAYOUT.inset del borde
                 └─ cuadrado de la miniatura ─┘
```

- Fondo `OG_PALETTE.canvas` (el papel, `--color-canvas`). Sin foto, sin el nombre de la persona, sin
  cinta, sin la chapita metálica. Todo el texto dentro del cuadrado del centro.
- **Lo único que llama la atención**: el nivel en verde. El nombre del sitio pesa menos y va abajo.
- **Estados**: no tiene datos que cargar; un nivel que no es 1, 2 o 3 da 404 y la app no dibuja
  imagen. Si la imagen no se puede dibujar, la app muestra la tarjeta sin imagen con el texto del
  nivel (FR-009).

### «Mi perfil», «Tu perfil público» — 390 px (con nivel 1 o más)

```
┌──────────────────────────────────────┐
│ Tu perfil público                    │  ← h2 --text-lg bold, el de hoy
│ Cuando pegás este enlace en un chat  │  ← NUEVO: <p> --text-base ink, max --measure
│ o en un grupo, se ve qué tenés       │
│ verificado.                          │
│ [Mandar el enlace] Ver mi perfil     │  ← CopyProfileLink secondary + LinkButton ghost, los de hoy
│ público                              │
│ Enlace copiado                       │  ← output de hoy
└──────────────────────────────────────┘
```

**Sin nada verificado** (390 y 1280 px): la sección de hoy, sin la línea. **A 1280 px**: la misma
sección en la columna de «lo que ven los demás» de `MyProfileLayout`; la línea ocupa hasta
`--measure`.

- **Reutiliza**: `PublicProfileLinks`, `CopyProfileLink`, `LinkButton`, `MyProfileLayout`; para la
  imagen, `OG_PALETTE`, `SHARE_FONT`, `SHARE_LAYOUT`, `shareFont`, `smallJpeg`, `siteShareVersion`.
- **Crea**: `ProfileShareImage` (profile; nivel 1 · 2 · 3): la tarjeta de arriba, con estilos en
  línea porque `ImageResponse` no lee clases.
- **Cambia**: `PublicProfileLinks` recibe `note?: string` y lo dibuja entre el `h2` y los botones;
  el `gap-3` de hoy separa los tres.
- **Tokens**: `--color-ink`, `--text-base`, `--measure`, `--space-3` (el `gap-3` de hoy); en la
  imagen, `OG_PALETTE.canvas`, `.primary` y `.inkMuted` (copia de `--color-canvas`,
  `--color-primary`, `--color-ink-muted`, con su test de paridad).
- **Lo único que llama la atención en «Mi perfil»**: sigue siendo la tirita «Editar mi perfil». La
  línea es texto corrido, sin color ni marco, como `ProfileLinkLine`.
- **Accesibilidad**: la línea es un `<p>` dentro de la `section`, leída después del título y antes
  de los botones. La imagen lleva `og:image:alt` con las palabras del nivel.
- **Estados**: la línea no trae datos propios: usa el nivel que la pantalla ya leyó. Cargando y error
  son los de «Mi perfil» (su `loading.tsx` y su `error.tsx`, que no se tocan; R6). Vacío: sin nivel, la
  línea no está.

## Cómo se construye, por user story

1. **US1 — la vista previa (P1)**: `share-metadata.ts` con sus pruebas, `profileLevelSize` con la
   suya, `ProfileShareImage`, la ruta de la imagen, `generateMetadata` del perfil, robots.txt con su
   prueba, el e2e partido en dos; la fila de `ProfileShareImage` en docs/10.
2. **US2 — la medición (P2)**: `events.ts`, `profileViewProps` con el nivel y su prueba ampliada,
   `profileLinkProps` con su prueba, `getOwnPublicLevel`, `trackProfileMoment`, la visita en la
   página; la lectura 16 en docs/03 §Métricas de éxito.
3. **US3 — la línea (P3)**: el texto en `messages/es.json` (con `sin-slop`), `note` en
   `PublicProfileLinks`, la condición en `MyProfileSections`; la fila de `PublicProfileLinks` en docs/10.

## Complexity Tracking

Sin violaciones de la constitución.
