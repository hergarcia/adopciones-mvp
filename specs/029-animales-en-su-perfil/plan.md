# Implementation Plan: Los animales en adopción de cada rescatista en su perfil

**Branch**: `feature/238-animales-en-su-perfil` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/029-animales-en-su-perfil/spec.md` (3 user stories, una pasada adversaria; lo que
quedó abierto está en sus Assumptions). Decisiones técnicas con alternativas en
[research.md](./research.md); la función que cambia en [data-model.md](./data-model.md); rutas,
consultas y componentes en [contracts/routes.md](./contracts/routes.md); la medición en
[contracts/measurement.md](./contracts/measurement.md).

## Summary

El perfil público suma la sección «En adopción» con las tarjetas del listado de esa persona. Para que
las reglas sean las del listado sin copiarlas, `listed_pets` gana un parámetro opcional de dueña
(`p_owner_public_id`) y el perfil la llama con él (R1, R2). La primera tanda llega con el perfil, en
el mismo `Promise.all`, legible sin scripts (R3); «Ver más» y «Probar de nuevo» piden tandas a una
ruta propia del perfil (R4) desde una hoja cliente chica, `ProfilePets` (R5). «Mis animales» muestra
`ProfileLinkLine` (la línea y `CopyProfileLink`) cuando la misma función trae al menos un animal a la
vista para su dueña (R8). La medición suma `with_pets` a la visita al perfil (R7), el origen
`profile` a la ficha (R6) y `from` al enlace copiado (R8); docs/03 suma la lectura «¿El rescatista
usa el sitio como su vidriera?».

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router), React 19
**Primary Dependencies**: Supabase (Postgres, Auth, Storage, RLS), next-intl, zod, Radix. Sin
dependencias nuevas (R10).
**Storage**: Postgres; una migración que reemplaza `public.listed_pets` con un parámetro más. Nada
nuevo se guarda.
**Testing**: Vitest (unit, gates y `tests/db` contra Supabase local), Playwright contra `next start`,
Stryker al 100 % sobre lo que tiene test.
**Target Platform**: web móvil primero (390 px), servidor Node local hasta el MVP.
**Performance Goals**: el perfil sigue en LCP < 2,5 s y JS inicial < 150 KB (`perfil-rendimiento.spec.ts`
y Lighthouse). `ProfilePets` es la única hoja cliente nueva y solo se monta con tarjetas o con la falla;
el perfil de quien no publica no carga su JavaScript. Las fotos de la primera fila cargan con la
regla de `PetWall` (`eagerCount` por defecto); las demás, diferidas.
**Constraints**: ningún string fuera de `messages/es.json`; ningún valor fuera de los tokens de
`docs/10`; la visibilidad vive en la base y tiene su test; el perfil sigue `noindex`.
**Scale/Scope**: 3 a 5 rescatistas en la beta; tandas de 24; sin JavaScript, tope de 240 como el
listado.

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | la spec no nombra tablas ni rutas; el cómo vive acá |
| II. Una feature, un PR | 3 user stories que se construyen y verifican una por una |
| III. Compuertas | `pnpm gates:affected` por user story; tests de lo que importa (§Qué se testea), Stryker al 100 % |
| IV. Reglas como código | la regla «lo del listado» es una sola función de la base, con un test que compara perfil y listado |
| V. Datos personales | nada nuevo se guarda ni se muestra de la persona; `tests/db/profile-pets.test.ts` intenta leer pausados, vencidos, adoptados, de baja, sin teléfono, suspendidos y bloqueados por el perfil |
| VI. Sin deriva | sin filtros ni orden propios, sin cambiar la vista previa, la dirección ni la indexación del perfil |
| VII. Liviana y linda | Server Components, componentes del sistema reusados, §Diseño |
| VIII. Autonomía con veto | sin plata, nombre ni indexación en juego |

Sin violaciones: Complexity Tracking queda vacío. Sin cambio transversal de stack.

## Diseño

Leído `docs/10-design-system.md` (§Componentes, §Layout, `PublicProfileLayout`, `PetWall`,
`LoadMoreButton`, `SaveFailedStrip`, `CopyProfileLink`, `Skeleton`). El skill
`frontend-design:frontend-design` no está disponible en esta sesión: el build lo carga antes de
escribir JSX. Todo con tokens y componentes existentes; los dos componentes nuevos se suman a la
tabla de `docs/10` en este PR.

### Tokens que se usan

`--color-canvas`, `--color-ink`, `--color-ink-muted`, `--color-line` (los de la pared y las tarjetas);
`--text-base`, `--text-lg` (el `h2` de la sección, como «Responden por esta persona»); `--space-*` de
la grilla del perfil (`gap-6 lg:gap-10`); `.cinta-esquinas` de cada tarjeta; `--dur-fast`/`--dur-base`
en lo tocable. Nada nuevo en `globals.css`.

### Lo que llama la atención, uno por pantalla

- Perfil público: sigue siendo la chapita (`ProfileLevel`). La pared de fotos pesa por sí sola; por
  eso el `h2` es el de las otras secciones del perfil y no voz de afiche, y no hay tirita: «Ver más» y
  «Probar de nuevo» van en `secondary`.
- «Mis animales»: sigue siendo la tirita «Publicar un animal». La línea del enlace va en
  `--text-base` y su botón en `secondary`, debajo de la tirita.

### Perfil público · `/perfil/{id}` (cambia)

```
390 px                                   1024 px
┌──────────────────────────────┐        ┌────────────────────────────────────────────────┐
│ (foto) Carla Pérez           │        │ (foto) Carla Pérez   ║ [chapita] Nivel 2 ...   │
│ Rescatista · Canelones       │        │ Rescatista · ...     ║                         │
│ [chapita] Nivel 2 ...        │        │ En el sitio desde marzo de 2026                │
│ En el sitio desde ...        │        │ Responden por esta persona                     │
│ Responden por esta persona   │        │ ─ fila ─ fila ─                                │
│ ─ fila ─ fila ─              │        │ En adopción                                    │
│ En adopción              h2  │        │ ┌────┐ ┌────┐ ┌────┐ ┌────┐                    │
│ ┌──────┐ ┌──────┐            │        │ │foto│ │foto│ │foto│ │foto│  PetWall 4 col     │
│ │ foto │ │ foto │  PetWall   │        │ └────┘ └────┘ └────┘ └────┘                    │
│ │ 4:5  │ │[EN   │  2 col     │        │ Tobi   Luna   Mora   Camada                    │
│ └──────┘ │PROCE-│            │        │ [ Ver más ]  secondary                         │
│ Tobi     │SO]   │            │        │ (lugar de avalar)                              │
│ Canelones└──────┘            │        │ ── Reportar · Bloquear ──                      │
│ [ Ver más ]   secondary      │        └────────────────────────────────────────────────┘
│ (lugar de avalar)            │
│ ── Reportar · Bloquear ──    │
└──────────────────────────────┘
```

- `PublicProfileLayout` suma el lugar `pets` (nulo por defecto) entre `vouchers` y `slot`, a lo
  ancho de la hoja en los dos anchos (la pared no va en `--measure`). El orden del DOM es el de la
  pantalla.
- Error de la primera tanda: en el lugar de la pared, `SaveFailedStrip` con «No pudimos mostrar sus
  animales en adopción.» y debajo «Probar de nuevo» (`Button` `secondary`, `loading` mientras corre);
  mientras corre, el esqueleto (abajo). El `h2` queda, para que el aviso diga de qué es.
- Esqueleto: el de `mis-animales/loading.tsx` sin las líneas de acciones: `petWall({ columns:
  'wall' })` con cuatro `Skeleton` `WALL_PHOTO_FRAME` y dos renglones (nombre, zona). Se extrae a
  `src/components/pets/pet-wall-skeleton.tsx` con una prop `lines` (segunda repetición).
- Falla de «Ver más»: `SaveFailedStrip` al pie con el motivo y «Tocá "Ver más" de nuevo.» (los textos
  del listado), las tarjetas quedan.
- Vacío: la sección no existe (ni `h2`).
- Vista previa de un enlace (`isLinkPreview`): la sección no se pide ni se dibuja.
- La pantalla de bloqueo y el «no existe» no cambian.

### «Mis animales» · `/mis-animales` (cambia)

```
┌──────────────────────────────┐
│ Mis animales          afiche │
│ [aviso sin teléfono]  (si va)│
│ ▓▓ Publicar un animal ▓▓ tir.│
│ ¿Qué quiere decir cada estado│
│                              │
│ En el enlace de tu perfil se │  ← ProfileLinkLine, --text-base
│ ven todos tus animales en    │
│ adopción.                    │
│ [ Copiar el enlace ] second. │  ← «Mandar el enlace» en el teléfono
│ Enlace copiado    (output)   │
│                              │
│ ┌──────┐ ┌──────┐  MyPetsGrid│
└──────────────────────────────┘
```

- Va entre la fila de la tirita y la pared, con `mt-8`, dentro de `max-w-[var(--measure)]`.
- Estados: con alguno a la vista, la línea; sin ninguno o si falló saber, nada (la pantalla queda como
  hoy). El vacío de «Mis animales» (`HeadedEmptyState`) no la muestra. Cargando: la línea no tiene
  forma en `loading.tsx`, que ya dibuja la tirita y la pared; aparece con la página.
- Copiar: los tres estados de `CopyProfileLink` (quieto, «Enlace copiado», el enlace escrito a mano).

### Componentes

| Componente | Capa | Reusa o nuevo |
|---|---|---|
| `PetWall`, `PetCard`, `PetPhoto`, `LoadMoreButton` | pets | reusa |
| `SaveFailedStrip` | forms | reusa |
| `Button`, `Skeleton` | ui | reusa |
| `PublicProfileLayout` | profile | cambia: lugar `pets` |
| `CopyProfileLink` | profile | cambia: prop `from` |
| `ProfilePets` | pets | **nuevo**, hoja cliente |
| `PetWallSkeleton` | pets | **nuevo**, extraído de `mis-animales/loading.tsx` |
| `ProfileLinkLine` | profile | **nuevo** |

### Textos (`messages/es.json`, escritos y revisados con `sin-slop`)

- `profile.public.pets.title`: «En adopción»
- `profile.public.pets.load_error`: «No pudimos mostrar sus animales en adopción.»
- `profile.public.pets.retry`: «Probar de nuevo»
- `profile.public.pets.cap`: «Mostramos los primeros 240.»
- «Ver más» y las fallas de «Ver más»: las claves del listado (`pets.listing.*`), sin copiarlas.
- `pets.my_pets.profile_link`: «En el enlace de tu perfil se ven todos tus animales en adopción.»
- `metadata`: sin cambios (la página ya exporta `generateMetadata`; sigue `noindex`).

## Qué se testea (y qué no)

Detalle en research R9.

- `tests/db/profile-pets.test.ts`: la regla de visibilidad entera por el perfil, contra el listado
  (FR-002, FR-003, FR-004, FR-006, US1 AS 4–9, 13). Es la prueba que intenta leer lo que no debe.
- `src/lib/pets/profile-pets-state.test.ts`: el reductor (FR-009, FR-009a, «Probar de nuevo» que trae
  cero).
- `src/lib/analytics/visit-origin.test.ts` (suma casos): `profile` y los caminos que se le parecen.
- `src/lib/analytics/view-origin.test.ts` (suma casos): `profileViewProps`.
- `tests/e2e/perfil-animales.spec.ts`: ficha → nombre → perfil → otra ficha; «Mis animales» →
  «Copiar el enlace» → «Enlace copiado».
- No: la página, `ProfileScreen`, `ProfileLinkLine`, `PetWallSkeleton`, los textos, la ruta de tandas
  (una consulta fina sobre `profilePetsView`, como `/api/animales`, que tampoco tiene test) ni la
  validación de `from` en la acción (`isOneOf`, ya probada; el repo no testea acciones).

## Docs que cambian en este PR

- `docs/03-mvp-features.md` §3: las tres decisiones del enjambre de la historia, palabra por palabra
  (ya en esta rama desde Spec).
- `docs/03-mvp-features.md` §Métricas de éxito, «Cómo se leen»: el punto 6 de
  [contracts/measurement.md](./contracts/measurement.md).
- `docs/10-design-system.md` §Componentes: filas de `ProfilePets`, `PetWallSkeleton` y
  `ProfileLinkLine`; `PublicProfileLayout` suma el lugar de «En adopción»; `CopyProfileLink`, la
  prop `from`; `PetWall` y `LoadMoreButton` nombran el perfil entre sus usos.

## Project Structure

### Documentation (this feature)

```text
specs/029-animales-en-su-perfil/
├── story.md
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── routes.md
│   └── measurement.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/20261029120000_profile_pets.sql        nuevo
src/lib/supabase/types.ts                                  regenerado
src/lib/supabase/queries/listed-pets.ts                    listProfilePets + listedPetsOf
src/app/[locale]/_components/listing-view.ts               profilePetsView
src/app/api/perfil/[id]/animales/route.ts                  nuevo
src/lib/pets/profile-pets-state.ts (+ .test.ts)            nuevo
src/lib/pets/listing-query.ts                              parseShown exportada para el perfil
src/components/pets/profile-pets.tsx                       nuevo, "use client"
src/components/pets/pet-wall-skeleton.tsx                  nuevo
src/components/profile/public-profile-layout.tsx           lugar pets
src/components/profile/copy-profile-link.tsx               prop from
src/components/profile/public-profile-links.tsx            from="my_profile"
src/components/profile/profile-link-line.tsx               nuevo
src/app/[locale]/(public)/perfil/[id]/page.tsx             primera tanda, mostrar, with_pets
src/app/[locale]/(public)/perfil/[id]/_components/profile-screen.tsx    pasa pets
src/app/[locale]/(public)/perfil/[id]/_components/profile-pets-texts.ts nuevo
src/app/[locale]/(app)/mis-animales/page.tsx               ProfileLinkLine
src/app/[locale]/(app)/mis-animales/loading.tsx            usa PetWallSkeleton
src/app/[locale]/(app)/mis-avales/_components/my-vouches-sections.tsx   from="my_vouches"
src/actions/profile.ts                                     from en profile_link_copied
src/lib/analytics/events.ts                                with_pets, PROFILE_LINK_ORIGINS
src/lib/analytics/visit-origin.ts (+ test)                 'profile'
src/lib/analytics/view-origin.ts (+ test)                  profileViewProps
messages/es.json                                           textos nuevos
tests/db/profile-pets.test.ts                              nuevo
tests/e2e/perfil-animales.spec.ts                          nuevo
docs/03-mvp-features.md, docs/10-design-system.md
```

**Structure Decision**: la de `CLAUDE.md`; nada fuera de las carpetas que ya existen salvo la ruta
`src/app/api/perfil/[id]/animales/`, al lado de `src/app/api/animales/`.

## Complexity Tracking

Vacío: sin violaciones.

## Para Ship

- El perfil de una persona sembrada que publica, para las capturas: `node scripts/walk.mjs --story
  238-animales-en-su-perfil --user /perfil/<publicId> /mis-animales`.
- Fuera de alcance, si aparecen: la vista previa del enlace del perfil, una dirección corta del
  perfil, filtros en el perfil.
