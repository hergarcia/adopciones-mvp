---
description: "Tareas de la historia #254 — Al marcar un animal dado por fuera, decir por dónde llegó quien lo adoptó"
---

# Tasks: Al marcar un animal dado por fuera, decir por dónde llegó quien lo adoptó

**Input**: `specs/039-por-donde-llego-adoptante/` — spec.md, plan.md (§Diseño, §Cómo se construye),
research.md (R1–R7), data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: sí, y solo los de research R6; no se agrega ninguno fuera de ahí ni se saca ninguno de
ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se carga
`frontend-design:frontend-design` y se abre `docs/10-design-system.md`; todo texto visible, con
`sin-slop`; después de varios TSX, `vercel:react-best-practices`. No hay migración (research R1).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: las opciones, la entrada de marcar y el momento de medición con el canal.

- [X] T001 [P] `src/lib/adoptions/found-via.ts`: `FOUND_VIA_OPTIONS` en el orden de la historia, `FoundVia`, `FoundViaAnswer` (con `unanswered`) y `foundViaOf(selected)` (research R3, data-model.md)
- [X] T002 [P] `handoverSchema` en `src/lib/schemas/adoption.ts` suma `foundVia: z.enum(FOUND_VIA_OPTIONS).nullable()` (contracts)
- [X] T003 [P] `pet_handed_over` en `src/lib/analytics/events.ts` suma `found_via: FoundViaAnswer | null`, con su comentario; `handoverEvent` en `src/lib/analytics/adoption-events.ts` recibe `foundVia` y emite `null` por el sitio y la opción o `unanswered` por fuera (research R3)

**Checkpoint**: el momento sabe llevar el canal sin ninguna pantalla.

---

## Fase 2: User Story 1 — Decir por dónde llegó al marcar un animal dado por fuera (P1) 🎯 MVP

**Goal**: en el camino por fuera aparece la pregunta; marcar funciona igual con o sin contestar y la
medición de esa adopción lleva un solo canal.

**Independent Test**: spec.md US1.

### Tests de US1

- [X] T004 [P] [US1] `src/lib/adoptions/found-via.test.ts`: `foundViaOf` con cada opción, vacío y una clave desconocida; las seis opciones en el orden de la historia
- [X] T005 [P] [US1] Casos nuevos en `src/lib/schemas/adoption.test.ts`: `foundVia` con cada opción y `null` por fuera; con una persona y `null`; rechaza sin `foundVia`, con una clave que no es opción y con un campo de más; los casos de hoy suman `foundVia: null`
- [X] T006 [P] [US1] Casos nuevos en `src/lib/analytics/adoption-events.test.ts`: por fuera con `instagram` → `found_via: 'instagram'`; por fuera con `seen_here` → `seen_here`, sin nombre; por fuera sin canal → `unanswered`; por el sitio con un canal → `null` (FR-009, FR-010, SC-002, SC-003)
- [X] T007 [P] [US1] `src/lib/adoptions/handover-request.test.ts`: con una persona y un canal tocado → `applicationId` y `foundVia: null`; por fuera con un canal → `applicationId: null` y el canal; por fuera con `''` → `foundVia: null` (FR-010, FR-013)
- [X] T008 [US1] `tests/e2e/handover.spec.ts`: con una aceptada, elegir «por fuera» → la pregunta sin nada elegido; tocar «Instagram», tocarla otra vez (queda sin elegir); elegir «Instagram», pasar a la persona (la pregunta se va), volver a «por fuera» (sin nada elegido); marcar sin contestar → el aviso de hoy. Sin aceptadas: la pregunta al abrir, debajo de la nota y antes de «Marcar adoptada»; marcar con una opción → el aviso de hoy (US1-AS1…AS6)

### Implementación de US1

