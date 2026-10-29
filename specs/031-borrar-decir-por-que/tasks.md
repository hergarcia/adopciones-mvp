---
description: "Tareas de la historia #263 — Al borrar un animal que no se adoptó, decir por qué con un toque"
---

# Tasks: Al borrar un animal que no se adoptó, decir por qué con un toque

**Input**: `specs/031-borrar-decir-por-que/` — spec.md, plan.md (§Diseño, §Cómo se construye),
research.md (R1–R10), data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: sí, y solo los de research R10; no se agrega ninguno fuera de ahí ni se saca ninguno de
ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se carga
`frontend-design:frontend-design` y se abre `docs/10-design-system.md`; antes de tocar la migración o
sus tests, `supabase:supabase-postgres-best-practices`; todo texto visible, con `sin-slop`; después de
varios TSX, `vercel:react-best-practices`. La migración es un solo archivo; después de cada cambio,
`pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: lo que se guarda, las funciones de borrar que lo escriben y las reglas puras que usan
el animal, la camada y Encuestas.

- [X] T001 Crear `supabase/migrations/<ts>_deletion_reasons.sql`: la tabla `public.deletion_reasons` con sus `check`, el índice `(kind, reason)`, RLS sin políticas y `revoke all ... from anon, authenticated` (data-model.md, research R1)
- [X] T002 En la misma migración: `drop` y `create` de `public.delete_pet(p_owner, p_pet, p_reason text default null)` y de `public.delete_litter(p_owner, p_litter, p_reason text default null)` con el mismo cuerpo de hoy (copiado de `20261025120000_litters.sql` y `20261026120000_litter_lifecycle.sql`), el estado leído con `for update` antes de borrar, el `insert` solo con `done` y estado con pregunta, y la columna `reason_counted`; `public.admin_deletion_reason_summary()` con las doce combinaciones; `security definer`, `set search_path = ''`, `execute` de las de borrar solo a `service_role` y la de resumen a `authenticated` (data-model.md §Funciones, research R2, R3, R8)
- [X] T003 `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T004 [P] `src/lib/pets/deletion-reason.ts`: `DELETION_REASONS`, `DeletionReason`, `DeletionAnswer`, `DeletionKind`, `petAsksDeletionReason`, `litterAsksDeletionReason`, `deletionAnswerOf` (data-model.md §Tipos, research R3)
- [X] T005 [P] `src/lib/schemas/deletion-reason.ts`: `deletionAnswerSchema`; `petDeletionSchema` en `src/lib/schemas/pet-status.ts` suma `reason` (contracts)
- [X] T006 [P] `pet_deletion_reason` en `src/lib/analytics/events.ts` (con su comentario de disparador) y `src/lib/analytics/deletion-reason-events.ts` con `deletionReasonEvent` (research R7)
- [X] T007 [P] `tests/db/deletion-reasons-support.ts`: sembrar sobre `lifecycle-support.ts` un animal en cada estado y leer la tabla con el cliente de servicio (el sexo no cambia nada en la base: solo concuerda los textos); las camadas en cada estado las suma T024

**Checkpoint**: la base cuenta bien sin ninguna pantalla.

---

## Fase 2: User Story 1 — Decir por qué al borrar un animal (P1) 🎯 MVP

**Goal**: la confirmación de borrar un animal disponible, en proceso, pausado o vencido muestra la
pregunta; borrar cuenta una respuesta con lo elegido o sin contestar, una sola vez.

**Independent Test**: spec.md US1.

### Tests de US1

