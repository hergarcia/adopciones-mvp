# Implementation Plan: Ver cuántas veces se abrió la ficha de cada animal, cuántos quisieron adoptarlo y a cuántos frenó la verificación

**Branch**: `feature/269-cuantas-veces-abrio-ficha` | **Date**: 2026-11-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/033-cuantas-veces-abrio-ficha/spec.md`

## Summary

Cada publicación (un animal solo o una camada) tiene una fila con cuatro números y un día: aperturas
de su ficha, toques de «Quiero adoptar», frenos por el teléfono y frenos por la identidad, y desde
cuándo se cuenta (research R1, R2). Las fichas públicas suman una apertura y la pantalla de
solicitar suma el toque y su freno con los mismos eventos de #240, siempre desde el servidor,
después de responder y sin poder lanzar (R3–R5). La página del animal y la de la camada en «Mis
animales» suman el bloque «Cómo le va a…», con las solicitudes contadas al leer y el nivel que pide,
que lee una función que solo contesta a quien publicó (R6), dentro de un `Suspense` con su esqueleto
y un error que se reintenta sin tocar el resto de la página (R7). En el teléfono va debajo de las
acciones; desde 1024, debajo de la foto, en la columna angosta (R8). docs/03 suma la lectura 10.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre (next-intl, zod, Supabase con `@supabase/ssr`, Radix en las
primitivas). **Ninguna dependencia nueva.**

**Storage**: Supabase Postgres local; una migración forward-only con una tabla sin políticas, dos
disparadores, tres funciones de sumar solo para el servicio y una de leer para quien publicó
(data-model.md)

**Testing**: Vitest (unitarias y `tests/db` contra Supabase local), Stryker al 100 % sobre lo que
tiene test, Playwright (un flujo)

**Target Platform**: web mobile-first, 390 px y 1280 px

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: nada nuevo en las fichas públicas que vea la persona: la cuenta sale con
`after`, sin JS ni espera. En «Mis animales» la hoja cliente nueva (`PetStatsLive`) es un botón y un
estado; el resto del bloque se dibuja en el servidor. Presupuesto de siempre: JS inicial < 150 KB,
LCP < 2,5 s, Lighthouse mobile ≥ 90

**Constraints**: Ley 18.331 (ni quién, ni cuándo, ni desde dónde); los números solo para quien
publicó, tampoco para quien administra; una cuenta que falla no se nota; dos a la vez suman las dos

**Scale/Scope**: beta de 3-5 rescatistas; dos fichas públicas y la pantalla de solicitar tocadas
para sumar; dos páginas de «Mis animales» con el bloque nuevo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra tablas, rutas ni componentes; el cómo vive acá, en research y en data-model. |
| II. Una feature, un PR | Tres user stories construidas y verificadas una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R10: reglas puras y schema con Stryker al 100 %, privacidad y reglas en `tests/db`, un e2e. |
| IV. Reglas como código | «Qué es una apertura» y «qué suma un toque» son funciones puras probadas; «solo quien publicó lee» y «solo el servidor suma» viven en la base y en `tests/db`; la lista de vistas previas es la de `link-preview.ts`, compartida con la medición. |
| V. Datos mínimos y privados | Cuatro enteros y un día por publicación; ninguna persona. Tabla sin políticas, función de lectura que pregunta si es suyo, funciones de sumar sin `execute` para ninguna sesión, y pruebas que intentan leer y sumar como visitante, persona y quien administra. |
| VI. Sin deriva | No se toca la medición (ningún momento nuevo ni cambiado), la ficha pública, la lista de «Mis animales», el perfil ni Administrar. No se sugiere cambiar el nivel. |
| VII. Liviana y linda | Server Components; `"use client"` solo en `PetStatsLive`; tokens y componentes de docs/10; cargando, vacío y error del bloque (§Diseño). |
| VIII. Autonomía con veto | Las seis decisiones de la historia ya están en docs/03 en esta rama; ninguna regla que juzga a los agentes cambia. |

Sin violaciones. Re-chequeado después del diseño: igual.

## Project Structure

### Documentation (this feature)

```text
specs/033-cuantas-veces-abrio-ficha/
├── story.md             # cuerpo verbatim de la historia #269
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/server-actions.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/<ts>_publication_stats.sql                 # nuevo: tabla, disparadores, filas de lo que existe, cuatro funciones, grants
src/lib/supabase/types.ts                                      # regenerado con pnpm db:types
src/lib/pet-stats/types.ts                                     # nuevo: PublicationKind, PublicationStats, ApplyCount
src/lib/pet-stats/count-rules.ts                               # nuevo: shouldCountOpen, applyCountOf
src/lib/pet-stats/count-rules.test.ts                          # nuevo
src/lib/pet-stats/stats-view.ts                                # nuevo: statsView (vacío, renglón de identidad, desde cuándo)
src/lib/pet-stats/stats-view.test.ts                           # nuevo
src/lib/schemas/pet-stats.ts                                   # nuevo: petStatsRequestSchema
src/lib/schemas/pet-stats.test.ts                              # nuevo
src/lib/supabase/queries/publication-stats.ts                  # nuevo: countPublicationOpen, countApplyTap, getMyPublicationStats (la única puerta)
src/actions/pet-stats.ts                                       # nuevo: readPetStats → ActionResult<PetStatsView>
src/components/pets/pet-stats-texts.ts                         # nuevo: PetStatsView y petStatsTexts (getTranslations)
src/components/pets/pet-stats-block.tsx                        # nuevo: el bloque con números o vacío (pinta, sin estado)
src/components/pets/pet-stats-live.tsx                         # nuevo, "use client": la vista o el error con «Probar de nuevo»
src/components/pets/pet-stats-skeleton.tsx                     # nuevo: la forma del bloque
src/components/pets/pet-work-layout.tsx                        # + aside y rest (solo photo="small")
src/components/pets/my-pet-panel.tsx                           # recibe stats; el seguimiento pasa a rest
src/components/litters/my-litter-panel.tsx                     # recibe stats; las crías pasan a rest
src/app/[locale]/(app)/mis-animales/_components/pet-stats-section.tsx  # nuevo: Server Component que llama a readPetStats
src/app/[locale]/(app)/mis-animales/[id]/page.tsx              # Suspense + PetStatsSection
src/app/[locale]/(app)/mis-animales/[id]/loading.tsx           # suma PetStatsSkeleton en su lugar
src/app/[locale]/(app)/mis-animales/camadas/[id]/page.tsx      # ídem
src/app/[locale]/(app)/mis-animales/camadas/[id]/loading.tsx   # ídem
src/app/[locale]/(public)/animales/[code]/page.tsx             # suma la apertura (deliver), en todos los estados que existen
src/app/[locale]/(public)/camadas/[code]/page.tsx              # ídem
src/app/[locale]/(app)/solicitar/[code]/page.tsx               # suma toque y freno con applyCountOf(events)
messages/es.json                                               # pets.stats.*
docs/03-mvp-features.md                                        # las seis decisiones (ya en esta rama) + lectura 10 en §Métricas de éxito
docs/06-i18n.md                                                # glosario: «apertura» (`open`), «freno» (`stop`), «Cómo le va a…» (`pet stats`)
docs/10-design-system.md                                       # filas de PetStatsBlock, PetStatsLive, PetStatsSkeleton; PetWorkLayout con aside y rest
tests/db/publication-stats-support.ts                          # nuevo: publicaciones, crías, solicitudes en cada estado
tests/db/publication-stats-privacy.test.ts                     # nuevo
tests/db/publication-stats-rules.test.ts                       # nuevo
tests/e2e/como-le-va.spec.ts                                   # nuevo
```

`MyPetPanel` y `MyLitterPanel` reciben el bloque ya armado (`stats: React.ReactNode`) y no hacen
fetch: lo arma la página con `PetStatsSection` (capas `app → components/<dominio>`).

**Structure Decision**: la de F00 (CLAUDE.md §Estructura). Dominio nuevo `pet-stats` en `lib/` para
las reglas puras y los tipos, porque cruza animales, camadas y la solicitud; los componentes del
bloque van en `components/pets/`, junto a los paneles que lo muestran, como ya pasa con
`group-post-*` que también sirve a las camadas.

## Diseño

Cargado antes de escribir: docs/10 (§Principios, §Tokens, §Layout y §Pantallas anchas,
§Componentes, §Textos, §Antipatrones) y las filas de `PetWorkLayout`, `MyPetPanel`,
`MyLitterPanel`, `Skeleton`, `EmptyState`, `GroupPostButton`, `RequiredLevelLine`,
`VerificationBadge` y `Button`. El skill `frontend-design:frontend-design` no está disponible en esta
corrida: el diseño sale solo de docs/10 y el `design-reviewer` lo califica contra la guía.

### La página de un animal en «Mis animales» — 390 px

```
┌──────────────────────────────────────┐
│ Mis animales                         │  ← ghost sm, el de hoy
│ ┌──────┐ Tobi                        │  ← foto chica pegada + nombre en afiche
│ │ foto │ Vence en 12 días            │
│ └──────┘                             │
│ ┄┄ Ya no está disponible ┄┄          │  ← las acciones de hoy (PetStatusActions)
│ [Pausar]                             │
│ Ver la ficha  Compartir  Editar      │
│                                      │
│ Cómo le va a Tobi                    │  ← h2 --text-xl bold
│ Desde que lo publicaste              │  ← --text-sm ink-muted
│  40  abrieron la ficha               │  ← número en .afiche --text-2xl, texto --text-base
│   6  tocaron «Quiero adoptar»        │
│   2  se frenaron por el teléfono     │
│   3  solicitudes                     │
│ (chapita 1) Pedís el teléfono        │  ← --text-sm ink, chapita sm del nivel
│ verificado                           │
│                                      │
│ El seguimiento de su adopción…       │  ← rest: lo de hoy
└──────────────────────────────────────┘
```

Con la identidad, entre el teléfono y las solicitudes: «1 se frenó por la identidad», y la línea
«Pedís la identidad verificada» con la chapita del nivel 2.

### La misma página — 1280 px

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Mis animales                                                                  │
│ ┌──────────┐   Tobi                                                           │
│ │          │   Vence en 12 días                                               │
│ │   foto   │   ┄┄ Ya no está disponible ┄┄                                    │
│ │   4:5    │   [Pausar]                                                       │
│ │  256 px  │   Ver la ficha  Compartir  Editar                                │
│ └──────────┘                                                                  │
│ Cómo le va a   El seguimiento de su adopción…  (o «Crías» en una camada)      │
│ Tobi                                                                          │
│ Desde que lo                                                                  │
│ publicaste                                                                    │
│ 40 abrieron…                                                                  │
│  6 tocaron…                                                                   │
│  2 frenados…                                                                  │
│  3 solicitudes                                                                │
│ Pedís el…                                                                     │
└───────────────────────────────────────────────────────────────────────────────┘
```

