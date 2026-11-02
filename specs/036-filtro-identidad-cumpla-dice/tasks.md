---
description: "Tareas de la historia #287 — Que el filtro «Solo de quien verificó su identidad» y sus avisos cumplan lo que dicen"
---

# Tasks: Que el filtro «Solo de quien verificó su identidad» y sus avisos cumplan lo que dicen

**Input**: `specs/036-filtro-identidad-cumpla-dice/` — spec.md, plan.md (§Diseño, §Cómo se
construye), research.md (R1–R9), data-model.md, contracts/interfaces.md, quickstart.md

**Tests**: sí, y solo los de research R9; no se agrega ninguno fuera de ahí ni se saca ninguno de ahí.
Todo lo que tiene test se sostiene al 100 % de mutación. Las dos pruebas de `listing-state.test.ts`
que fijaban lo contrario se reescriben porque la regla cambió (spec FR-001), no para que el código
pase.

**Organización**: por user story, en orden de prioridad. Antes de tocar JSX se abre
`docs/10-design-system.md` (y se carga `frontend-design:frontend-design` si la corrida lo tiene);
todo texto visible, con `sin-slop` (esta historia no suma textos); después de varios TSX,
`vercel:react-best-practices`. No hay base de datos ni dependencias nuevas.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Base y pulido no llevan etiqueta

---

## Fase 1: Base

**Propósito**: nada que bloquee a las tres partes. Las decisiones del enjambre de la historia ya
están en `docs/03-mvp-features.md` §3 en esta rama (etapa Spec).

- [ ] T001 Confirmar en la rama que `pnpm exec supabase start` y `pnpm exec supabase db reset` levantan la semilla con personas de nivel 1 y nivel 2 con animales a la vista en Montevideo (los usan los dos pasos e2e y el quickstart)

**Checkpoint**: entorno listo; cada user story arranca por su cuenta.

---

## Fase 2: User Story 1 — El listado nunca dice un filtro que no cumple (P1) 🎯 MVP

**Goal**: cuando falla el pedido de un filtro, las casillas, la dirección y «Sacar los filtros»
vuelven a los del listado que se ve, con el mensaje de hoy; «Reintentar» pide lo que se había marcado.

**Independent Test**: spec.md US1.

### Tests de US1

- [ ] T002 [US1] `src/lib/pets/listing-state.test.ts`: la falla de un filtro devuelve `filters` a `shownFilters` y guarda `wanted` con lo marcado; con dos pedidos seguidos (el primero sin llegar), la falla del último vuelve a lo que se ve y no al intermedio; sacar un filtro que falla lo vuelve a marcar; un `loaded` de filtro y uno de renovación dejan `shownFilters = filters`; `restored` deja los dos iguales a los de la dirección; desde un vacío (cero cards, sin falla) la falla es `filter` y no `open`; con la falla al abrir, marcar otro filtro y fallar sigue siendo `open` con los filtros del enlace; la falla de «Ver más» no tiene `wanted` ni cambia los filtros; `retryFilters` da `wanted` después de una falla de filtro y `filters` si no; `canLoadMore` da `true` después de una falla de filtro con otra tanda y `false` mientras llega un filtro. Reescribir «una falla de un filtro deja las cards de antes, marcadas como de los filtros anteriores» y «sin cards, una falla es la de abrir el listado» con la regla nueva (FR-001, FR-004, FR-005, FR-009, research R1, R3, R4, R5)
- [ ] T003 [US1] `tests/e2e/animales.spec.ts`: un paso que abre `/animales` sin filtros, corta con `page.route` el pedido del listado que lleva `quien-publica=identidad`, marca «Solo de quien verificó su identidad» y ve la tira de la falla, la casilla desmarcada, la dirección sin `quien-publica`, sin «Sacar los filtros» y la tarjeta de un animal de una persona sembrada con solo el teléfono; después suelta la ruta, toca «Reintentar» y ve la casilla marcada y la dirección con el filtro (spec US1-AS1, US1-AS4, FR-001–FR-005, SC-001)

### Implementación de US1

- [ ] T004 [US1] `src/lib/pets/listing-state.ts`: `shownFilters` en `ListingState`, `wanted` en `failure`, las transiciones de data-model.md §Estado del listado en `listingReducer` (el `on` de la falla es `open` solo si la falla anterior lo era), `canLoadMore` sin la exclusión de `failure.on === 'filter'` y `retryFilters(state)`; reescribir los comentarios de `ListingState.filters` y del reducer que decían que lo marcado podía no ser lo que muestran las cards (research R1, R3, R4, R5; depende de T002)
- [ ] T005 [US1] `src/hooks/use-listing.ts` (US1-AS7, FR-006: la medición queda como hoy): el efecto que escribe la dirección corre con `hydrated && pending === 'none'` aunque haya falla, con `listingHref(state.filters, shownFor(cards.length))`; `retry` toma `retryFilters(state)`, reescribe la dirección con esos filtros y corre `run('filter', …)` sin `added`; `applyFilters` sigue calculando `added` contra `state.filters` como hoy (research R2, R3, R6; depende de T004)
- [ ] T006 [US1] `src/app/[locale]/(public)/animales/_components/listing-controller.tsx`: el estado inicial suma `shownFilters: filters`; con falla de filtro y cero cards se dibuja el vacío de los filtros que quedaron, con la tira encima y el total (research R4, plan §Diseño; depende de T004)
- [ ] T007 [US1] `docs/10-design-system.md`: la fila de `ListingController` dice que en la falla de un filtro las casillas y la dirección vuelven a las de lo que se ve, «Sacar los filtros» solo si queda alguno y «Reintentar» pide lo que se había marcado, con **Decisión (2026-11-02, enjambre)** citando #287 (plan §Diseño)

