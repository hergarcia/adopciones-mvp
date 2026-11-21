# Implementation Plan: Al marcar un animal dado por fuera, decir por dónde llegó quien lo adoptó

**Branch**: `feature/254-por-donde-llego-adoptante` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/039-por-donde-llego-adoptante/spec.md`

## Summary

En «¿A quién se lo diste?», mientras el camino por fuera está elegido (o es el único), debajo de su
nota y antes de «Marcar adoptado» aparece «¿Por dónde te encontró?»: seis opciones de una sola
elección, ninguna elegida, que se pueden dejar sin elegir. Marcar manda lo elegido o nada junto al
intento de siempre, y la acción suma el canal a la medición que ya existe (`pet_handed_over`): una
de las seis opciones o `unanswered` por fuera, `null` por el sitio. Se mide solo cuando la base dice
`done`, así que el doble toque, el reintento y el animal que cambió no cuentan otra vez (research R2).
No hay migración: el canal no se guarda en la base ni lo ve nadie en el sitio (research R1). La
lectura 15 de docs/03 §Métricas de éxito dice cómo se lee.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre (next-intl, zod, Radix en las primitivas). **Ninguna
dependencia nueva.**

**Storage**: ninguno nuevo. El canal viaja solo en el momento de medición (research R1)

**Testing**: Vitest (unitarias), Stryker al 100 % sobre lo que tiene test, Playwright (el flujo de
marcar adoptado que ya existe, ampliado)

**Target Platform**: web mobile-first, 390 px y 1280 px

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: la pregunta vive en la hoja cliente que ya existe (`HandoverForm`) y reusa
`RadioGroup`, que ya baja en esa pantalla. Sin JS nuevo fuera de ella. Presupuesto de siempre: JS
inicial < 150 KB, LCP < 2,5 s, Lighthouse mobile ≥ 90

**Constraints**: Ley 18.331 (el canal sin persona, sin animal y sin texto); marcar nunca se traba ni
suma toques; un canal por adopción hecha

**Scale/Scope**: beta de 3-5 rescatistas; una pantalla tocada (marcar adoptado, también para cada
cría) y un momento de medición con una propiedad más

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra eventos, rutas ni componentes; el cómo vive acá y en research. |
| II. Una feature, un PR | Tres user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R6: lo puro y el schema con Stryker al 100 %, el flujo ampliado en Playwright. |
| IV. Reglas como código | «Por el sitio no lleva canal; por fuera siempre, `unanswered` si no eligió» vive en una función pura (`handoverEvent`) con su prueba; «una vez por adopción» es el `done` de la base que ya existe. |
| V. Datos mínimos y privados | Nada nuevo se guarda; el canal es una clave fija sin el nombre del animal (el de la cuarta opción se arma en pantalla y no viaja); nada de quien adoptó. Sin tabla nueva, no hay regla de visibilidad nueva que probar en `tests/db`. |
| VI. Sin deriva | No cambian la encuesta de #71, lo que aparece después de marcar, Encuestas ni el camino a una persona aceptada. |
| VII. Liviana y linda | Hoja cliente existente; tokens y componentes de docs/10; estados en §Diseño. |
| VIII. Autonomía con veto | Las seis decisiones de la historia ya están en docs/03 en esta rama; ninguna regla que juzga a los agentes cambia. |

Sin violaciones. Re-chequeado después del diseño: igual.

## Project Structure

### Documentation (this feature)

```text
specs/039-por-donde-llego-adoptante/
├── story.md             # cuerpo verbatim de la historia #254
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
src/lib/adoptions/found-via.ts                          # nuevo: FOUND_VIA_OPTIONS, FoundVia, FoundViaAnswer, foundViaOf
src/lib/adoptions/found-via.test.ts                     # nuevo
src/lib/adoptions/handover-request.ts                   # nuevo: handoverRequest (lo que manda la pantalla según el camino)
src/lib/adoptions/handover-request.test.ts              # nuevo
src/lib/schemas/adoption.ts                             # handoverSchema suma foundVia
src/lib/schemas/adoption.test.ts                        # casos de foundVia
src/lib/analytics/events.ts                             # pet_handed_over suma found_via
src/lib/analytics/adoption-events.ts                    # handoverEvent recibe foundVia
src/lib/analytics/adoption-events.test.ts               # casos de found_via
src/actions/adoptions.ts                                # markPetAdopted pasa foundVia a handoverEvent
src/hooks/use-handover.ts                               # foundVia, chooseFoundVia; elegir camino lo vacía
src/components/adoptions/found-via-field.tsx            # nuevo: la pregunta (RadioGroup column clearable + hint)
src/components/adoptions/handover-form.tsx              # la pregunta en el camino por fuera
src/app/[locale]/_components/handover-texts.ts          # foundViaTexts(name)
src/app/[locale]/(app)/mis-animales/[id]/adoptado/page.tsx  # pasa los textos de la pregunta
messages/es.json                                        # adoptions.handover.found_via.*
docs/03-mvp-features.md                                 # las seis decisiones (ya en esta rama) + lectura 15 en §Métricas de éxito
docs/06-i18n.md                                         # glosario: «por dónde te encontró» (`found via`)
docs/10-design-system.md                                # fila de FoundViaField; HandoverForm con la pregunta
tests/e2e/handover.spec.ts                              # la pregunta en el camino por fuera, con y sin aceptadas, y en una cría
```

**Structure Decision**: la de F00 (CLAUDE.md §Estructura). Dominio `adoptions`: la pregunta es parte
de marcar adoptado. Los textos se arman en el servidor, en `handover-texts.ts`, como el resto de la
pantalla.

## Diseño

Cargado antes de escribir: docs/10 (§Componentes, §Color, §Textos, §Cómo se aplica) y las filas de
`HandoverForm`, `RadioGroup`, `FormNote`, `SaveFailedStrip` y `DeletionReasonField`, que es la misma
forma de pregunta opcional (#263). El skill `frontend-design:frontend-design` no está en esta sesión;
la build lo carga antes de escribir JSX. Nada nuevo en tokens.

### Marcar adoptado, camino por fuera — 390 px (con una aceptada)

```
┌──────────────────────────────────────┐
│ [Mis animales]                       │  ← LinkButton ghost sm, el de hoy
│ ┌────┐ ¿A quién se la diste?         │  ← foto con cinta + afiche --text-2xl, los de hoy
│ └────┘                               │
│ Elegí a quién le diste a Luna.       │  ← legend de hoy
│ ┌──────────────────────────────────┐ │
│ │ (o) Beto · nivel · Aceptaste…    │ │  ← HandoverCandidate, el de hoy
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ (•) Se la di a alguien que no    │ │  ← elegida, llena de tinta
│ │     vino por el sitio            │ │
│ └──────────────────────────────────┘ │
│                                      │
│ No queda compromiso ni a quién se la │  ← FormNote de hoy
│ diste.                               │
│ ¿Por dónde te encontró?              │  ← legend, RadioGroup legendSize sm
│ Si te acordás. Se marca igual sin    │  ← hint --text-sm ink-muted (texto final con sin-slop)
│ elegir ninguna.                      │
│ ┌──────────────────────────────────┐ │
│ │ Un grupo o una página de Facebook│ │  ← RadioGroup column clearable, 44 px mín.
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Instagram                        │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Un estado o un grupo de WhatsApp │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Vio a Luna en este sitio y me    │ │
│ │ escribió directo                 │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Alguien que conozco, o me lo     │ │
│ │ recomendaron                     │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Por otro lado                    │ │
│ └──────────────────────────────────┘ │
│ [SaveFailedStrip si no llegó]        │  ← el de hoy
│ [Marcar adoptada]                    │  ← secondary con aceptadas, primary sin ellas
│ [Cancelar]                           │  ← ghost, el de hoy
└──────────────────────────────────────┘
```

**Sin aceptadas** (390 px): no está la lista de personas; arriba, la `FormNote` única de hoy con el
camino a las solicitudes, y debajo, sin ningún toque previo, la pregunta, el aviso si no llegó y
«Marcar adoptada» en `primary`. **A 1280 px**: la misma columna de lectura de `ApplicationPetLayout`
a la derecha de la foto, como hoy; la pregunta va en el mismo bloque, sin hoja ni diálogo. **Con una
persona elegida**: la pantalla de hoy, sin la pregunta.

- **Reutiliza**: `RadioGroup` (`orientation="column"`, `legendSize="sm"`, `clearable`, `hint`),
  `FormNote`, `SaveFailedStrip`, `Button`, `LinkButton`, `ApplicationPetLayout`.
- **Crea**: `FoundViaField` (adoptions; sin elegir · elegida · deshabilitada mientras marca): el
  `RadioGroup` con la pregunta como `legend` y el `hint` atado con `aria-describedby`. Controlado por
  `HandoverForm`, que pasa `value`, `onChange` y `disabled={busy}`. Es la misma forma que
  `DeletionReasonField`, con otra lista y otro dominio; no se generaliza porque son dos usos con
  textos y opciones distintos y la primitiva ya hace el trabajo.
- **Cambia**: `HandoverForm` pone `FoundViaField` en el bloque de abajo cuando el camino es por fuera,
  después de la `FormNote` y antes del aviso y del botón; `useHandover` guarda lo elegido y lo vacía
  al cambiar de camino (research R4).
- **Tokens**: `--color-ink`, `--color-ink-muted`, `--color-canvas`, `--color-surface` (hover de la
  casilla, el de `RadioGroup`), `--space-4` (el `gap-4` del bloque entre nota, pregunta y botón),
  `--space-2` entre casillas (el de `RadioGroup`), `--text-base`/`--text-sm`, `--dur-fast` en el
  cambio de la casilla y `--dur-base` en el fade del bloque (los de hoy).
- **Lo único que llama la atención**: sigue siendo el botón de confirmar. Las seis casillas pesan
  igual, sin tirita ni color: una destacada empujaría la respuesta. La elegida se llena de tinta, como
  toda casilla de `RadioGroup`.
- **Accesibilidad**: `fieldset` + `legend` nativos; flechas para moverse, espacio para elegir y para
  dejar sin elegir (`clearable`); el `hint` atado al `fieldset`. Mientras marca, el `fieldset` queda
  `disabled` y el foco sigue en el botón.
- **Estados**: la pregunta no trae datos: sus opciones son fijas y sus textos vienen con la pantalla.
  Cargando y error son los de la pantalla de hoy (su `loading.tsx` y su `error.tsx`, que no se
  tocan; mientras cargan, no hay pregunta ni botón). Vacío: no aplica. Lo que no llegó: el
  `SaveFailedStrip` de hoy, con lo elegido intacto.

## Cómo se construye, por user story

1. **US1 — marcar por fuera (P1)**: `found-via.ts` y `handover-request.ts` con sus pruebas, el schema
   con sus casos, `events.ts`, `handoverEvent` con sus casos, `markPetAdopted`, `useHandover`,
   `FoundViaField`, `HandoverForm`, los textos y la página; e2e del camino por fuera con y sin
   aceptadas.
2. **US2 — cada cría y cada entrega (P2)**: nada nuevo en el código, porque la pantalla es la misma
   para un animal y para una cría y no recuerda nada entre aperturas. Se prueba: el caso de cría en
   `handoverEvent` (`litter: true` con su canal) y, en el e2e, la pregunta en una cría con su nombre.
3. **US3 — la lectura (P3)**: la lectura 15 en docs/03 §Métricas de éxito, el glosario de docs/06 y
   las filas de docs/10.

Los textos se escriben con el skill `sin-slop` en cada US. La pregunta y las opciones van palabra por
palabra de la historia.

## Complexity Tracking

Sin violaciones de la constitución.
