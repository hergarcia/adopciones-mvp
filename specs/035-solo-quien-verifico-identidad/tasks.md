---
description: "Tareas de la historia #285 — Ver solo los animales de quien verificó su identidad, en el listado y en mis avisos"
---

# Tasks: Ver solo los animales de quien verificó su identidad, en el listado y en mis avisos

**Input**: `specs/035-solo-quien-verifico-identidad/` — spec.md, plan.md (§Diseño, §Cómo se
construye), research.md (R1–R9), data-model.md, contracts/interfaces.md, quickstart.md

**Tests**: sí, y solo los de research R9; no se agrega ninguno fuera de ahí ni se saca ninguno de ahí.
Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se abre
`docs/10-design-system.md` (y se carga `frontend-design:frontend-design` si la corrida lo tiene);
antes de tocar la migración o sus tests, `supabase:supabase-postgres-best-practices` si está; todo
texto visible, con `sin-slop`; después de varios TSX, `vercel:react-best-practices`. La migración es
un solo archivo; después de cada cambio, `pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: la columna del aviso, el filtro en las cuatro funciones de la base y la clave nueva en
los tipos, que usan las cuatro partes.

- [ ] T001 Crear `supabase/migrations/20261107120000_identity_only_filter.sql`: borrar `public.claim_pet_alert_mail()`, `private.pet_alert_matches(uuid[], timestamptz)`, `public.create_pet_alert(text[], text[], text[], text[], text[], boolean)` y `public.listed_pets(text[], text[], text[], int4range[], text[], boolean, timestamptz, text, integer, text)`; sumar `pet_alerts.identity_only boolean not null default false`, rehacer `pet_alerts_same_filters_uq` con la columna y actualizar el `comment` de la tabla (data-model.md, research R4)
- [ ] T002 En la misma migración: crear `public.listed_pets` con el cuerpo de `20261104120000_listed_publisher_level.sql` más `p_identity_only boolean default false` y la condición `(not coalesce(p_identity_only, false) or private.publisher_level(s.owner_id) >= 2)`; `revoke all ... from public, anon, authenticated` y `grant execute ... to anon, authenticated` (research R3)
- [ ] T003 En la misma migración: crear `private.pet_alert_matches` y `public.claim_pet_alert_mail` con el cuerpo de `20261102120000_pet_alerts.sql`, pasando `p_identity_only => a.identity_only` y devolviendo `identity_only` después de `neutered_only`; crear `public.create_pet_alert` con `p_identity_only boolean default false`, comparándolo para `duplicate` e insertándolo; los mismos `revoke` y `grant` de antes con las firmas nuevas (data-model.md §Funciones, research R4, R5)
- [ ] T004 `pnpm exec supabase db reset` y `pnpm db:types`
- [ ] T005 `src/lib/pets/listing-query.ts`: `publisher: 'identity'[]` en `ListingFilters`, la entrada `{ key: 'quien-publica', options: ['identity'], values: ['identidad'] }` al final del vocabulario, de `LISTING_FILTERS` y de `NO_FILTERS`, y `readFilters` con `publisher`; `chosen` junta «todas» en «ninguna» solo si el filtro tiene más de una opción (research R1, R2)
- [ ] T006 [P] `src/lib/alerts/filters.ts` (`normalizeAlertFilters` con `publisher`) y `src/lib/supabase/queries/pet-alerts.ts` (`AlertColumns` y `alertFiltersOf` con `identity_only`, `identity_only` en el `select` de `listMyPetAlerts`) para que el tipo compile (data-model.md §Tipos)
- [ ] T007 [P] `tests/db/listing-support.ts` y `tests/db/pet-alerts-support.ts`: sembrar quien publica con nivel 1 (solo teléfono), nivel 2 (identidad) y nivel 3 (identidad y un aval de alguien con nivel 2), con un animal y una camada; aprobar la identidad de alguien y quitar un aval a mitad de una prueba, con los soportes de identidad y avales que ya existen

**Checkpoint**: la base filtra por nivel y guarda el filtro del aviso; los tipos compilan sin pantallas nuevas.

---

## Fase 2: User Story 1 — Filtrar el listado por quien verificó su identidad (P1) 🎯 MVP

**Goal**: el listado tiene «Quien publica» con «Solo de quien verificó su identidad», que deja solo lo
de quien tiene la identidad verificada, viaja en el enlace y se saca con «Sacar los filtros».

**Independent Test**: spec.md US1.

### Tests de US1

- [ ] T008 [P] [US1] `src/lib/pets/listing-query.test.ts`: `quien-publica=identidad` da `publisher: ['identity']` y sobrevive como única opción (no se junta en «ninguna»); `IDENTIDAD`, repetido o en dos claves se lee igual; `quien-publica=todos` y `quien-publica=` se ignoran y dejan los demás filtros; `listingSearch` pone la clave al final; una dirección de antes sigue canónica; `parseAddedOptions('quien-publica.identidad')` da `{ filter: 'publisher', option: 'identity' }` y `quien-publica.otra` nada (FR-007, FR-008, research R1, R2)
- [ ] T009 [P] [US1] `tests/db/listed-pets.test.ts`: con `p_identity_only` vienen los animales y la camada de nivel 2 y 3 y no los de nivel 1, tampoco con un pedido de verificación en revisión o rechazado; el total cuenta solo lo filtrado; quitar el único aval deja al de nivel 3 adentro; aprobar la identidad de uno de nivel 1 lo trae en la lectura siguiente; con otros filtros se suman; el cursor sigue filtrando; con `false` o sin el parámetro la respuesta es la de hoy; `suggested_pets` responde después de migrar (FR-002–FR-006, FR-022, SC-001, SC-002)
- [ ] T010 [US1] `tests/e2e/animales.spec.ts`: marcar «Solo de quien verificó su identidad», ver solo las tarjetas de la persona sembrada con identidad y el total, recargar el enlace con la casilla marcada y «Sacar los filtros» que la desmarca (FR-001, FR-007, FR-009, SC-003)

### Implementación de US1

- [ ] T011 [US1] `src/lib/supabase/queries/listed-pets.ts`: `listListedPets` manda `p_identity_only: filters.publisher.length > 0`; `listProfilePets` no lo manda (FR-012)
- [ ] T012 [P] [US1] `messages/es.json`: `pets.listing.legends.publisher` «Quien publica», `pets.listing.options.publisher.identity` «De quien verificó su identidad» y `pets.listing.identity_only` «Solo de quien verificó su identidad», con `sin-slop` (data-model.md §Textos)
- [ ] T013 [US1] `src/app/[locale]/(public)/animales/_components/listing-texts.ts` y `FilterTexts` en `src/components/pets/listing-filters.tsx`: la `legend`, la opción y `identityOnly`
- [ ] T014 [US1] Crear `src/components/pets/publisher-filter.tsx` (`fieldset` con `legend` `sr-only` hasta 1024 px y `groupLabel` desde ahí, `Checkbox` con `name`, `value` y `checked`, `onChange` vacío) y montarlo en `ListingFilters` después de `DepartmentFilter`, con `filterKey('publisher')` y `valueOf('publisher', 'identity')` (plan §Diseño, research R7)
- [ ] T015 [US1] Confirmar en el navegador que una falla al elegir el filtro deja la casilla desmarcada con los animales de antes y el mensaje de siempre, y que el vacío filtrado ofrece «Sacar los filtros» y «Avisame cuando haya uno así»; si la casilla quedara marcada, corregirlo en `useListing` como para cualquier filtro (FR-010)
- [ ] T016 [P] [US1] `docs/10-design-system.md`: la fila de `ListingFilters` suma «Quien publica» después del departamento y una fila para `PublisherFilter`, con **Decisión (2026-11-02, enjambre)** y su motivo (research R7)
- [ ] T017 [P] [US1] `docs/06-i18n.md`: el filtro en el glosario («Solo de quien verificó su identidad», en código `publisher` / `identity`; nunca «verificados» a secas, que incluiría el teléfono)

**Checkpoint**: el filtro anda en el listado con y sin JavaScript, solo y con otros.

---

## Fase 3: User Story 2 — Guardar un aviso con el filtro (P2)

**Goal**: «Avisame cuando haya uno así» guarda el filtro, «Mis avisos» lo nombra y un aviso con el
filtro y otro sin él son dos.

**Independent Test**: spec.md US2.

### Tests de US2

- [ ] T018 [P] [US2] `src/lib/alerts/alert-name.test.ts`: «Perros en Montevideo, de quien verificó su identidad»; con solo el filtro, «Todos los animales en adopción, de quien verificó su identidad»; con solo hembras, «Perras chicas, de quien verificó su identidad»; sin el filtro, igual que hoy (FR-015, research R6)
- [ ] T019 [P] [US2] `src/lib/alerts/filters.test.ts`: `normalizeAlertFilters` deja `publisher: ['identity']` y descarta un valor desconocido; `countFilters` cuenta el filtro como uno (FR-026)
- [ ] T020 [P] [US2] `src/lib/schemas/pet-alert.test.ts`: acepta `publisher: ['identity']` y `[]`; rechaza `['otra']` y la falta de la clave con `alerts.errors.failed`
- [ ] T021 [P] [US2] `tests/db/pet-alerts-rules.test.ts`: con y sin el filtro, mismos otros filtros, dan dos `created`; repetir el del filtro da `duplicate`; con 3 avisos, uno con el filtro da `limit`; un aviso viejo (sin `p_identity_only`) queda en `false` (FR-014, FR-016, FR-017)
- [ ] T022 [P] [US2] `tests/db/pet-alerts-privacy.test.ts`: suma `identity_only` a lo que el visitante y otra persona intentan leer, sin resultado; se borra con el aviso y con la cuenta (FR-023)
- [ ] T023 [US2] `tests/e2e/avisos.spec.ts`: sin sesión, con el filtro y otros marcados, «Avisame cuando haya uno así», entrar y volver al listado con el aviso creado y en «Mis avisos» el nombre con «de quien verificó su identidad», y «Ver en el listado» con la casilla marcada (FR-013, FR-015)

### Implementación de US2

- [ ] T024 [US2] `src/lib/schemas/pet-alert.ts`: `publisher: z.array(z.literal('identity'))`
- [ ] T025 [US2] `src/lib/supabase/queries/pet-alerts.ts`: `createPetAlertRecord` manda `p_identity_only: filters.publisher.length > 0`
- [ ] T026 [US2] `src/lib/alerts/alert-name.ts` (`identityOnly` en `AlertNameWords`, la suma con coma, «ningún filtro» sin contarlo), `src/lib/alerts/alert-name-texts.ts` y `alerts.name.identity_only` «de quien verificó su identidad» en `messages/es.json`, con `sin-slop` (research R6)

**Checkpoint**: el aviso se guarda con el filtro, también al volver de entrar, y «Mis avisos» lo nombra.

---

## Fase 4: User Story 3 — El correo de las 8 respeta el filtro (P3)

**Goal**: un aviso con el filtro trae solo lo nuevo de quien tenía la identidad verificada a la hora del
correo, y lo que quedó afuera no llega después.

**Independent Test**: spec.md US3.

### Tests de US3

- [ ] T027 [P] [US3] `tests/db/pet-alerts-mail.test.ts`: con un aviso con el filtro y otro sin él y un animal nuevo de nivel 1 y otro de nivel 2, la corrida trae para el primero solo el de nivel 2 (y `identity_only = true`) y para el segundo los dos; una camada de nivel 3 llega como una; aprobar la identidad de quien quedó afuera y correr al día siguiente no trae ese animal; si lo único nuevo es de nivel 1, el aviso con el filtro no trae nada y su período se cierra (FR-018, FR-019, SC-005)
- [ ] T028 [P] [US3] `src/lib/alerts/mail-parts.test.ts`: una parte con el filtro lleva el nombre con «de quien verificó su identidad» y su enlace con `quien-publica=identidad`; el resto de la parte, igual (FR-020)

### Implementación de US3

- [ ] T029 [US3] Revisar `src/lib/email/send-pet-alert-mail.ts` y `src/lib/alerts/mail-parts.ts`: el nombre y el enlace salen de `alertName` y `listingHref` con los filtros de `alertFiltersOf`; si algún lugar arma los filtros a mano, pasarlo a esas funciones (research R5)

**Checkpoint**: el correo respeta el filtro sin cambiar la hora, el tope ni el armado.

---

## Fase 5: User Story 4 — Medir si quien adopta elige ver solo a quien verificó su identidad (P4)

**Goal**: el filtro se mide con su opción propia, el aviso cuenta un filtro más y docs/03 dice cómo se
lee.

**Independent Test**: spec.md US4.

### Tests de US4

- [ ] T030 [P] [US4] `src/lib/analytics/listing-events.test.ts`: marcar el filtro da `listing_filter_used` `{ filter: 'publisher', option: 'identity' }`; desmarcarlo o abrir un enlace que ya lo trae, nada (FR-025, SC-007)

### Implementación de US4

- [ ] T031 [US4] `docs/03-mvp-features.md` §Métricas de éxito, «Cómo se leen», al lado de la lectura 5: `listing_filter_used` con `filter` = `publisher` sobre `listing_viewed`; los avisos con el filtro, `select count(*) from public.pet_alerts where identity_only`, sobre el total, sin traer personas; siguiendo esas visitas, `pet_viewed` con `origin` = `listing`, `apply_tapped` y `application_sent`; y la advertencia de 3 a 5 rescatistas, con `sin-slop` (FR-029)

**Checkpoint**: la medición dice qué parte de quien busca elige el filtro, sin ningún momento nuevo.

---

## Fase 6: Pulido

- [ ] T032 `node scripts/walk.mjs --story 285-solo-quien-verifico-identidad` con el listado filtrado (solo, con otros, vacío) y `--user` en «Mis avisos», a 390 y 1280 px (SC-006)
- [ ] T033 `pnpm gates:affected` verde; Stryker al 100 % sobre lo que tiene test
- [ ] T034 Revisar con `vercel:react-best-practices` los TSX tocados y con `sin-slop` todos los textos nuevos

---

## Dependencias

- La Fase 1 bloquea todo. US1 → US2 (el aviso necesita el filtro en el listado para ofrecerse) → US3
  (el correo necesita avisos con el filtro). US4 depende solo de US1.
- Dentro de cada US, las pruebas se escriben primero y fallan antes de implementar.
- [P] marca archivos distintos sin dependencias pendientes.