- [X] T008 [P] [US1] `src/lib/pets/deletion-reason.test.ts`: `petAsksDeletionReason` en los seis estados; `litterAsksDeletionReason` en los cinco; `deletionAnswerOf` con cada opción, vacío y una clave desconocida; las cinco opciones en el orden de la historia
- [X] T009 [P] [US1] `src/lib/schemas/deletion-reason.test.ts` y casos nuevos en `src/lib/schemas/pet-status.test.ts`: sin `reason`, cada opción, `unanswered`, una clave inválida y una propiedad de más
- [X] T010 [P] [US1] `src/lib/analytics/deletion-reason-events.test.ts`: el momento con `kind` y `reason`, sin id ni día
- [X] T011 [P] [US1] `tests/db/deletion-reasons-privacy.test.ts`: visitante y persona (también la que borró) no leen ni escriben `deletion_reasons`; la tabla no tiene ninguna columna que apunte a una persona, un animal o una camada; `delete_pet` y `delete_litter` no se pueden llamar como visitante ni como persona (SC-003)
- [X] T012 [P] [US1] `tests/db/deletion-reasons-rules.test.ts` (animal): con `p_reason` en disponible, en proceso, pausado y vencido → una fila `pet` con esa opción, el día de Uruguay y `reason_counted`; con `unanswered` → una fila `unanswered`; con `p_reason` nulo → ninguna; adoptado y dado de baja → borra y ninguna fila; segunda llamada (`not_found`) → ninguna fila más; un `p_reason` inválido → error y el animal sigue; la regla de la base coincide con `petAsksDeletionReason` en cada estado; la lista del `check` es la de `DELETION_REASONS` + `unanswered` (SC-002)
- [X] T013 [US1] `tests/e2e/borrar-por-que.spec.ts`: Carla abre «Borrar» en una hembra disponible → ve «¿Por qué la borrás?» sin nada elegido → elige una, la toca otra vez (queda sin elegir), elige «No llegaron solicitudes» → «Borrar para siempre» → «Mis animales» con el aviso; en uno adoptado, la confirmación sin pregunta

### Implementación de US1

- [X] T014 [US1] `src/lib/supabase/queries/pet-status.ts`: `deletePetRecord(ownerId, petId, reason)` con `p_reason` y `reasonCounted` (contracts)
- [X] T015 [US1] `src/actions/pet-status.ts`: `deletePet` pasa `reason` y suma `deletionReasonEvent('pet', reason)` cuando se contó (contracts)
- [X] T016 [US1] `src/hooks/use-pet-deletion.ts`: `remove(reason?)`
- [X] T017 [P] [US1] `src/components/ui/radio-group.tsx`: prop `clearable` (research R5)
- [X] T018 [P] [US1] `src/components/ui/dialog.tsx`: alto máximo de la pantalla menos dos gutters y contenido que corre (research R6)
- [X] T019 [P] [US1] `src/components/ui/destructive-confirm-dialog.tsx`: `children` entre el cuerpo y el error (research R4)
- [X] T020 [P] [US1] Textos en `messages/es.json` (`pets.deletion_reason`: `title` y la tercera opción con `select` por sexo, las cinco opciones palabra por palabra, `hint`), escritos y revisados con `sin-slop`; `src/components/pets/deletion-reason-texts.ts` los arma con el sexo (research R9)
- [X] T021 [US1] `src/components/pets/deletion-reason-field.tsx`: `RadioGroup` `column` `clearable` con la pregunta como `legend` y el `hint` atado, controlado, `disabled` mientras se borra (plan §Diseño)
- [X] T022 [US1] `src/components/pets/delete-pet-dialog.tsx`: `texts.reason` (`DeletionReasonTexts | null`), el estado elegido que se limpia al cerrar, `remove(deletionAnswerOf(selected))` solo con pregunta; `DeletePetTexts` (en el mismo archivo) suma `reason`
- [X] T023 [US1] `src/components/pets/status-texts.ts`: `petStatusTexts` recibe el estado y arma `delete.reason` con `petAsksDeletionReason`; sus llamadores (`mis-animales/page.tsx`, `mis-animales/[id]/page.tsx` y los que use `rg petStatusTexts`) pasan el estado

**Checkpoint**: US1 se prueba sola de punta a punta.

---

## Fase 3: User Story 2 — Decir por qué al borrar una camada (P2)

**Goal**: «Borrar la camada» muestra la pregunta una vez cuando la camada no está adoptada entera ni
dada de baja, y cuenta una respuesta de camada.

**Independent Test**: spec.md US2.

### Tests de US2

- [X] T024 [P] [US2] `tests/db/deletion-reasons-support.ts` suma, sobre `litter-support.ts`, una camada en cada estado, con una cría en proceso y la última cría adoptada; `tests/db/deletion-reasons-rules.test.ts` (camada): disponible, pausada y vencida con una cría sin adoptar (también en proceso) → una fila `litter`; adoptada entera y dada de baja → ninguna; la última cría marcada adoptada antes de borrar → ninguna; `not_found` → ninguna más; quitar una cría (`remove_young` de hoy) → ninguna; la regla coincide con `litterAsksDeletionReason`

### Implementación de US2

