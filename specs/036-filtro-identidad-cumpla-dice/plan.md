# Implementation Plan: Que el filtro «Solo de quien verificó su identidad» y sus avisos cumplan lo que dicen

**Branch**: `feature/287-filtro-identidad-cumpla-dice` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/036-filtro-identidad-cumpla-dice/spec.md`

## Summary

Tres arreglos sin base de datos nueva ni dependencias. **El listado** (US1): `ListingState` suma
`shownFilters`, los filtros de las cards a la vista, y la falla recuerda `wanted`, lo que se había
marcado. Cuando falla un pedido de filtro, `listingReducer` devuelve `filters` a `shownFilters`; la
dirección se reescribe con lo que quedó marcado; «Reintentar» pide `wanted`; «Ver más» sigue
andando (research R1-R5). La medición no cambia: el filtro se cuenta al aplicarse, como hoy (R6).
**El correo** (US2): `alertMailParts` reparte cada animal al aviso más viejo **con** el filtro de
identidad que lo trae y, si ninguno lo tiene, al más viejo, como hoy (R7). **La confirmación**
(US3): `createPetAlert` deja de llamar a `revalidatePath`, que hacía que el servidor volviera a
dibujar el listado con la dirección nueva, cambiara la `key` de `ListingShell` y remontara
`AlertOffer` en quieto (R8). La revisión por e2e confirma la causa antes del arreglo.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre. **Ninguna dependencia nueva**, así que `docs/07-stack.md`
no cambia.

**Storage**: sin cambios. Ninguna migración: la corrida de las 8 ya devuelve los avisos en el orden
en que se crearon y con el filtro de identidad (`alertFiltersOf`, #285); lo que cambia es el reparto
en TypeScript.

**Testing**: Vitest (unitarias de `listing-state` y `mail-parts`), Stryker al 100 % sobre lo que
tiene test, Playwright (un paso en `animales.spec.ts` y uno en `avisos.spec.ts`)

**Target Platform**: web mobile-first, 390 px y 1280 px

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: ninguna hoja cliente nueva y unas pocas líneas en `useListing` y el reducer.
Sacar `revalidatePath` evita que crear un aviso vuelva a dibujar el listado entero en el servidor.
Presupuesto de siempre: JS inicial < 150 KB, LCP < 2,5 s, Lighthouse mobile ≥ 90.

**Constraints**: Ley 18.331 (no se pide ni se guarda nada nuevo; el correo lleva lo que el listado ya
muestra); nada se indexa hasta el dominio definitivo; la medición caída no cambia nada

**Scale/Scope**: beta de 3-5 rescatistas; una pantalla tocada (el listado) y un correo que reparte
distinto

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra estados, acciones ni componentes; el cómo vive acá y en research. |
| II. Una feature, un PR | Tres user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R9: reglas puras con Stryker al 100 %, dos pasos e2e. |
| IV. Reglas como código | «El listado no dice un filtro que no cumple» es `listingReducer` con prueba; el reparto del correo es `alertMailParts` con prueba. |
| V. Datos mínimos y privados | Nada nuevo se pide, guarda ni muestra. El correo sigue armado con lo que la corrida ya devuelve. |
| VI. Sin deriva | No cambia qué deja ver el filtro, el tope, la hora, la cantidad por parte, el nombre de un aviso, el orden de las partes, qué es nuevo, «Mis avisos» ni la medición. El listado no reintenta solo. |
| VII. Liviana y linda | Ninguna hoja ni componente nuevo; los tres estados del listado y de `AlertOffer` son los de hoy (§Diseño). |
| VIII. Autonomía con veto | Las decisiones del enjambre de la historia van palabra por palabra a docs/03 §3 en esta rama; la de diseño, a docs/10 con fecha. |

Sin violaciones. Re-check después de Phase 1: igual.

## Project Structure

### Documentation (this feature)

```text
specs/036-filtro-identidad-cumpla-dice/
├── story.md             # la historia #287, verbatim
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
src/lib/pets/listing-state.ts (+ .test.ts)      # shownFilters, failure.wanted, la falla vuelve
                                                #   a lo que se ve, canLoadMore, retryFilters
src/hooks/use-listing.ts                        # la dirección después de una falla, «Reintentar»
src/lib/alerts/mail-parts.ts (+ .test.ts)       # el reparto con el filtro de identidad
src/actions/pet-alerts.ts                       # createPetAlert sin revalidatePath
src/app/[locale]/(public)/animales/_components/listing-controller.tsx
                                                # shownFilters inicial; el vacío con la falla
