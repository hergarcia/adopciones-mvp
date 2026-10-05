# Implementation Plan: Portada del sitio que invita a publicar un animal y a ver los que están en adopción

**Branch**: `feature/61-portada-del-sitio` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/012-portada-del-sitio/spec.md` (3 user stories). Decisiones técnicas en
[research.md](./research.md) (R1–R8); lo que la portada promete hacia afuera (textos, enlaces,
eventos, vista previa) en [contracts/portada.md](./contracts/portada.md). Sin data-model: la historia
no toca la base ni guarda nada nuevo.

## Summary

Hoy `/` es la portada provisoria: el nombre del sitio repetido y «Estamos construyendo esto». Al
terminar, `/` dice qué es el sitio en una frase de afiche, tiene «Publicar un animal» como la tirita
de la pantalla y «Ver animales en adopción» al lado, cuenta en tres pasos lo que el sitio le ahorra a
quien rescata, dice qué quiere decir verificado a quien adopta y muestra los 8 animales más recientes
del listado con «Ver todos». Pegada en WhatsApp se ve con el nombre, la frase y una imagen del
cartel. Todo sale del servidor y funciona sin JavaScript.

Cuatro decisiones ordenan el plan:

1. **Los animales son la primera tanda del listado** (R1): la misma función, con 8. La regla de
   quién se ve vive una sola vez, en la base.
2. **La portada llega entera del servidor** (R2, R3): sin `Suspense`, para que funcione sin
   JavaScript; si los animales fallan, solo su bloque lo dice.
3. **«Publicar un animal» es un enlace a la puerta que ya existe** (R4): el ingreso, el perfil y el
   aviso de verificación son los de #9 y #10.
4. **La vista previa es una imagen fija del cartel por una ruta propia** (R5), y **la medición usa el
   `referer`** como ya lo hace la ficha (R6).

## Technical Context

**Language/Version**: TypeScript (`strict`), React 19, Next.js 16 (App Router), las versiones de
`main`.

**Primary Dependencies**: las de `main`. **Ninguna nueva**: `next/og` y `sharp` ya los usa la imagen
de un animal.

**Storage**: no aplica. Lee la función `listed_pets` de la base por la consulta que ya existe.

**Testing**: Vitest para la medición (funciones puras) y la versión de la imagen; Playwright contra
`next start` para los flujos de la portada, sin JavaScript y la vista previa (R8). El freno de
rendimiento y Lighthouse ya miden `/`.

**Target Platform**: web, mobile-first a 390 px; revisión a 390 y 1280.

**Project Type**: aplicación web Next.js, estructura de F00.

**Performance Goals**: LCP < 2,5 s, CLS < 0,05, JS de apertura ≤ 150 KB en `/` (el freno de #95 y
Lighthouse CI ya los afirman). La portada no suma ninguna hoja cliente nueva: todo lo de
`components/home/` es Server Component; `PetCard` y la chapita ya son lo que son en el listado.

**Constraints**: sin JavaScript todo se lee y los enlaces llevan (FR-022); nada se indexa
(`robots` sigue en `INDEXING_ENABLED`, que es `false`); el nombre sale solo de `APP_NAME`; ningún
texto fuera de `messages/es.json`; ningún color fuera de los tokens.

**Scale/Scope**: 1 pantalla reemplazada (`(public)/page.tsx`), 1 ruta nueva (`(public)/imagen`),
6 componentes nuevos en `components/home/` y 1 en `components/site/`, 1 módulo de medición nuevo,
2 helpers extraídos a `lib/og/`, 1 archivo de e2e nuevo.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra rutas ni componentes; el cómo está acá y en research.md. |
| **II. Una feature, un PR** | Tres user stories en un PR: P1 la portada con sus acciones y pasos; P2 los animales y lo verificado; P3 vista previa, sin JS y ancho. Cada una se prueba sola. |
| **III. Compuertas verdes** | `pnpm verify` completo. Lo que tiene test es la medición (engaña la primera métrica si calcula mal) y los flujos críticos en e2e; 100 % de mutantes en lo testeado. |
| **IV. Reglas como código** | La regla de «los mismos animales que el listado» no se reimplementa: es la misma consulta. La e2e compara la portada con `/animales` animal por animal. |
| **V. Datos personales** | No se muestra ni se guarda nada de nadie: de cada animal lo del listado, que ya pasa por RLS; la vista previa no lleva animal ni persona; los eventos no llevan ids. |
| **VI. Sin deriva** | Nada de «Fuera del MVP». Lo que la historia deja afuera (nombre, buscadores, #8, M4, M3, cifras, carrusel) queda afuera. |
| **VII. Liviana y linda** | Server Components; cero hojas cliente nuevas; diseño de docs/10 (§Diseño). El skill `frontend-design:frontend-design` no está disponible en esta sesión: el criterio es docs/10 y lo verifica el design-reviewer con capturas a 390 y 1280. |
| **VIII. Autonomía con veto** | Se decide y se avisa en Ship: el orden de los bloques (§Diseño), la frase provisoria, la medición por `referer` (R6). Nada reservado: el nombre sigue provisorio y no se prende la indexación. |

**Sin violaciones**: Complexity Tracking vacío.

## Diseño

Guía: `docs/10-design-system.md`, identidad «Cartel». La portada está en la zona `(public)`: papel
`wall` (`--container-listing`, 1200), cabecera `AccountMenu` con `Wordmark` (el nombre del sitio, una
sola vez). `PageShell` `full`.

### Wireframe a 390 px

```
┌──────────────────────────────────┐
│ Adopciones   Animales en adopción│  AccountMenu (sin cambios)
│                          Entrar  │
├──────────────────────────────────┤
│ Perros y gatos                   │  h1 .afiche --text-4xl tinta
│ en adopción,                     │  (la frase, ~6 renglones)
│ publicados                       │
│ por personas                     │
│ verificadas.                     │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ [  PUBLICAR UN ANIMAL          ] │  Button tirita lg, ancho completo
│ [  Ver animales en adopción    ] │  LinkButton secondary lg
│                                  │  ← fin de la primera pantalla (SC-001)
│ Si rescatás                      │  h2 --text-xl
│ 1  Publicá desde el celular, con │  ol: número en .afiche --text-2xl
│    hasta 5 fotos y lo que todos  │  + texto --text-base
│    preguntan.                    │
│ 2  Pegá el enlace en el grupo:   │
│    se ve con la foto, el nombre  │
│    y la zona.                    │
│ 3  Te escribimos por correo 7 días antes de │
│    que venza, a los 30 días;     │
│    confirmás con un toque.       │
│                                  │
│ Si querés adoptar                │  h2 --text-xl
│ (chapita md 1)  Mirar es libre,  │  VerificationBadge md nivel 1
│ sin registrarte. Cada animal lo  │  + 3 frases --text-base
│ publica alguien con el teléfono  │
│ verificado. El teléfono de nadie │
│ está a la vista.                 │
│                                  │
│ Recién publicados                │  h2 --text-xl
│ ┌──────────┐ ┌──────────┐        │  PetWall wall: 2 columnas
│ │ foto 4:5 │ │ foto 4:5 │        │  PetCard (cinta, --tilt)
│ └──────────┘ └──────────┘        │
│  Tobi         Luna               │
│  …  (8 en 4 filas)               │
│ Ver todos                        │  TextLink block medium
└──────────────────────────────────┘
```

### Wireframe a 1280 px (hoja de 1200)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Adopciones                                    Animales en adopción   Entrar  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Perros y gatos en adopción,              │  Si querés adoptar                │
│ publicados por personas                  │  (chapita) Mirar es libre, sin    │
│ verificadas.                             │  registrarte. Cada animal lo      │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  [Ver animales en   │  publica alguien con el teléfono  │
│ [ PUBLICAR UN ANIMAL ]   adopción     ]   │  verificado. El teléfono de nadie │
│        (columna 7/12)                    │  está a la vista. (columna 5/12)  │
│                                                                              │
│ Si rescatás                                                                  │
│ 1 Publicá desde el celular…   2 Pegá el enlace en el grupo…  3 Te escribimos…│
│        (ol en 3 columnas, cada una ≤ --measure)                              │
│                                                                              │
│ Recién publicados                                                 Ver todos  │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                          │
│ │ 4:5  │ │ 4:5  │ │ 4:5  │ │ 4:5  │     PetWall wall: 4 columnas,          │
│ └──────┘ └──────┘ └──────┘ └──────┘     8 animales = 2 filas llenas         │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                                          │
│ └──────┘ └──────┘ └──────┘ └──────┘                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Orden** (decisión del plan): en el DOM y en el teléfono, el de la historia: frase, acciones,
pasos, verificado, animales; el lector de pantalla lee siempre en ese orden. Desde 1024 la grilla
de `HomeLayout` (12 columnas) sube «Si querés adoptar» a la fila de la frase (columnas 8 a 12,
`row-start-1`), sin cambiar el DOM, para que el afiche llene la hoja (docs/11 §Identidad y
pantallas: nada de una columna perdida en blanco) y los animales queden más cerca del pliegue. Es
agregar columnas, no rediseñar: el mismo contenido en todos los anchos (docs/10 §Pantallas anchas).
El orden visual en 1280 (verificado antes que los pasos) difiere del de lectura solo en ese bloque,
que es independiente de los otros.

### Componentes

| Componente | Capa | Reusa / nuevo | Qué hace |
|---|---|---|---|
| `AccountMenu`, `Wordmark`, `PaperFrame` `wall`, `PageShell` `full` | app | reusa | La cabecera con el nombre una sola vez; la hoja de la zona pública. |
| `Button` `tirita` sobre `LinkButton` | ui | reusa | «Publicar un animal»: la única tirita de la pantalla, `lg`. |
| `LinkButton` `secondary` | ui | reusa | «Ver animales en adopción»; la acción del error. |
| `TextLink` `block` `medium` | ui | reusa | «Ver todos». |
| `EmptyState` | ui | reusa | El vacío y el error del bloque de animales. |
| `PetWall` `wall`, `PetCard` | pets | reusa | Los animales, igual que en el listado, con «Urgente» y «En proceso». `prefetch={false}`. |
| `VerificationBadge` `md` nivel 1 | verification | reusa | La chapita en «Si querés adoptar», con su enlace a los niveles; sin brillo (`md`). |
| `HomeLayout` | home | nuevo | La grilla: una columna; desde 1024, 12 columnas con la frase y las acciones en 7 y lo verificado en 5. |
| `HomeHero` | home | nuevo | `h1` con la frase en `.afiche` `--text-4xl` y las dos acciones (en columna en el teléfono, en fila desde 640). |
| `RescuerSteps` | home | nuevo | `h2` y la `ol` de tres pasos: el número en `.afiche` `--text-2xl` (es una secuencia, docs/10 §Antipatrones lo permite), el texto en `--text-base`; desde 1024 tres columnas con `--space-8`. |
| `AdopterPromise` | home | nuevo | `h2` y las tres frases con la chapita al lado del primer renglón. |
| `RecentPets` | home | nuevo | `h2` «Recién publicados», «Ver todos» (a la derecha del título desde 768, debajo de la pared en el teléfono), y la pared, el vacío o el error. Recibe `cards: ListedCardView[] \| null`. |
| `RecentPetsFailed` | home | nuevo | `EmptyState` con el texto del error y `LinkButton` `secondary` al listado. |
| `SiteShareImage` | site | nuevo | La imagen de la vista previa (R5): estilos en línea con `OG_PALETTE` y `SHARE_LAYOUT`, como `PetShareImage`. Se suma su fila a la tabla de docs/10. |

Se suman a la tabla de componentes de docs/10 las filas de `HomeLayout`, `HomeHero`,
`RescuerSteps`, `AdopterPromise`, `RecentPets` y `SiteShareImage`, con la decisión del orden en
1024 fechada.

### Tokens

`--color-ink`, `--color-ink-muted`, `--color-canvas`, `--color-surface` (el vacío del `EmptyState`),
`--text-4xl` (la frase), `--text-2xl` (los números de los pasos), `--text-xl` (los `h2`),
`--text-base`, `--space-4`/`--space-6`/`--space-8`/`--space-12` entre bloques, `--measure` para
cada columna de texto, `--container-listing` (la hoja), `.afiche`, `.perforado` (la tirita),
`.cinta-esquinas` y `--tilt` (de `PetCard`). **Sin `--color-accent`** en la portada salvo el
`UrgencyTag` de un animal urgente, que es el acento que docs/10 reserva para la urgencia. **Sin
verde en las acciones**: el verde está solo en la chapita.

### El elemento que se lleva la atención

**«Publicar un animal»**, la tirita: el único bloque de tinta perforado de la pantalla, debajo de la
frase de afiche. La frase es grande pero es texto; las fotos de los animales están más abajo y son
el segundo foco.

### Los tres estados de cada bloque con datos

Solo el bloque «Recién publicados» tiene datos:

- **Cargando**: la portada llega entera del servidor (R2). Cada `PetCard` tiene su lugar 4:5
  reservado con el ThumbHash borroso hasta que llega la foto; nada salta. Una foto que no llega se
  queda en el borroso (FR-020).
- **Vacío**: `EmptyState` centrado en el ancho del bloque: «Todavía no hay animales publicados.» y
  `LinkButton` `secondary` «Publicá el primero» a `PUBLISH_PATH`. Sin «Ver todos» (el listado
  también estaría vacío). La tirita sigue siendo la de arriba.
- **Error**: `RecentPetsFailed`: «No pudimos cargar los animales.» y `LinkButton` `secondary` «Ver
  animales en adopción». Sin «Ver todos» (sería la misma acción dos veces).

Los bloques de texto no cargan datos: no tienen cargando, vacío ni error.

### Microinteracciones

Las de los componentes reusados: la tirita se hunde al presionar, `secondary` se invierte en hover,
`PetCard` se despega con `.lift` donde hay puntero, la chapita se mece al hover. Nada se mueve solo;
sin aparición al scroll (docs/10 §Principios 4).

## Project Structure

### Documentation (this feature)

```text
specs/012-portada-del-sitio/
├── story.md
├── spec.md
├── plan.md
├── research.md
├── quickstart.md
├── contracts/portada.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
src/app/[locale]/(public)/page.tsx                 reemplazada: generateMetadata con textos de `home`, compone, pide los animales, mide
src/app/[locale]/(public)/_components/home-texts.ts nuevo: los textos de `home` armados en el servidor
src/app/[locale]/(public)/imagen/route.tsx          nuevo: la imagen de la vista previa (R5)
src/app/[locale]/_components/listing-view.ts        movido desde animales/_components (R1)
src/app/[locale]/(public)/animales/page.tsx         importa listing-view movido; listing_viewed con origen
src/app/[locale]/(public)/animales/[code]/page.tsx  petViewEvent con origen home (sin cambio de llamada)
src/app/[locale]/(public)/animales/[code]/imagen/route.tsx  usa smallJpeg y shareFont de lib/og
src/app/[locale]/(app)/mis-animales/publicar/page.tsx home_publish_tapped antes de la puerta
src/components/home/{home-layout,home-hero,rescuer-steps,adopter-promise,recent-pets,recent-pets-failed}.tsx
src/components/site/site-share-image.tsx
src/lib/analytics/home-events.ts (+ .test.ts)       isHomeReferer, homeViewEvent, homePublishTapEvent
src/lib/analytics/listing-events.ts (+ .test.ts)    origen home en petViewEvent y listingViewEvent
src/lib/analytics/events.ts                         home_viewed, home_publish_tapped; tipos
src/lib/og/small-jpeg.ts, src/lib/og/share-font.ts, src/lib/og/site-share-version.ts (+ .test.ts)
src/lib/og/BricolageGrotesque_Condensed-ExtraBold.ttf, OFL.txt   movidos
messages/es.json                                    namespace `home` (`common.under_construction` queda: lo usa el fixture de tests/gates/typed-keys, que no se toca sin `reglas-aprobadas`)
tests/e2e/portada.spec.ts                           nuevo (R8)
docs/10-design-system.md                            filas de componentes y decisión del orden en 1024
docs/known-limitations.md                           KL-57-6 cerrada
```

**Structure Decision**: la de F00. `components/home/` es un dominio nuevo (la portada tiene nombre en
el dominio: glosario «portada del sitio»); `components/site/` lo es para lo que habla del sitio y no
de una pantalla (la imagen).

## Textos (provisorios, en `messages/es.json` → `home`)

- `hero.title`: «Perros y gatos en adopción, publicados por personas verificadas.» Es también la
  `description` y el `og:description`: una sola clave, así la descripción no puede dejar de ser la
  frase (contracts/portada.md).
- `hero.publish`: «Publicar un animal» · `hero.browse`: «Ver animales en adopción»
- `rescuer.title`: «Si rescatás» · pasos: «Publicá desde el celular, con hasta 5 fotos y los datos
  que los adoptantes preguntan siempre.» · «Pegá el enlace en tu grupo: se ve con la foto, el
  nombre y la zona.» · «Te escribimos por correo 7 días antes de que la publicación venza, a los 30 días, y
  confirmás con un toque que sigue disponible. Nadie pregunta por un animal que ya se fue.»
- `adopter.title`: «Si querés adoptar» · «Mirar es libre, sin registrarte.» · «Cada animal lo
  publica una persona con el teléfono verificado.» · «El teléfono y el contacto de nadie están a la
  vista.»
- `recent.title`: «Recién publicados» · `recent.all`: «Ver todos» · `recent.empty`: «Todavía no hay
  animales publicados.» · `recent.empty_action`: «Publicá el primero» · `recent.failed`: «No
  pudimos cargar los animales.» · `recent.failed_action`: «Ver animales en adopción»
- `share.tagline`: «Se busca hogar» · `share.alt`: la frase.

## Complexity Tracking

Vacío.