El bloque ocupa la columna de 256 px (`--container-rail`) debajo de la foto: hoy esa columna queda
vacía a lo largo de toda la página. Las acciones y lo demás no se angostan (research R8).

### Vacío, cargando y error

```
Vacío                               Cargando                      Error
Cómo le va a Tobi                   ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐             Cómo le va a Tobi
Desde que lo publicaste             ┆               ┆ título       No pudimos traer los números.
Todavía nadie abrió la ficha        └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘             [Probar de nuevo]
de Tobi.                            ┌╌╌┐ ┌╌╌╌╌╌╌╌╌╌╌┐ × 4
[Copiar el texto para el grupo]     └╌╌┘ └╌╌╌╌╌╌╌╌╌╌┘
                                    ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐ nivel
                                    └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```

- **Reutiliza**: `PetWorkLayout` (con `aside` y `rest` nuevos), `Skeleton` (la forma exacta: título,
  cuatro renglones de número y texto, la línea del nivel), `GroupPostButton` con los textos de
  `petGroupPost` / `litterGroupPost` (#248, tal cual, `variant` `secondary`), `VerificationBadge`
  `sm` sin enlace para la línea del nivel (como `RequiredLevelLine`), `Button` `secondary` `sm` con
  `loading` para «Probar de nuevo», `ErrorText` para el aviso.
- **Crea**: `PetStatsBlock` (pets; con números · vacío con y sin texto para el grupo): `section` con
  `aria-labelledby` del `h2`, la línea de desde cuándo, un `dl` con los renglones en el orden en que
  pasa la gente (`dt` el texto, `dd` el número, dibujado primero con `order`), la línea del nivel.
  `PetStatsLive` (pets, `"use client"`; vista · error · reintentando). `PetStatsSkeleton` (pets).
- **Cambia**: `PetWorkLayout` `small` suma `aside` y `rest`: en el teléfono, después de `children` y
  en ese orden, a lo ancho; desde 1024, filas `auto auto 1fr`, la foto en las dos primeras de la
  columna angosta, `aside` en la tercera con `self-start`, el nombre, `children` y `rest` en la
  ancha. Sin `aside` ni `rest`, la grilla es la de hoy. `MyPetPanel` pasa el seguimiento a `rest`;
  `MyLitterPanel`, la sección «Crías».
- **Ajustes al construir la US1 (2026-11-01)**: `RequiredLevelLine` suma `level` (2 por omisión)
  para dibujar también la chapita del nivel 1; `GroupPostButton` no tiene `variant` y queda en su
  `ghost` de siempre, en `sm`, con el origen `my_pets_group_text` que ya existe. El seguimiento
  pierde el `gap-8` con las acciones y queda a `gap-y-6`, el de la grilla.
- **Tokens**: `--color-ink` (números y texto), `--color-ink-muted` (desde cuándo), `--text-2xl` con
  `.afiche` (los números), `--text-xl` bold (el título), `--text-base`, `--text-sm`, `--space-2`
  entre número y texto, `--space-3` entre renglones, `--space-4` entre el título, la lista y la línea
  del nivel, `--space-6` entre el bloque y lo que sigue en el teléfono (el `gap-y-6` de la grilla),
  `--color-surface` y `--dur-shimmer` del `Skeleton`, `--color-accent` solo en el texto del error.
- **Lo único que llama la atención**: los números en voz de afiche, todos iguales. Los frenos van en
  tinta como el resto, nunca en ceibo ni en mate cocido: un freno en color se leería como alarma y
  empujaría a bajar el nivel, que la historia decidió no sugerir. Sin barras ni porcentajes
  (la historia saca los gráficos del alcance).
- **Accesibilidad**: `dl` nativo (el lector dice «abrieron la ficha, 40»); el número se dibuja antes
  con `order`, sin cambiar el orden del DOM. «Probar de nuevo» es un `button`; mientras reintenta
  queda en `loading` y el resultado nuevo se anuncia con `aria-live="polite"` en el contenedor.
- **Estados**:
  - Cargando: `Suspense` con `PetStatsSkeleton`; las acciones de la página ya andan (FR-018). El
    `loading.tsx` de cada página suma el mismo esqueleto en su lugar.
  - Vacío: todo en cero. «Todavía nadie abrió la ficha de Tobi» en `--text-base` ink-muted y, si
    hoy se ofrece, `GroupPostButton`. Sin `EmptyState` con el poste: el bloque es una parte de la
    página, no una pantalla vacía.
  - Error: el título, «No pudimos traer los números» (texto final con sin-slop) y «Probar de nuevo».
    Si vuelve a fallar, queda igual. El resto de la página no se entera (FR-019).
- **Renglón de identidad**: aparece con la publicación pidiendo la identidad hoy o con al menos un
  freno por la identidad ya contado (FR-016, `statsView`).

## Cómo se construye, por user story

1. **US1 — un animal (P1)**: migración entera (la tabla, los disparadores y las funciones sirven a
   animales y camadas), tipos, `count-rules.ts`, `stats-view.ts` y el schema con sus pruebas, las
   queries, `readPetStats`, los textos, `PetStatsBlock`, `PetStatsLive`, `PetStatsSkeleton`,
   `PetWorkLayout` con `aside` y `rest`, `MyPetPanel`, la página y `loading.tsx` del animal, la
   apertura en la ficha del animal y el toque en solicitar; `tests/db` de privacidad y de reglas del
   animal; el e2e.
2. **US2 — una camada (P2)**: la apertura en la ficha de la camada, `MyLitterPanel`, la página y
   `loading.tsx` de la camada, el vacío con `litterGroupPost`; `tests/db` de la camada (la cría suma
   en la camada, la apertura del enlace de una cría suma una, las solicitudes de todas las crías,
   borrar la camada).
3. **US3 — la lectura (P3)**: la lectura 10 en docs/03 §Métricas de éxito, «Cómo se leen», con los
   cuatro puntos de la historia y nombrando solo momentos que ya existen (`pet_published` y
   `pet_edited` con `required_level`, `pet_published` con `ordinal`, `feedback_sent`).

Los textos se escriben con el skill `sin-slop` en cada US. Los cuatro que trae la historia van
palabra por palabra.

## Complexity Tracking

Sin violaciones de la constitución.
