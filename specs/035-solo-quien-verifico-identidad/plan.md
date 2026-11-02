# Implementation Plan: Ver solo los animales de quien verificó su identidad, en el listado y en mis avisos

**Branch**: `feature/285-solo-quien-verifico-identidad` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/035-solo-quien-verifico-identidad/spec.md`

## Summary

El listado suma un séptimo filtro, `publisher` con la única opción `identity`, que viaja en la
dirección como `quien-publica=identidad` y se elige con la casilla «Solo de quien verificó su
identidad» dentro del grupo «Quien publica». Como es una entrada más del vocabulario de
`lib/pets/listing-query.ts`, la dirección canónica, «Sacar los filtros», el vacío filtrado, «Ver
más», `listing_filter_used`, el aviso y su enlace lo toman solos (research R1). La base filtra en
`listed_pets` con `private.publisher_level(owner) >= 2`, la misma cuenta que pinta la tarjeta (R3).
El aviso guarda `identity_only` y el índice único lo cuenta, así un aviso con el filtro y otro sin él
son dos (R4). La corrida de las 8 pasa la columna a `listed_pets`, que lee el nivel a esa hora; lo que
queda afuera ya quedó por debajo de `covered_until` y no vuelve (R5). `alertName` suma «, de quien
verificó su identidad» (R6). No hay momentos nuevos; la lectura va a docs/03 al lado de la lectura 5.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre (next-intl, zod, Supabase con `@supabase/ssr`, Radix bajo
las primitivas). **Ninguna dependencia nueva**, así que `docs/07-stack.md` no cambia.

**Storage**: Supabase Postgres local; una migración forward-only: una columna, un índice rehecho y
cuatro funciones rehechas (data-model.md)

**Testing**: Vitest (unitarias y `tests/db` contra Supabase local), Stryker al 100 % sobre lo que
tiene test, Playwright (dos pasos en specs que ya existen)

**Target Platform**: web mobile-first, 390 px y 1280 px

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: ninguna hoja cliente nueva; la casilla vive dentro de `ListingFilters`, que ya
es cliente. Presupuesto de siempre: JS inicial < 150 KB, LCP < 2,5 s, Lighthouse mobile ≥ 90. El
filtro suma una llamada a `private.publisher_level` por fila solo con la casilla marcada; la función ya
corre por fila para la tarjeta.

**Constraints**: Ley 18.331 (el filtro usa solo el nivel que la tarjeta ya muestra; la elección del
aviso la ve solo su dueña y se borra con el aviso o la cuenta); nada se indexa hasta el dominio
definitivo, y el listado filtrado sigue las reglas de hoy; la medición caída no cambia nada

**Scale/Scope**: beta de 3-5 rescatistas; una pantalla tocada (el listado), una que toma el nombre
nuevo sin cambiar («Mis avisos») y un correo que toma el nombre y el enlace

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra tablas, rutas ni componentes; el cómo vive acá, en research y data-model. |
| II. Una feature, un PR | Cuatro user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R9: lógica pura con Stryker al 100 %, reglas del listado y de la corrida en `tests/db`, dos pasos e2e. |
| IV. Reglas como código | Qué entra es una condición de `listed_pets` con prueba de base; «dos avisos distintos» es el índice único con prueba; el valor válido de la dirección es el vocabulario con prueba unitaria. |
| V. Datos mínimos y privados | No se pide nada nuevo; el filtro lee el nivel público de la tarjeta y no separa en revisión, rechazado o vencido de no pedido (nivel 1 para todos). La columna del aviso queda bajo las políticas de la dueña; la prueba de privacidad de #265 suma la columna. |
| VI. Sin deriva | No ordena por nivel; no toca la portada, el perfil, los sugeridos, la ficha, lo que pide cada ficha, la invitación de «Mis animales», el tope, la hora ni el armado del correo. |
| VII. Liviana y linda | Ninguna hoja cliente nueva; tokens y componentes de docs/10; los tres estados del listado son los de hoy (§Diseño). |
| VIII. Autonomía con veto | Las decisiones del enjambre de la historia van palabra por palabra a docs/03 en esta rama; las de diseño, a docs/10 con fecha. |

Sin violaciones. Re-check después de Phase 1: igual.

## Project Structure

### Documentation (this feature)

```text
specs/035-solo-quien-verifico-identidad/
├── story.md             # la historia #285, verbatim
├── spec.md
├── plan.md              # este archivo
├── research.md          # R1-R9
├── data-model.md
├── quickstart.md
├── contracts/
│   └── interfaces.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20261107120000_identity_only_filter.sql     # nueva: columna, índice, cuatro funciones
src/lib/supabase/types.ts                       # pnpm db:types
src/lib/supabase/queries/
├── listed-pets.ts                              # p_identity_only
└── pet-alerts.ts                               # alertFiltersOf, createPetAlertRecord, select
src/lib/pets/listing-query.ts (+ .test.ts)      # publisher en el vocabulario; chosen por cantidad
src/lib/alerts/
├── filters.ts (+ .test.ts)                     # publisher en normalize
├── alert-name.ts (+ .test.ts)                  # identityOnly
└── alert-name-texts.ts                         # alerts.name.identity_only
src/lib/schemas/pet-alert.ts (+ .test.ts)       # publisher
src/components/pets/
├── publisher-filter.tsx                        # nueva: fieldset «Quien publica» + Checkbox
└── listing-filters.tsx                         # monta PublisherFilter después del departamento
src/app/[locale]/(public)/animales/_components/listing-texts.ts   # textos nuevos
messages/es.json                                # pets.listing.*, alerts.name.identity_only
tests/db/
├── listed-pets.test.ts                         # el filtro
├── pet-alerts-rules.test.ts                    # crear con y sin el filtro, duplicado, tope
├── pet-alerts-mail.test.ts                     # la corrida con el filtro y la verificación tardía
├── pet-alerts-privacy.test.ts                  # la columna en lo que no se puede leer
└── listing-support.ts, pet-alerts-support.ts   # helpers con nivel 2
tests/e2e/animales.spec.ts, avisos.spec.ts      # un paso cada uno
docs/03-mvp-features.md                         # decisiones (ya en la rama) y la lectura
docs/10-design-system.md                        # fila de ListingFilters y PublisherFilter
docs/06-i18n.md                                 # glosario: el filtro
```

**Structure Decision**: la de siempre (CLAUDE.md §Estructura). `PublisherFilter` va en
`components/pets` al lado de `DepartmentFilter`, sin estado propio: recibe `checked` y los textos.

## Diseño

Cargado antes de escribir: docs/10 (§Principios, §Componentes, §Cómo se aplica) y las filas de
`ListingFilters`, `Checkbox`, `Chip`/`ChipGroup` (la receta `groupLabel`), `ClearFiltersAction`,
`AlertOffer`, `ListingController`, `MyAlertRow` y el correo de avisos. Nada nuevo en tokens. En el
build se carga el skill `frontend-design:frontend-design` antes del JSX.

### El listado — 390 px

```
Animales en adopción                         ← h1 afiche (de hoy)
[Perro][Gato]  [Chico][Mediano]…  →          ← tiras (de hoy)
☐ Solo castrados        [Todo el país ▾]     ← renglón de hoy, sin cambios
☐ Solo de quien verificó su identidad        ← PublisherFilter: Checkbox; «Quien publica» solo
                                               para el lector de pantalla
