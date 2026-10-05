---
description: "Tareas de la historia #95 — Que la ficha y el listado de animales abran livianos en el teléfono"
---

# Tasks: Que la ficha y el listado de animales abran livianos en el teléfono

**Input**: `specs/011-ficha-listado-livianos/` — spec.md, plan.md (§Diseño, §Cómo se aliviana,
§Qué se testea), research.md (R0–R7), quickstart.md

**Tests**: sí, y solo los que `docs/09` §Qué vale la pena testear justifica. La lista cerrada está
en plan.md §Qué se testea; no se agrega ninguno fuera de ahí, y no se saca ninguno de ahí. Todo lo
que tiene test unitario se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. El freno se escribe primero (Fase 2)
porque mide cada palanca; su cierre (mensajes, partida, portada) es US3. Antes de tocar TSX se abre
`docs/10-design-system.md` (no cambia nada visible); después de varios TSX,
`vercel:react-best-practices`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US3). Preparación, base y pulido no llevan etiqueta

---

## Fase 1: Preparación

**Propósito**: la medición de partida sobre `main`, antes de cambiar código de producto.

- [X] T001 Sumar `scriptWeight(page)` a `tests/e2e/support/web-vitals.ts`: devuelve `{ open, total }` en bytes según research R1 (`transferSize` de los recursos `script` con `startTime < loadEventEnd` para `open`; todos después de `networkidle` + 1 s para `total`)
- [X] T002 Reescribir la medición de `tests/e2e/animales-rendimiento.spec.ts` con `scriptWeight`, midiendo la ficha a la vista, la ficha de un código que no existe, el listado sin filtros, el listado con `?departamento=rocha` y la portada, con anotaciones `rendimiento` de apertura, total, LCP y CLS (sin afirmar el peso todavía); armar con `pnpm build`, correrlo sobre el código de `main` y anotar los valores de partida en `specs/011-ficha-listado-livianos/research.md` §R6 (research R6, R7)

---

## Fase 2: Base compartida

**Propósito**: lo que usan US1 y US2: el hook de «después de abrir» y los textos de error de
`animales/` sin next-intl. Bloquea las fases 3 y 4.

- [X] T003 Crear `src/hooks/use-after-open.ts` con `afterOpen()` (resuelve después de `load` de la ventana, o ya si `document.readyState === 'complete'`, y del siguiente `requestIdleCallback` con `timeout: 1000`, con `setTimeout` donde no existe) y `useAfterOpen(load)` (llama a `load()` cuando `afterOpen()` resolvió y devuelve el módulo o `null`; sin re-pedir en cada render) (research R3)
- [X] T004 Sumar `toListing?: string` a `PublicErrorCopy` en `src/app/[locale]/_components/public-error-copy.tsx` (research R2)
- [X] T005 Crear `src/app/[locale]/(public)/animales/[code]/layout.tsx` con `PublicErrorCopyProvider` (`common.error_screen.title`, `pets.page.load_error`, `common.error_screen.retry`, `pets.page.to_listing` en `toListing`) y cambiar `src/app/[locale]/(public)/animales/[code]/error.tsx` a `usePublicErrorCopy()` sin next-intl (research R2)
- [X] T006 Cambiar `src/app/[locale]/(public)/animales/layout.tsx` a `PublicErrorCopyProvider` con `pets.listing.load_error` y `src/app/[locale]/(public)/animales/error.tsx` a `usePublicErrorCopy()`; sacar de `src/app/[locale]/_components/error-texts-provider.tsx` las claves `pets.listing.load_error`, `pets.page.load_error` y `pets.page.to_listing` si nada más las lee, y corregir su comentario (research R2)

---

## Fase 3: User Story 1 — La ficha abre liviana y todo sigue andando igual (P1) 🎯 MVP

**Objetivo**: ficha y pantallas de animal no disponible ≤ 150 KB de apertura, sin cambio visible;
«Compartir» con aviso y copiar a mano también sin señal después de abrir.

**Prueba independiente**: spec §US1 Independent Test.

### Tests de US1

