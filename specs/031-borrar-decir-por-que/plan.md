# Implementation Plan: Al borrar un animal que no se adoptó, decir por qué con un toque

**Branch**: `feature/263-borrar-decir-por-que` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/031-borrar-decir-por-que/spec.md`

## Summary

La confirmación de borrar un animal disponible, en proceso, pausado o vencido, o una camada que no
está adoptada entera ni dada de baja, suma «¿Por qué lo/la borrás?» con cinco opciones de una sola
elección, ninguna elegida y que se pueden dejar sin elegir. «Borrar para siempre» borra igual y
manda lo elegido o «sin contestar». La respuesta se cuenta **dentro de la misma transacción que
borra**, solo si el borrado se hizo y el estado de ese momento tenía pregunta: una fila sin persona
ni animal, con la opción, el día y si era animal o camada (research R2). Encuestas suma «Por qué se
borraron animales», solo con cuentas.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre (next-intl, zod, Supabase con `@supabase/ssr`, Radix en las
primitivas). **Ninguna dependencia nueva.**

**Storage**: Supabase Postgres local; una migración forward-only con una tabla sin políticas, dos
funciones de borrar reemplazadas y una de resumen (data-model.md)

**Testing**: Vitest (unitarias y `tests/db` contra Supabase local), Stryker al 100 % sobre lo que
tiene test, Playwright (un flujo)

**Target Platform**: web mobile-first, 390 px y 1280 px

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: sin JS nuevo en pantallas públicas. En «Mis animales» y los paneles, la
pregunta vive en hojas cliente que ya existen (`DeletePetDialog`, `DeleteLitterDialog`) y suma un
`RadioGroup`, que ya baja en esas pantallas por otros formularios o pesa pocos cientos de bytes.
Presupuesto de siempre: JS inicial < 150 KB, LCP < 2,5 s, Lighthouse mobile ≥ 90

**Constraints**: Ley 18.331 (la respuesta sin la persona, sin la hora ni el animal); borrar nunca se
traba ni suma toques; una respuesta por borrado hecho

**Scale/Scope**: beta de 3-5 rescatistas; dos confirmaciones tocadas (animal y camada) en cuatro
lugares (card y panel de cada uno) y una sección nueva en Encuestas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra tablas, rutas ni componentes; el cómo vive acá y en research. |
| II. Una feature, un PR | Tres user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R10: lógica pura y schema con Stryker al 100 %, privacidad y reglas en `tests/db`, un e2e. |
| IV. Reglas como código | «Qué estado pregunta» vive en el código y en la base, comparadas por una prueba; «una respuesta por borrado hecho» vive en la transacción de borrar; la lista de opciones en un `check` y en el código, comparadas. |
| V. Datos mínimos y privados | Nada de la persona; la respuesta sin persona ni animal; tabla sin políticas leída solo por una función que pregunta si administra; prueba que intenta leerla como visitante, como persona y como quien contestó. |
| VI. Sin deriva | No se toca la encuesta de #71, la pregunta de #234, quitar una cría ni borrar la cuenta. Las opciones no se editan desde el sitio. |
| VII. Liviana y linda | Server Components en Encuestas; la pregunta va en hojas cliente que ya existen; tokens y componentes de docs/10; tres estados de la sección con datos (§Diseño). |
| VIII. Autonomía con veto | Las cinco decisiones de la historia ya están en docs/03 en esta rama; ninguna regla que juzga a los agentes cambia. |

Sin violaciones. Re-chequeado después del diseño: igual.

## Project Structure

### Documentation (this feature)

```text
specs/031-borrar-decir-por-que/
├── story.md             # cuerpo verbatim de la historia #263
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
supabase/migrations/<ts>_deletion_reasons.sql            # nuevo: tabla, delete_pet y delete_litter con p_reason, resumen, grants
src/lib/supabase/types.ts                                # regenerado con pnpm db:types
src/lib/pets/deletion-reason.ts                          # nuevo: opciones, petAsksDeletionReason, litterAsksDeletionReason, deletionAnswerOf
src/lib/pets/deletion-reason.test.ts                     # nuevo
src/lib/schemas/deletion-reason.ts                       # nuevo: deletionAnswerSchema
src/lib/schemas/deletion-reason.test.ts                  # nuevo
src/lib/schemas/pet-status.ts                            # petDeletionSchema suma reason
src/lib/schemas/pet-status.test.ts                       # casos de reason
src/lib/surveys/deletion-summary.ts                      # nuevo: deletionReasonSummary
src/lib/surveys/deletion-summary.test.ts                 # nuevo
src/lib/analytics/events.ts                              # + pet_deletion_reason
src/lib/analytics/deletion-reason-events.ts              # nuevo: deletionReasonEvent
src/lib/analytics/deletion-reason-events.test.ts         # nuevo
src/lib/supabase/queries/pet-status.ts                   # deletePetRecord pasa p_reason, devuelve reasonCounted
src/lib/supabase/queries/litters.ts                      # deleteLitterRecord ídem
src/lib/supabase/queries/deletion-reasons.ts             # nuevo: deletionReasonSummary (la única puerta a la tabla)
src/actions/pet-status.ts                                # deletePet con reason y el momento
src/actions/litters.ts                                   # deleteLitter con reason y el momento
src/hooks/use-pet-deletion.ts                            # remove(reason?)
src/hooks/use-litter-deletion.ts                         # remove(reason?)
src/components/ui/radio-group.tsx                        # props clearable y hint
src/components/ui/dialog.tsx                             # alto máximo de la pantalla y contenido que corre
src/components/ui/destructive-confirm-dialog.tsx         # children entre el cuerpo y los botones
src/components/pets/deletion-reason-field.tsx            # nuevo: la pregunta (RadioGroup column clearable + hint)
src/components/pets/deletion-confirm-dialog.tsx          # nuevo: la confirmación con la pregunta, lo elegido y lo que no llegó; la usan animal y camada
src/components/pets/delete-pet-dialog.tsx                # DeletionConfirmDialog con usePetDeletion
src/components/litters/delete-litter-dialog.tsx          # DeletionConfirmDialog con useLitterDeletion
src/components/pets/status-texts.ts                      # petStatusTexts arma delete.reason según estado y sexo
src/components/pets/deletion-reason-texts.ts             # nuevo: deletionReasonTexts(sex) con getTranslations
src/components/litters/litter-status-texts.ts            # delete.reason según el estado de la camada
src/components/pets/my-pet-actions.tsx                   # sin cambio de forma (los textos traen reason)
src/components/litters/litter-status-actions.tsx         # ídem
src/app/[locale]/(app)/revision/encuestas/page.tsx       # suma la sección
src/app/[locale]/(app)/revision/encuestas/_components/deletion-reasons.tsx  # nuevo: arma la sección
src/app/[locale]/(app)/revision/encuestas/loading.tsx    # suma la forma de la sección
messages/es.json                                         # pets.deletion_reason.*, surveys.deletions.*
docs/03-mvp-features.md                                  # las cinco decisiones (ya en esta rama) + lectura 8 en §Métricas de éxito
docs/06-i18n.md                                          # glosario: «pregunta al borrar» (`deletion reason`), distinta de «encuesta»
docs/10-design-system.md                                 # filas de DeletionReasonField, RadioGroup clearable, Dialog con alto máximo, DestructiveConfirmDialog con children, DeletePetDialog
tests/db/deletion-reasons-support.ts                     # nuevo: animales y camadas en cada estado
tests/db/deletion-reasons-privacy.test.ts                # nuevo
tests/db/deletion-reasons-rules.test.ts                  # nuevo
tests/e2e/borrar-por-que.spec.ts                         # nuevo
```

Si `petStatusTexts` recibe solo `{ name, sex }` hoy, pasa a recibir también `state`; los llamadores
(`mis-animales/page.tsx`, `mis-animales/[id]/page.tsx`) ya tienen el estado del animal. Lo mismo para
`litterStatusTexts` con el estado de la camada.

**Structure Decision**: la de F00 (CLAUDE.md §Estructura). Dominio `pets` para la pregunta (la
camada la reusa, como ya reusa `DeletePetTexts`); dominio `surveys` para lo que lee quien administra,
junto a #71 y #234.

## Diseño

Cargado antes de escribir: docs/10 (§Componentes, §Color, §Textos, §Cómo se aplica) y las filas de
`Dialog`, `DestructiveConfirmDialog`, `RadioGroup`, `DeletePetDialog`, `SurveySummary` y
`ExitOriginTable`. La pregunta y el apartado son pantallas de trabajo: nada nuevo en tokens.

### La confirmación de borrar con la pregunta — 390 px

```
┌─ nota con cinta (Dialog) ────────────┐
│ ¿Borrar a Luna?                  [×] │  ← título de hoy, afiche --text-2xl
│                                      │
│ Se borra para siempre, con sus fotos.│  ← cuerpo de hoy, --text-base ink
│ Quien abra su enlace va a ver que no │
│ está publicado.                      │
│                                      │
│ ¿Por qué la borrás?                  │  ← legend, RadioGroup legendSize sm
│ Si querés contarnos. Se borra igual  │  ← hint, --text-sm ink-muted (texto final con sin-slop)
│ y no dice quién sos.                 │
│ ┌──────────────────────────────────┐ │
│ │ No llegaron solicitudes          │ │  ← RadioGroup column clearable, 44 px mín.
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Las solicitudes que llegaron no  │ │
│ │ me convencieron                  │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ La di en adopción por Facebook,  │ │
│ │ Instagram o WhatsApp             │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Ya no está en adopción           │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Otra cosa                        │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [ErrorText si no llegó]              │  ← el de hoy, adentro
│ [Borrar para siempre] [No borrar]    │  ← danger + secondary, los de hoy
└──────────────────────────────────────┘
```

A 1280 px: la misma nota en `--measure`, centrada, como hoy. No se estira ni abre otra.

- **Reutiliza**: `Dialog` y `DestructiveConfirmDialog` (los de hoy, con `children`), `RadioGroup`
  (`orientation="column"`, `legendSize="sm"`), `ErrorText`, `Button` (`danger`, `secondary`).
- **Crea**: `DeletionReasonField` (pets; sin elegir · elegida · deshabilitada mientras se borra): el
  `RadioGroup` con la pregunta como `legend` y el `hint` debajo, atado con `aria-describedby`.
  Controlado por el diálogo, que pasa `value`, `onChange` y `disabled={pending}`.
- **Cambia**: `RadioGroup` suma `clearable` (tocar la elegida la deja sin elegir; research R5) y
  `hint` (la línea debajo de la pregunta, atada al `fieldset`: la primitiva no tenía dónde ponerla
  entre la `legend` y las casillas); `Dialog` limita el alto a la pantalla menos dos gutters y corre
  el relleno de adentro, no la nota, que cortaría la cinta (research R6);
  `DestructiveConfirmDialog` suma `children` entre el cuerpo y el error, como función que recibe si
  la acción corre, y `onOpenChange` avisa también sin `open`, para olvidar lo elegido al cerrar.
- **Tokens**: `--color-ink`, `--color-ink-muted`, `--color-canvas`, `--color-surface` (hover de la
  casilla, el de `RadioGroup`), `--space-6` entre el cuerpo y la pregunta (`mt-6`), `--space-2`
  entre casillas (el `gap-2` de `RadioGroup`), `--text-base`/`--text-sm`, `--dur-fast` en el cambio
  de la casilla (el de `RadioGroup`).
- **Lo único que llama la atención**: sigue siendo «Borrar para siempre» en `danger`. La pregunta no
  tiene tirita ni color: las cinco casillas pesan igual a propósito, porque una destacada empuja la
  respuesta. La elegida se llena de tinta, como toda casilla de `RadioGroup`.
- **Accesibilidad**: `fieldset` + `legend` nativos; flechas para moverse, espacio para elegir y para
  dejar sin elegir; el `hint` atado al `fieldset`. Mientras se borra, el `fieldset` queda
  `disabled` y el foco sigue en «Borrar para siempre».
- **Estados**: la confirmación no carga datos (los textos y el estado los trae la pantalla); vacío no
  aplica (opciones fijas). Error: el `ErrorText` de hoy, adentro, con lo elegido intacto.
- **Sin pregunta** (adoptado, dado de baja, camada adoptada entera): `reason` es `null` y la
  confirmación es exactamente la de hoy.

### «Por qué se borraron animales» en Encuestas — 1280 px

```
──────────────────────────────────────────────────────────────────────── (divisor 2 px line)
Por qué se borraron animales                                  ← h2, --text-xl bold
──────────────────────────────────────────────────────────────────────────
¿Por qué lo borrás?                │                     Total  Animales  Camadas
Se borraron 7 animales y 2 camadas │ No llegaron solicitudes  ███ 3    2        1
con la pregunta. Contestaron 5 y   │ Las solicitudes que…     █░░ 1    1        0
no contestaron 4.                  │ Se dio por Facebook,…    ░░░ 0    0        0
                                   │ Ya no está en adopción   █░░ 1    1        0
                                   │ Otra cosa                ░░░ 0    0        0