──────────────────────────────────────── line
1 animal            Avisame cuando haya      ← ListingCount + AlertOffer (de hoy)
                    uno así
┌──────┐                                     ← PetWall (de hoy); la tarjeta dice su nivel
│ foto │  Tobi · Identidad verificada
```

### El listado — 1280 px

```
Especie [Perro][Gato]  Tamaño [Chico]…  Edad […]  Sexo […]
☐ Solo castrados   Departamento [Montevideo ▾]   Quien publica ☐ Solo de quien verificó su
                                                                identidad      Sacar los filtros
──────────────────────────────────────────────────────────────────────────────────────────── line
```

Desde 1024 px todo fluye en renglones (`lg:contents`), y «Quien publica» va a la vista a la izquierda
de la casilla con la receta `groupLabel`, como los otros grupos.

- **Reutiliza**: `Checkbox` (la misma de «Solo castrados»), la receta `groupLabel` de `ui/chip`,
  `ListingFilters`, `ClearFiltersAction`, `AlertOffer`, `ListingController` (vacío, carga, fallas).
- **Crea**: `PublisherFilter` (pets, sin estado): un `fieldset` sin borde con su `legend` «Quien
  publica» (`sr-only` hasta 1024 px, `groupLabel` desde ahí) y una `Checkbox` con `name`
  `quien-publica`, `value` `identidad`, `checked` y `onChange` vacío (el formulario entero escucha el
  cambio, como castrado). Props: `legend`, `label`, `name`, `value`, `checked`.
- **Tokens**: `--color-ink` (casilla y etiqueta), `--text-base` en la etiqueta, `--text-sm` bold en la
  `legend` a la vista, `--dur-fast` en el tilde (de la primitiva), `--color-line` del borde de la banda.
- **Lo único que llama la atención**: sigue siendo la pared. La casilla pesa lo mismo que «Solo
  castrados»: tinta, sin color ni sello. El verde de confianza ya está en la tarjeta y no se repite en
  el filtro.
- **Estados con datos** (todos de hoy, en `ListingController`): cargando, la pared de antes al 60 % y
  `aria-busy` hasta que llega la nueva; vacío con filtros, `EmptyState` «No hay animales con estos
  filtros.» con «Avisame cuando haya uno así» `primary` y «Sacar los filtros» `secondary`; error de un
  filtro, `SaveFailedStrip` con el motivo y «Estos son los animales de los filtros anteriores.», igual
  que con cualquier otro filtro. `listingReducer` deja la casilla como la marcó la persona (decisión de
  #57: «Lo marcado; con una falla de un filtro, puede no ser lo que muestran las cards», con su
  prueba), y el mensaje dice que lo que se ve es de los filtros anteriores. Devolver las casillas a la
  marca de antes cambiaría esa regla para todos los filtros, fuera del alcance de esta historia.
- **Sin JavaScript**: la casilla es parte del formulario GET; «Ver resultados» la manda en la dirección.

### «Mis avisos»

Sin cambios de forma: la fila de hoy con el nombre más largo, que se parte en dos renglones en 390 px.

```
│ Perros en Montevideo, de quien       │  ← --text-base medium (alertName)
│ verificó su identidad                │
│ Ver en el listado          [Borrar]  │  ← TextLink con quien-publica=identidad
```

Vacío, carga y error: los de hoy.

### El correo de avisos

La parte de un aviso con el filtro: el mismo título de parte con el nombre largo y el mismo «Ver todos
en el listado» con el filtro en el enlace. Nada más cambia.

### docs/10

La fila de `ListingFilters` suma el grupo «Quien publica» después del departamento, y una fila nueva
para `PublisherFilter`, con **Decisión (2026-11-02, enjambre)**: va después del departamento para no
partir el renglón de la casilla de castrado y el departamento en el teléfono (research R7).

## Cómo se construye, por user story

1. **US1 — el filtro en el listado (P1)**: la migración entera (columna, índice y las cuatro
   funciones: el aviso y la corrida quedan listos en la base), `pnpm db:types`, `listing-query` con
   sus pruebas (vocabulario, `chosen`, lectura alterada, canónica, `parseAddedOptions`),
   `listListedPets`, `PublisherFilter` y su lugar en `ListingFilters`, textos, docs/10, docs/06,
   pruebas de base del listado (niveles, camada, aval quitado, aprobación, total, `false` igual a hoy,
   `suggested_pets` sigue andando) y el paso e2e de `animales.spec.ts`. Para que el tipo compile, el
   aviso suma `publisher` en `normalizeAlertFilters`, `alertFiltersOf` y el schema en esta misma US.
2. **US2 — el aviso con el filtro (P2)**: `createPetAlertRecord` con `p_identity_only`, el schema con su
   prueba, `alertName` con `identityOnly` y su prueba, el texto, `countFilters` con el filtro en su
   prueba, pruebas de base de crear (dos avisos, duplicado, tope), la columna en la prueba de
   privacidad y el paso e2e de `avisos.spec.ts`.
3. **US3 — el correo (P3)**: `alertFiltersOf` en la corrida (ya lee la columna), pruebas de base de la
   corrida: solo nivel 2 o más para el aviso con el filtro, la parte sin el filtro trae todo, la
   verificación tardía no trae nada al día siguiente; prueba de `mail-parts` con el nombre y el enlace.
4. **US4 — medición (P4)**: prueba de que `listing_filter_used` sale con `publisher`/`identity`
   (`listing-events.test.ts`) y la lectura nueva en docs/03 §Métricas de éxito, al lado de la lectura 5,
   con la consulta de la base sin nombres.

Los textos se escriben con el skill `sin-slop` en cada US.

## Complexity Tracking

Sin violaciones de la constitución.