- [X] T025 [US2] `src/lib/supabase/queries/litters.ts`: `deleteLitterRecord(ownerId, litterId, reason)` con `p_reason` y `reasonCounted`
- [X] T026 [US2] `src/actions/litters.ts`: `deleteLitter(litterId, reason?)` valida con `deletionAnswerSchema` y manda `deletionReasonEvent('litter', reason)` cuando se contó
- [X] T027 [US2] `src/hooks/use-litter-deletion.ts`: `remove(reason?)`
- [X] T028 [US2] `src/components/litters/delete-litter-dialog.tsx`: lo mismo que `DeletePetDialog` con `DeletionReasonField`; los dos se apoyan en `DeletionConfirmDialog` (`src/components/pets/deletion-confirm-dialog.tsx`), que guarda lo elegido
- [X] T029 [US2] `src/components/litters/litter-status-texts.ts`: `delete.reason` en femenino con `litterAsksDeletionReason(state)`; sus llamadores pasan el estado de la camada

**Checkpoint**: US1 y US2 andan cada una por su lado.

---

## Fase 4: User Story 3 — Leer en Encuestas por qué se borraron animales (P3)

**Goal**: Encuestas suma «Por qué se borraron animales», con cuentas y opciones por animal y camada,
sin nombres, solo para quien administra.

**Independent Test**: spec.md US3.

### Tests de US3

- [X] T030 [P] [US3] `src/lib/surveys/deletion-summary.test.ts`: sin filas o todas en cero; solo sin contestar; mezcla de animales y camadas con cada opción; `asked = answered + unanswered` por clase y en total; las cinco opciones siempre, en orden, con su número por clase
- [X] T031 [P] [US3] `tests/db/deletion-reasons-rules.test.ts` (resumen): quien administra recibe las doce combinaciones con los números sembrados; una persona y un visitante reciben nada; borrar la cuenta de quien borró con respuesta deja el resumen igual (SC-004)

### Implementación de US3

- [X] T032 [US3] `src/lib/surveys/deletion-summary.ts`: `deletionReasonSummary(rows)` (data-model.md §Tipos)
- [X] T033 [US3] `src/lib/supabase/queries/deletion-reasons.ts`: `deletionReasonSummary()` con `oneOf` sobre `kind` y `reason` (contracts)
- [X] T034 [P] [US3] Textos en `messages/es.json` (`surveys.deletions`: el título del apartado, la pregunta, las cuentas con plural, la etiqueta corta de cada opción, «Animales», «Camadas», el `caption` de la tabla, el vacío «Todavía nadie borró un animal sin adopción» y que nadie contestó todavía), con `sin-slop`
- [X] T035 [US3] `src/app/[locale]/(app)/revision/encuestas/_components/deletion-reasons.tsx`: la sección con su `h2`, el vacío, `SurveySummary` `h3` con la tabla en `answers` y `ExitOriginTable` con las dos clases (plan §Diseño)
- [X] T036 [US3] `src/app/[locale]/(app)/revision/encuestas/page.tsx` trae el resumen en el mismo `Promise.all` y suma la sección debajo de «Por qué no se verificaron»; `loading.tsx` suma su forma

**Checkpoint**: las tres historias andan.

---

## Fase 5: Pulido

- [X] T037 [P] `docs/10-design-system.md`: fila nueva de `DeletionReasonField`; `RadioGroup` con `clearable`, `Dialog` con alto máximo y `DestructiveConfirmDialog` con `children` (con su decisión y fecha); `DeletePetDialog` con la pregunta
- [X] T038 [P] `docs/03-mvp-features.md` §Métricas de éxito, «Cómo se leen»: lectura 8 al lado de la primera, con `pet_deletion_reason` por `reason` y `kind` y el apartado de Encuestas, leída como señal (FR-029)
- [X] T039 [P] `docs/06-i18n.md`: fila del glosario «pregunta al borrar» (`deletion reason`), distinta de «encuesta»
- [ ] T040 Capturas a 390 y 1280 con `node scripts/walk.mjs --story borrar-decir-por-que --user` de la confirmación con y sin pregunta (animal y camada, una opción elegida, el error de conexión) y de Encuestas (con datos y vacía)
- [ ] T041 `vercel:react-best-practices` sobre los TSX tocados; `pnpm gates:affected` verde, Stryker al 100 % en lo que tiene test

---

## Dependencias

- Fase 1 bloquea todo. US1 → US2 (reusa `DeletionReasonField`, las primitivas y los textos). US3
  depende solo de la Fase 1 y de filas sembradas en sus pruebas; se puede empezar en paralelo con
  US2.
- Dentro de cada US: los tests primero, en rojo; después la implementación.
