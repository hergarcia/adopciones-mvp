---
description: "Tareas de la historia #80 — El estado de la verificación muestra el motivo del último rechazo"
---

# Tasks: El estado de la verificación muestra el motivo del último rechazo

**Input**: `specs/008-motivo-ultimo-rechazo/` — spec.md, plan.md (4 decisiones técnicas),
research.md, data-model.md, quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí.

**Organización**: por user story, en orden de prioridad, para que cada una se pueda construir y
probar sola.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Base compartida

**Propósito**: la regla de «el último rechazo» y el dato que la alimenta, que las tres user
stories usan. **Sin dependencias nuevas ni migraciones** (plan.md §Technical Context).

- [X] T001 `src/lib/verification/rejections.test.ts`: los casos de `newestFirst` de plan.md §Qué se testea (días distintos en cualquier orden; mismo día, `sequence` mayor primero; mezcla con un día repetido; no muta la entrada). Tienen que fallar: la función todavía no existe
- [X] T002 `src/lib/verification/rejections.ts`: `Rejection = { rejectedOn, reason, sequence }` y `newestFirst` (plan.md §1, data-model.md §Regla), con la línea de por qué el `id` sigue el orden de resolución. T001 en verde
- [X] T003 `src/lib/supabase/queries/identity-rows.ts`: quitar el `Rejection` local e importarlo de `lib/verification/rejections`; `toRejections` recibe `{ id, rejected_on, reason }` y mapea `id → sequence` (plan.md §1)
- [X] T004 `tests/db/identity.test.ts` (bloque «resolver un pedido»): dos pedidos de la misma cuenta rechazados el mismo día con `resolve` (primero `unreadable`, después `mismatch`); leídos con la sesión de la dueña (`id, rejected_on, reason`), el segundo tiene `id` mayor y `newestFirst(toRejections(filas))[0].reason` es `mismatch` (plan.md §Qué se testea, research §R2)

**Punto de control**: `pnpm lint && pnpm typecheck && pnpm test` en verde, sin cambios visibles.

---

## Fase 2: US1 — El estado del pedido dice lo que de verdad falló la última vez (P1) 🎯 MVP

**Meta**: con dos o más rechazos el mismo día, el estado muestra el motivo, el consejo y los
intentos del último resuelto.

**Prueba independiente**: quickstart.md escenario 1.

- [X] T005 [US1] `src/lib/verification/identity-status.test.ts`: el fixture `rejected(day, reason)` suma un `sequence` creciente automático; casos nuevos: dos del mismo día con motivos distintos en los dos órdenes de entrada → `rejected` con el motivo de `sequence` mayor y `attemptsLeft: 1`; dos del mismo día con el mismo motivo → ese motivo y `attemptsLeft: 1`; días distintos con el más reciente de `sequence` menor → manda el día. Los de mismo día tienen que fallar
- [X] T006 [US1] `src/lib/verification/identity-status.ts`: `IdentityRecord.rejections: readonly Rejection[]`; reemplazar el `toSorted` por día por `newestFirst` sobre los de la ventana (plan.md §2). T005 en verde
- [X] T007 [US1] `src/lib/supabase/queries/identity.ts`: `getMyIdentity` selecciona `id, rejected_on, reason` (plan.md §3)

**Punto de control**: `pnpm test` en verde; quickstart.md escenarios 1 y 4 a mano.

---

## Fase 3: US2 — «Sin intentos» dice por qué fue el último rechazo (P2)

**Meta**: en el tope, el motivo y el consejo son los del último rechazo; la fecha para volver a
pedir no cambia.

**Prueba independiente**: quickstart.md escenario 3.

- [ ] T008 [US2] `src/lib/verification/identity-status.test.ts`: tres del mismo día con tres motivos → `capped` con el motivo del de `sequence` mayor; tercero el mismo día que el segundo → `capped` con el motivo del tercero; en los dos, `retryOn` igual al que da hoy (FR-009, SC-004). Si T006 ya los deja en verde, igual quedan: sostienen el 100 % de Stryker sobre la rama `capped`
- [ ] T009 [US2] `src/lib/verification/identity-status.ts`: revisar la rama `capped` con el nuevo orden (`latest` del primero, `oldest` del índice `CAP − 1`) y resolver el `?? oldest` inalcanzable sin dejar un mutante equivalente sin anotar (plan.md §2). T008 en verde

**Punto de control**: `pnpm test` y `pnpm mutation` en verde.

---

## Fase 4: US3 — Quien revisa ve los rechazos anteriores en el orden en que pasaron (P3)

**Meta**: en un pedido de la cola, los rechazos van del más reciente al más viejo, también dentro
del día.

**Prueba independiente**: quickstart.md escenario 2.

- [ ] T010 [US3] `src/lib/supabase/queries/review-queue.ts`: `getReviewRequest` selecciona `id, rejected_on, reason`, sin `.order(...)`, y devuelve `newestFirst(toRejections(...))` (plan.md §3). Sin test propio: la regla ya está probada en T001 y el supuesto de base en T004 (plan.md §Qué se testea)

**Punto de control**: `pnpm test` en verde; quickstart.md escenario 2 a mano.

---

## Fase 5: Pulido

- [ ] T011 [P] `docs/known-limitations.md`: borrar KL-11-6 y KL-11-7 (spec §Assumptions, plan.md §Documentación)
- [ ] T012 [P] Confirmar que `docs/03-mvp-features.md` §1 tiene la decisión del enjambre del 2026-09-28 textual, una sola vez
- [ ] T013 `pnpm mutation` al 100 % sobre `rejections.ts` e `identity-status.ts`, con cualquier mutante equivalente anotado en su línea
- [ ] T014 `pnpm verify` en verde

---

## Dependencias

- Fase 1 antes que todo: T001 → T002 → T003 → T004.
- US1 (T005 → T006, T007) después de la Fase 1.
- US2 (T008 → T009) después de T006.
- US3 (T010) después de la Fase 1; independiente de US1 y US2.
- Pulido al final; T011 y T012 en paralelo.