**Checkpoint**: US1 sola ya evita que el listado diga un filtro que no cumple; T002 y T003 en verde.

---

## Fase 3: User Story 2 — El correo de las 8 trae la parte del aviso con el filtro (P2)

**Goal**: un animal que coincide con un aviso con el filtro y con otro sin él va en la parte del
aviso con el filtro; entre varios con el filtro, en el más viejo.

**Independent Test**: spec.md US2.

### Tests de US2

- [ ] T008 [US2] `src/lib/alerts/mail-parts.test.ts`: con «Perros en Montevideo» y, más nuevo, el mismo con `publisher: ['identity']`, el animal que trae los dos va en el más nuevo y el que trae solo el viejo queda en el viejo (US2-AS1); si los dos los traen los dos, sale solo la parte con el filtro (US2-AS2); con dos avisos con el filtro, va en el más viejo (US2-AS3); sin ninguno con el filtro, en el más viejo, como hoy (US2-AS4); una camada sigue la misma regla (US2-AS5); lo que no entra en los 6 de la parte con el filtro no pasa a la otra y `mailNewCount` lo cuenta una vez (US2-AS6, FR-014); el orden de las partes sigue siendo el de los avisos (FR-015). Actualizar el encabezado `Covers:` con #287 (research R7, R9)

### Implementación de US2

- [ ] T009 [US2] `src/lib/alerts/mail-parts.ts`: `alertMailParts` decide primero el dueño de cada `kind:code` (el aviso más viejo con `filters.publisher` que incluye `identity`; si ninguno, el más viejo que lo trae) y después arma cada parte con lo suyo, el mismo orden, el mismo corte y el mismo `total`; reescribir el comentario de la regla (research R7, data-model.md §Reparto; depende de T008)

**Checkpoint**: US2 en verde sin tocar la base ni el armado del correo.

---

## Fase 4: User Story 3 — La confirmación del aviso con filtros marcados en la página (P3)

**Goal**: después de pedir un aviso con filtros marcados en la página, la respuesta de hoy («Te vamos
a avisar por correo.», «Ya tenés este aviso.» o el máximo) queda en el lugar del botón.

**Independent Test**: spec.md US3.

### Tests de US3

- [ ] T010 [US3] `tests/e2e/avisos.spec.ts`: un paso que entra con una persona sembrada (con `signIn` de `support/pet-owner`), abre `/animales` sin filtros, marca «Perro» y «Solo de quien verificó su identidad», toca «Avisame cuando haya uno así», ve «Te vamos a avisar por correo.» con «Mis avisos» y sin el botón, marca otro filtro y ve el botón de nuevo, y en `/mis-avisos` ve el aviso. Correrlo antes de T011 y anotar en el commit que falla en `main` (spec US3-AS1, US3-AS5, FR-016, FR-017, FR-019, research R8, R9)

### Implementación de US3

- [ ] T011 [US3] `src/actions/pet-alerts.ts`: `createPetAlert` deja de llamar a `revalidatePath(MY_ALERTS_PATH)` y el comentario dice por qué (la revalidación vuelve a dibujar el listado con la dirección nueva y lo remonta); `deletePetAlert` no cambia. Si T010 sigue fallando, buscar la causa antes de pasar al plan B de research R8 (depende de T010)
- [ ] T012 [US3] `docs/10-design-system.md`: la fila de `AlertOffer` suma que la respuesta se queda con los filtros marcados en la página igual que con los del enlace (plan §Diseño)

**Checkpoint**: las tres partes andan por separado; los dos pasos e2e en verde.

---

## Fase 5: Pulido

- [ ] T013 `pnpm gates:affected` en verde: lint, typecheck, las pruebas tocadas y Stryker al 100 % sobre `listing-state.ts` y `mail-parts.ts`; un mutante equivalente se anota en su línea con el motivo
- [ ] T014 Capturas con `node scripts/walk.mjs --story 287-filtro-identidad-cumpla-dice` del listado con la falla de un filtro y de la confirmación del aviso, a 390 y 1280 px (spec SC-005, quickstart.md)
- [ ] T015 `vercel:react-best-practices` sobre `use-listing.ts` y `listing-controller.tsx`, y recorrer quickstart.md de punta a punta

---

## Dependencias

- Fase 1 no bloquea nada de código. US1, US2 y US3 tocan archivos distintos y se pueden hacer en
  cualquier orden; se construyen en orden de prioridad.
- Dentro de US1: T002 → T004 → T005, T006; T003 y T007 en cualquier momento después de T004.
- Dentro de US2: T008 → T009.
- Dentro de US3: T010 → T011 → T012.
- Pulido al final.

## Paralelo

- T007 y T012 tocan el mismo archivo (`docs/10`): uno después del otro.
- T008–T009 (US2) pueden ir en paralelo con US1 entera: archivos distintos.