- [X] T007 [P] [US1] En `tests/e2e/animales.spec.ts`: en una computadora, abrir una ficha, esperar «Compartir», `context.setOffline(true)`, tocar y ver «Enlace copiado»; con el permiso de copiar negado y sin red, ver el camino de copiar a mano (plan §Qué se testea 2; FR-007, FR-013, SC-007)
- [X] T008 [P] [US1] En `tests/e2e/animales.spec.ts`: abrir una ficha con los chunks pedidos después de `load` bloqueados (`page.route` sobre `/_next/static/chunks/**`) y ver que «Compartir» no está a la vista y que nada salta (plan §Qué se testea 3; FR-012)

### Implementación de US1

- [X] T009 [US1] Mover el `ShareButton` de hoy a `src/components/pets/share-button-live.tsx` (`ShareButtonLive`), con `ShareManualSheet` importado de forma estática y una prop `region: 'own' | 'page'` que, en `'own'`, envuelve su `Toast` en su propio `ToastProvider` con las etiquetas que hoy pone la página (research R3)
- [X] T010 [US1] Reescribir `src/components/pets/share-button.tsx` como cáscara: `useAfterOpen(() => import('./share-button-live'))`; mientras es `null`, el mismo `Button` invisible de hoy (`aria-hidden`, `tabIndex=-1`, `invisible`); cuando llegó, `ShareButtonLive` con las mismas props. Mantener la firma de props (más `region`, por defecto `'page'`) para que `my-pet-actions.tsx` y `my-pet-panel.tsx` no cambien
- [X] T011 [US1] En `src/app/[locale]/(public)/animales/[code]/page.tsx`: sacar `ToastProvider`, pasar `region="own"` y las etiquetas del aviso a `ShareButton` (las de `common.toast` que hoy lee la página)
- [X] T012 [US1] Armar y medir con T002 (research R6). Si la ficha o una pantalla de animal no disponible no entra en 150 KB con 2 KB de aire: aplicar research R5.1 (`src/components/pets/gallery-position.tsx` y `src/app/[locale]/_components/stale-images-refresh.tsx` en cáscara + `useAfterOpen`), volver a medir, y si sigue sin entrar aplicar R5.2 (las tres pantallas de error públicas dibujan `ErrorScreen` desde un módulo que llega con `useAfterOpen`). Anotar en research §R6 qué se aplicó y los valores
- [X] T013 [US1] Correr `tests/e2e/animales.spec.ts` entero (ficha, adoptada, sin JavaScript, no publicado, «Compartir» en Mis animales) sin cambiar lo que comprueba, más T007 y T008 (SC-006)

**Checkpoint**: la ficha entra en 150 KB y todo lo de la ficha anda igual, también sin señal.

---

## Fase 4: User Story 2 — El listado abre liviano y se filtra como hoy (P2)

**Objetivo**: listado ≤ 150 KB de apertura, sin cambio visible; un toque temprano no se pierde.

**Prueba independiente**: spec §US2 Independent Test.

### Tests de US2

- [X] T014 [P] [US2] En `tests/e2e/animales.spec.ts`: abrir el listado con los chunks pedidos después de `load` bloqueados, elegir un departamento y aplicar con el botón del formulario: la dirección y los resultados traen el filtro; pedir «Ver más» y ver más animales (plan §Qué se testea 3; FR-011)

### Implementación de US2

- [X] T015 [US2] Armar y medir el listado con T002 después de T006 (que ya le saca next-intl). Si entra en 150 KB con 2 KB de aire, saltar T016 y anotarlo en research §R6
- [X] T016 [US2] Si hace falta (research R4): mover el reducer, los pedidos, el snapshot y la sincronización de la dirección de `src/hooks/use-listing.ts` a `src/app/[locale]/(public)/animales/_components/listing-engine.ts`, cargado con `useAfterOpen`; mientras no llegó, `useListing` devuelve el estado inicial con `hydrated=false` y manejadores que no interceptan el formulario ni el enlace (el camino sin JavaScript). Sin desmontar la vista. Los tests de `src/lib/pets/listing-state.test.ts` y `listing-requests.test.ts` siguen iguales y al 100 % de mutación
- [X] T017 [US2] Si después de T016 el listado sigue sin entrar, aplicar research R5.2 si T012 no lo aplicó, y volver a medir. Anotar en research §R6
- [X] T018 [US2] Correr `tests/e2e/animales.spec.ts` entero (filtros, «Ver más», vacío, sin JavaScript, volver a la ficha y al listado con lo que se había cargado) sin cambiar lo que comprueba, más T014 (SC-006)