tests/e2e/animales.spec.ts                      # un paso: el filtro que falla vuelve atrás
tests/e2e/avisos.spec.ts                        # un paso: confirmación con filtros de la página
docs/03-mvp-features.md                         # decisiones del enjambre (ya en la rama)
docs/10-design-system.md                        # filas de ListingController y AlertOffer
```

**Structure Decision**: la de siempre (CLAUDE.md §Estructura). Nada nuevo en `components/`.

## Diseño

Cargado antes de escribir: docs/10 (§Principios, §Componentes, §Cómo se aplica) y las filas de
`ListingController`, `SaveFailedStrip`, `AlertOffer`, `ListingCount`, `ListingFilters` y
`EmptyState`. Nada nuevo en tokens ni en componentes. En el build se carga el skill
`frontend-design:frontend-design` antes de tocar JSX.

No hay pantalla nueva. Cambian dos estados de pantallas que ya existen.

### El listado — falla de un filtro, 390 px

```
Animales en adopción                         ← h1 afiche (de hoy)
12 animales          Avisame cuando haya     ← ListingCount con el total de lo que se ve
                     uno así                    + AlertOffer de los filtros que quedaron
[Perro][Gato]  [Chico][Mediano]…  →          ← tiras: las marcas de lo que se ve
☐ Solo castrados        [Todo el país ▾]
☐ Solo de quien verificó su identidad        ← vuelve desmarcada si fue la que falló
──────────────────────────────────────── line
┃ No hay conexión. Estos son los animales    ← SaveFailedStrip (de hoy, mismo texto)
┃ de los filtros anteriores.
[Reintentar]                                 ← Button secondary: pide lo que se había marcado
┌──────┐
│ foto │  Luna · Teléfono verificado         ← PetWall de lo que se ve, a opacidad plena
```

A 1280 px es la misma composición de hoy (filtros en renglones, la tira y la pared debajo); solo
cambian las marcas. «Sacar los filtros» aparece si queda algún filtro marcado y no aparece si no.

### El listado — confirmación del aviso, 390 px

```
3 animales   Te vamos a avisar por correo.   ← output text-sm con fade-in, en el lugar del botón
             Mis avisos                         TextLink inline (de hoy)
```

En el vacío con filtros la misma línea reemplaza al botón `primary` del vacío, centrada, con «Sacar
los filtros» debajo, como ya pasa al volver de entrar.

- **Reutiliza**: `ListingController`, `SaveFailedStrip`, `Button` `secondary` («Reintentar»),
  `ListingFilters` (controlado: las casillas siguen a `state.filters`), `ListingCount`,
  `AlertOffer` y su `output`, `EmptyState`, `TextLink`.
- **Crea**: nada.
- **Tokens**: los de hoy en esas piezas: `--color-ink`, `--color-line`, la banda `error` de
  `paperStrip`, `--text-sm`, `--dur-base` con `--ease-out` en el `fade-in` del `output`.
- **Lo único que llama la atención**: en la falla, la tira de error (ya es así); en la confirmación,
  la pared sigue siendo lo principal y la línea pesa poco, junto al total.
- **Estados con datos**: cargando, la pared de antes al 60 % con `aria-busy` y las marcas nuevas,
  como hoy; vacío, `EmptyState` de hoy (con la tira arriba si la falla vino desde un vacío); error al
  abrir, «No pudimos traer los animales.» con «Reintentar», como hoy; error de un filtro, como el
  dibujo de arriba; error de «Ver más», como hoy.

### El correo de avisos

Sin cambios de forma: las partes, sus títulos y sus enlaces son los de hoy. Cambia qué animales van
en cada parte.

### docs/10

La fila de `ListingController` cambia «de un filtro, el motivo y "Estos son los animales de los
filtros anteriores." con "Reintentar"» por: las casillas y la dirección vuelven a los filtros de lo
que se ve, «Sacar los filtros» solo si queda alguno, y «Reintentar» pide lo que se había marcado; con
**Decisión (2026-11-02, enjambre)** citando #287. La fila de `AlertOffer` suma que la respuesta se
queda con los filtros marcados en la página igual que con los del enlace.

## Cómo se construye, por user story

1. **US1 — el listado no dice un filtro que no cumple (P1)**: `listing-state.ts` (tipo, reducer,
   `canLoadMore`, `retryFilters`) con sus pruebas primero (R1-R5, R9), `useListing` (dirección
   después de la falla, `retry` con `retryFilters`, `added` sin cambios), lo que `ListingController`
   necesite para la falla desde un vacío, docs/10 y el paso e2e de `animales.spec.ts`.
2. **US2 — el correo trae la parte con el filtro (P2)**: `alertMailParts` con el reparto nuevo y sus
   pruebas (R7), sin tocar `mailNewCount` ni `mailItemCount`.
3. **US3 — la confirmación con filtros de la página (P3)**: primero el paso e2e de `avisos.spec.ts`,
   que tiene que fallar en `main`; después `createPetAlert` sin `revalidatePath` (R8) y la fila de
   `AlertOffer` en docs/10. Si el paso sigue fallando, la causa es otra y se busca antes de elegir la
   alternativa de R8.

No hay textos nuevos: la falla, «Reintentar» y las respuestas del aviso ya existen. Si el build
necesitara uno, se escribe con el skill `sin-slop`.

## Complexity Tracking

Sin violaciones de la constitución.