- [X] T009 [US1] `src/lib/adoptions/handover-request.ts`: `handoverRequest({ petId, attemptId, choice, foundVia })` según contracts §Lo que manda la pantalla
- [X] T010 [US1] `markPetAdopted` en `src/actions/adoptions.ts` pasa `parsed.data.foundVia` a `handoverEvent`, solo con `done`, como hoy (research R2)
- [X] T011 [US1] `useHandover` en `src/hooks/use-handover.ts`: estado `foundVia` (`''`), `chooseFoundVia`; `choose` lo vacía; `confirm` arma la entrada con `handoverRequest`; lo que no llegó deja lo elegido (research R4)
- [X] T012 [P] [US1] `adoptions.handover.found_via.{title, hint, options.*}` en `messages/es.json`: título y opciones palabra por palabra de la historia, `options.seen_here` con `{name}`, el `hint` escrito con `sin-slop` (research R5)
- [X] T013 [P] [US1] `foundViaTexts(name)` en `src/app/[locale]/_components/handover-texts.ts`, con `getTranslations`
- [X] T014 [US1] `src/components/adoptions/found-via-field.tsx`: `RadioGroup` `column`, `clearable`, `legendSize` `sm`, `hint`, controlado y `disabled` mientras marca (plan §Diseño)
- [X] T015 [US1] `HandoverForm` en `src/components/adoptions/handover-form.tsx`: recibe `texts.foundVia`; en el camino por fuera, `FoundViaField` después de la `FormNote` (o como primero del bloque sin aceptadas) y antes del `SaveFailedStrip` y del botón (plan §Diseño, FR-005)
- [X] T016 [US1] `src/app/[locale]/(app)/mis-animales/[id]/adoptado/page.tsx`: pasa `foundVia: await foundViaTexts(named.name)` a `HandoverForm`

**Checkpoint**: US1 se prueba sola (quickstart pasos 1–3).

---

## Fase 3: User Story 2 — Cada cría y cada entrega trae su propia pregunta (P2)

**Goal**: la pregunta aparece en cada cría con su nombre y en cada entrega nueva, sin recordar nada.

**Independent Test**: spec.md US2.

### Tests de US2

- [X] T017 [P] [US2] Caso nuevo en `src/lib/analytics/adoption-events.test.ts`: una cría por fuera con `facebook` → `litter: true` y `found_via: 'facebook'` (US2-AS1)
- [X] T018 [US2] Caso nuevo en `tests/e2e/handover.spec.ts`: marcar una cría sembrada por fuera → la cuarta opción dice «Vio a {nombre de la cría} en este sitio y me escribió directo» y ninguna viene elegida (US2-AS2)

### Implementación de US2

- [X] T019 [US2] Revisar que `handoverPath` de una cría y de un animal vuelto a publicar abre la pantalla con un intento nuevo y la pregunta vacía; sin cambios de código si es así (plan §Cómo se construye)

**Checkpoint**: US2 se prueba sola (quickstart paso 4).

---

## Fase 4: User Story 3 — Leer contra qué canal se pierde una adopción (P3)

**Goal**: docs/03 dice cómo se lee el canal al lado de las adopciones por el sitio.

**Independent Test**: spec.md US3.

- [X] T020 [US3] Lectura 15 en `docs/03-mvp-features.md` §Métricas de éxito «Cómo se leen», después de la 14 (research R7, FR-023), escrita con `sin-slop`

**Checkpoint**: la lectura existe y nombra `to`, `found_via` y desde cuándo cuenta.

---

## Fase 5: Pulido

- [ ] T021 [P] `docs/06-i18n.md`: fila del glosario «por dónde te encontró» (`found via`; lo que se cuenta, `FoundViaAnswer`), distinta de la encuesta (`survey`) y de la pregunta al borrar
- [ ] T022 [P] `docs/10-design-system.md`: fila de `FoundViaField` y la de `HandoverForm` con la pregunta en el camino por fuera
- [ ] T023 Revisar con `sin-slop` todos los textos nuevos de `messages/es.json` y de docs
- [ ] T024 `vercel:react-best-practices` sobre los TSX tocados
- [ ] T025 `pnpm gates:affected`; Stryker al 100 % en `found-via.ts`, `handover-request.ts`, `adoption.ts` y `adoption-events.ts`
- [ ] T026 Capturas: `node scripts/walk.mjs --story por-donde-llego-adoptante --user` de la pantalla de marcar adoptado con y sin aceptadas, a 390 y 1280 px (quickstart paso 5)

---

## Dependencias

- Fase 1 → Fase 2 → Fase 3; la Fase 4 depende solo de que el nombre `found_via` esté fijo (T003).
- Dentro de US1: T009 antes de T011; T012 y T013 antes de T015 y T016; T014 antes de T015.
- Pulido al final.

## En paralelo

- Fase 1: T001, T002 y T003.
- US1: T004–T007 juntas; T012 y T013 juntas.
- Pulido: T021 y T022.

## Estrategia

MVP = Fase 1 + US1: con eso el canal ya se mide. US2 suma las pruebas de cría y entrega nueva; US3,
la lectura. Un solo PR (constitución §II).