**Checkpoint**: el listado entra en 150 KB y se filtra y se pide «Ver más» igual que hoy.

---

## Fase 5: User Story 3 — Un freno que falla si vuelven a engordar (P3)

**Objetivo**: la prueba de rendimiento falla por encima de 150 KB y por encima del total de partida,
y dice qué pantalla y por cuánto.

**Prueba independiente**: spec §US3 Independent Test.

- [X] T019 [US3] En `tests/e2e/animales-rendimiento.spec.ts`: afirmar `open <= 150 * 1024` para la ficha, la ficha de un código que no existe, el listado sin filtros, el listado filtrado y la portada, y otra vez para la ficha y el listado con la sesión del publicador que la prueba ya abre para «Mis animales» (FR-001, FR-003), y `total <=` el valor de partida de T002 para la ficha y el listado, cada una con un mensaje `«<pantalla>: <N> KB de apertura, <M> KB por encima de 150»` (o de total y partida); mantener LCP < 2 500 ms y CLS < 0,05; medir el tiempo desde `loadEventEnd` hasta que «Compartir» está a la vista y afirmar ≤ 1 500 ms; reescribir el comentario de cabecera (ya no «se anota para Ship») (research R7; FR-016 a FR-019)
- [X] T020 [US3] Demostrar el freno (SC-005): sumar a propósito peso de apertura a la ficha, armar, correr T019 y ver el mensaje con la pantalla y los KB de más; sacar el agregado y anotar el mensaje en el PR. No se commitea
- [X] T021 [US3] Comparar la apertura de la portada contra su valor de partida de T002 (FR-005, SC-004) y anotarlo en research §R6

**Checkpoint**: `pnpm e2e` verde con el freno afirmando.

---

## Fase 6: Pulido

- [ ] T022 [P] `docs/07-stack.md` §Presupuesto de performance: **Decisión (2026-10-05, enjambre)** con la medición (apertura hasta `loadEventEnd`, total con tope, en la prueba de rendimiento mientras Lighthouse no mida estas pantallas) y la regla «lo que solo hace falta después de un toque llega después de abrir, con `useAfterOpen`» (plan §Docs)
- [ ] T023 [P] `docs/08-convenciones-codigo.md`: la línea de cáscara + parte viva con `useAfterOpen`, nunca `next/dynamic` para diferir (precarga) (plan §Docs)
- [ ] T024 [P] `docs/known-limitations.md`: KL-57-4 pasa a «(resuelta)» con la historia #95, la fecha y los valores finales; si queda una palanca pendiente (tailwind-merge), como nota de la misma entrada
- [ ] T025 [P] Corregir los comentarios que dejaron de ser ciertos: `src/components/pets/share-button.tsx`, `src/app/[locale]/(public)/animales/layout.tsx`, `src/app/[locale]/_components/error-texts-provider.tsx`, `src/app/[locale]/layout.tsx` (la «única excepción» de next-intl)
- [ ] T026 Capturas con `node scripts/walk.mjs --story ficha-listado-livianos /animales /animales/<código>` en la rama y en `main`, para el design-reviewer: tienen que ser iguales (plan §Diseño)
- [ ] T027 `vercel:react-best-practices` sobre los TSX tocados; `pnpm verify` completo

---

## Dependencias y orden

- Fase 1 → Fase 2 → US1 → US2 → US3 → Pulido. US2 depende de T006 (Fase 2), que le saca next-intl al
  listado; US3 afirma sobre lo que US1 y US2 dejaron.
- Dentro de cada user story, los tests [P] se escriben primero y fallan donde corresponde (T007 y
  T008 con «Compartir» de hoy: T008 falla porque hoy «Compartir» aparece al hidratar).
- T012, T016 y T017 son condicionales: se hacen solo si la medición anterior no entra (research R6).

## Estrategia

MVP = Fases 1 a 3: la ficha, que es lo que se pega en los grupos, ya entra. US2 y US3 completan la
historia en el mismo PR.