```

A 390 px: una columna con el título, las cuentas y la tabla; la etiqueta de la opción se parte en
renglones antes de que la tabla pida scroll horizontal (como en #234). Como la tabla junta animales y
camadas, la tercera opción se nombra sin pronombre, por ejemplo «Se dio por Facebook, Instagram o
WhatsApp» (texto final con sin-slop).

- **Reutiliza**: la sección con su `h2` como `verification-exits.tsx`; adentro, `SurveySummary` con
  `heading="h3"`, la pregunta como título, las cuentas, `bars={null}` y la tabla en el lugar de
  `answers` (la columna derecha desde 1024, así la hoja no queda con un tercio vacío),
  `showBarsWhenEmpty` para ver las opciones en cero; `ExitOriginTable` con las columnas «Animales» y
  «Camadas» en lugar de los orígenes; `optionBars` para la barra de la más elegida; `Skeleton` en
  `loading.tsx`.
- **Crea**: nada.
- **Tokens**: `--color-ink`, `--color-ink-muted`, `--color-line`, `--text-xl`, `--text-lg`,
  `--text-sm`, `--space-4`, `--space-8`.
- **Lo único que llama la atención**: la barra de la opción más elegida en tinta llena (la regla de
  `ExitOriginTable`).
- **Estados**:
  - Cargando: `loading.tsx` de Encuestas suma un `h2` hueco y la forma de `SurveySummary`
    (`SURVEY_SUMMARY_LAYOUT`) con dos renglones de cuentas y cinco de tabla en `Skeleton`.
  - Vacío: sin ningún borrado con pregunta, debajo del `h2` solo «Todavía nadie borró un animal sin
    adopción» (`--text-base` `ink-muted`, como el vacío de #71). Con borrados y ninguno contestado:
    las cuentas, la frase de que nadie contestó todavía y la tabla en ceros.
  - Error: el `error.tsx` de `/revision/encuestas`, que ya existe: si la base no contesta, la página
    entera dice que no se pudo, como hoy.

## Cómo se construye, por user story

1. **US1 — animal (P1)**: migración entera (la tabla y las dos funciones de borrar sirven a las dos
   clases; el resumen ya queda listo), tipos, `deletion-reason.ts` y los schemas con sus pruebas,
   `deletePetRecord`, `deletePet`, el momento, `usePetDeletion`, las tres primitivas tocadas,
   `DeletionReasonField`, `DeletePetDialog`, los textos, pruebas de base del animal, e2e.
2. **US2 — camada (P2)**: `deleteLitterRecord`, `deleteLitter`, `useLitterDeletion`,
   `DeleteLitterDialog`, `litterStatusTexts`; pruebas de base de la camada (cada estado, la última cría
   adoptada en otra pestaña).
3. **US3 — Encuestas (P3)**: `deletionReasonSummary` (pura) con su prueba, la query, la sección,
   `loading.tsx`; pruebas de base del resumen (quien administra, persona, visitante, borrar una
   cuenta); la lectura 8 en docs/03 §Métricas de éxito.

Los textos se escriben con el skill `sin-slop` en cada US. La pregunta y las opciones van palabra por
palabra de la historia.

## Complexity Tracking

Sin violaciones de la constitución.
