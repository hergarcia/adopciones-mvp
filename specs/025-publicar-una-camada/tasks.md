---
description: "Tareas de la historia #205 — Publicar una camada: las crías de una madre en una sola publicación"
---

# Tasks: Publicar una camada: las crías de una madre en una sola publicación

**Input**: `specs/025-publicar-una-camada/` — spec.md, plan.md (§Diseño, §Qué se testea),
research.md (R1–R12), data-model.md, contracts/routes.md, quickstart.md

**Tests**: sí, y solo los de plan.md §Qué se testea; no se agrega ninguno fuera de ahí ni se saca
ninguno de ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de escribir JSX o CSS se carga
`frontend-design:frontend-design` y se abre `docs/10-design-system.md`; antes de tocar la
migración o sus tests, `supabase:supabase-postgres-best-practices`; todo texto visible, con
`sin-slop`; después de varios TSX, `vercel:react-best-practices`. La migración es un solo archivo
que cada fase completa; después de cada cambio, `pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US5). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: las tablas, las columnas y las piezas que todas las user stories usan.

- [X] T001 Crear `supabase/migrations/<ts>_litters.sql` con `public.litters` (columnas, checks, índices, RLS de lectura de la dueña, `touch_updated_at`), el código del pozo `pet_codes` con sus triggers de asignar y no cambiar (research R3), y en `pets` las columnas `litter_id`, `name_key` y la restricción diferida `pets_litter_name_unique` con su índice (data-model.md)
- [X] T002 En la misma migración: `pet_photos.litter_id` con los checks y el único diferido de data-model.md, y `pet_reviews.litter_id` con `pet_id` nullable y el check de uno solo (R7, R8)
- [X] T003 En la misma migración: `private.litter_is_shown` y `private.litter_available_count` (R4, R5); el rechazo `litter_young` en `change_pet_status`, `delete_pet`, `save_pet`, renovar, volver a publicar y `create_pet_renewal_link` (R2); que `pets_review_on_insert` se salte las crías
- [X] T004 `pnpm exec supabase db reset` y `pnpm db:types`; `src/lib/litters/types.ts` con los tipos de dominio de la camada y la cría, y `src/lib/litters/paths.ts` (`litterPath`, `litterEditPath`)
- [X] T005 [P] `tests/db/litter-support.ts`: sembrar una camada con N crías para una persona dada, con fotos, sobre `tests/db/pet-support.ts`
- [X] T006 [P] Namespace `litters` vacío en `messages/es.json` y el gate que rechaza «cachorro» y «gatito» bajo `litters.*` en `src/lib/litters/litter-words.test.ts` (FR-051; `tests/gates/` lo cuida `guard-rules` y no lo toca el enjambre)

**Checkpoint**: la base existe y los tipos están generados.

---

## Fase 2: User Story 1 — Publicar una camada y verla en Mis animales (P1) 🎯 MVP

**Goal**: con nivel 1, publicar una camada de 2 a 10 crías y verla como grupo en «Mis animales».

**Independent Test**: spec.md US1.

### Tests de US1

- [X] T007 [P] [US1] `src/lib/schemas/litter.test.ts`: lo común obligatorio, nombre 30 y descripción 2000, cría con nombre 30, sexo obligatorio, descripción 300, 0–5 fotos, 2–10 crías al publicar y 1–10 al guardar, fecha de hoy en adelante solo si cambió, vías de contacto rechazadas en los cuatro textos
- [X] T008 [P] [US1] `src/lib/litters/young-names.test.ts`: el primer «Cría N» libre después de quitar una, y los repetidos con mayúsculas y espacios
- [X] T009 [P] [US1] `src/lib/litters/single-young-seed.test.ts`: la semilla del animal con lo propio primero, lo común de respaldo y sin fecha de entrega
- [X] T010 [P] [US1] `tests/db/litters-rules.test.ts` (parte publicar): idempotencia por intento y por `key` de cría, 1 y 11 crías rechazadas, nombres repetidos rechazados, fecha pasada rechazada, sin nivel 1 rechazado, fotos de otra persona rechazadas, las crías nacen con lo común copiado, `available` e `infinity`, y las funciones del ciclo de vida rechazan una cría; borrar la cuenta borra camadas, crías y fotos
- [X] T011 [P] [US1] Ampliar el test del ordinal en `src/actions/` o `src/lib/analytics/`: una camada suma una publicación (FR-049)

### Implementación de US1

- [X] T012 [US1] En la migración: `public.publish_litter` y `public.my_litters` con sus grants (R6, data-model.md); `db reset` y `db:types`
- [X] T013 [P] [US1] `src/lib/schemas/litter.ts` (un schema compartido cliente y servidor, sobre las reglas de `src/lib/pets/rules.ts`)
- [X] T014 [P] [US1] `src/lib/litters/young-names.ts` y `src/lib/litters/single-young-seed.ts`
- [X] T015 [US1] `src/lib/supabase/queries/litters.ts` (`publishLitter`, `listMyLitters`, `findMyLitterByNameAndSpecies`) y `countMyPublications` en `src/lib/supabase/queries/pets.ts`
- [X] T016 [US1] `src/actions/litters.ts`: `publishLitter` y `findLitterDuplicate` con `ActionResult` y claves `litters.errors.*`; el ordinal de `src/actions/pets.ts` pasa a `countMyPublications`
- [X] T017 [US1] `src/lib/analytics/events.ts`: `litter` y `young` en `pet_publish_started`, `pet_published`, el abandono y `pet_edited` (R11)
- [X] T018 [US1] Extraer `PetTraitsFields` de `src/components/pets/pet-fields.tsx`; `PetFields` queda como `PetTraitsFields` + nombre + sexo, sin cambio visible
- [X] T019 [P] [US1] `src/components/forms/delivery-date-field.tsx` (`DeliveryDateField`)
- [X] T020 [US1] `src/components/litters/`: `YoungFields`, `YoungList`, `AddYoungButton`, `SingleYoungDialog`; al publicar, quitar una cría es inmediato y sin confirmación (todavía no tiene solicitudes), `LitterForm` (plan.md §Diseño, estados incluidos)
- [X] T021 [US1] `src/hooks/use-litter-draft.ts` o `useFormDraft` compartido con `usePetDraft` (R10), con clave propia
- [X] T022 [US1] `PetForm` acepta una semilla inicial con fotos preparadas (R9), sin cambio para quien publica un animal
- [X] T023 [US1] `src/components/pets/publish-kind-choice.tsx` (`PublishKindChoice`) y `PublishFlow` en `src/app/[locale]/(app)/mis-animales/publicar/`: sin `tipo`, la pregunta; con `tipo`, el formulario; «Publicarla como un animal» cambia al formulario del animal con la semilla y `history.replaceState`
- [X] T024 [US1] «Mis animales»: `LitterYoungSummary` y `MyLitterActions` (en US1 sin acciones; «Ver ficha» y «Compartir» llegan en US2 y «Editar» en US4), y `MyPetsGrid` recibe animales y camadas mezclados por fecha, en `src/app/[locale]/(app)/mis-animales/page.tsx`; sin camadas, ningún grupo
- [X] T025 [US1] Textos `litters.choice`, `litters.form`, `litters.young`, `litters.my`, `litters.errors` en `messages/es.json`, con `sin-slop`
- [X] T026 [US1] `pnpm gates:affected`

**Checkpoint**: US1 se prueba sola: se publica y se ve en «Mis animales».

---

## Fase 3: User Story 2 — La ficha de la camada, pedir una cría y compartirla (P2)

**Goal**: la ficha pública con sus crías y «Quiero adoptar» por cría, el enlace fijo y la vista previa.

**Independent Test**: spec.md US2.

### Tests de US2

- [X] T027 [P] [US2] `tests/db/litters-privacy.test.ts`: anónimo, persona cualquiera, bloqueada y dueña contra `litter_by_code`, `litter_share_card` y las fotos en storage (de la camada y de una cría), con publicador sin nivel 1, suspendido, dada de baja e inexistente; lectura directa de `litters` y de las crías por otra persona; `pet_by_code` de una cría devuelve `litter_code` (SC-003)
- [X] T028 [P] [US2] Ampliar `tests/db/applications-submit.test.ts` o `applications-level.test.ts`: pedir una cría con el nivel de la camada, la dueña no pide la suya, una cría de camada oculta o dada de baja no se pide
- [X] T029 [P] [US2] `src/lib/litters/delivery-date.test.ts`: visible hasta el final del día de Uruguay, oculta desde el siguiente

### Implementación de US2

- [X] T030 [US2] En la migración: `public.litter_by_code`, `public.litter_share_card`, `pet_by_code` con `litter_code` (se borra y se recrea con sus grants) y las policies de storage ensanchadas (`pet_photo_object_listed`) (R3, R5); `db reset` y `db:types`
- [X] T031 [P] [US2] `src/lib/litters/delivery-date.ts`
- [X] T032 [US2] `getLitterByCode` y `getLitterShareCard` en `src/lib/supabase/queries/litters.ts`; la portada de una cría sin fotos cae en la de su camada donde el cuestionario y «Mis solicitudes» muestran la foto del animal
- [X] T033 [US2] `src/components/litters/`: `LitterSheet`, `LitterCountLine`, `DeliveryDateLine`, `YoungCard`; `ApplyAction` con la variante sin tirita para las crías; `PetUnavailable` y `PetNotFound` reciben sus textos por props
- [X] T034 [US2] `src/app/[locale]/(public)/camadas/[code]/` con `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `generateMetadata` con `litters.meta` y `imagen/route.tsx` con `PetShareImage`
- [X] T035 [US2] `src/app/[locale]/(public)/animales/[code]/page.tsx`: el código de una cría redirige a su camada
- [X] T036 [US2] «Ver ficha» y «Compartir» en `MyLitterActions`; `HiddenFromPublicNotice` en la ficha de la dueña sin teléfono confirmado
- [X] T037 [US2] `pet_viewed` y los momentos de pedir con `litter` (R11)
- [X] T065 [US2] `/solicitar/[code]` con una cría que ya no está, al abrir o al mandar: el texto `litters.page.young_gone` y el camino a la ficha de la camada, cuyo código llega en el enlace del botón (`?camada=`), sin perder lo respondido en pantalla (FR-032)
- [X] T066 [US2] Ampliar `tests/e2e/animales-rendimiento.spec.ts` con la ficha de una camada de 10 crías: LCP < 2,5 s y el mismo peso de apertura que la ficha de un animal (SC-004)
- [X] T038 [US2] Textos `litters.page`, `litters.meta` con `sin-slop`
- [ ] T039 [US2] `pnpm gates:affected`

**Checkpoint**: US2 se prueba sobre una camada publicada (US1 o sembrada).

---

## Fase 4: User Story 3 — La camada en el listado como una sola tarjeta (P3)

**Goal**: una tarjeta por camada en el listado y en la portada, con su recuento y los filtros.

**Independent Test**: spec.md US3.

### Tests de US3

- [X] T040 [P] [US3] Ampliar `tests/db/listed-pets.test.ts`: una fila por camada con `young_count` y `available_count`, el total la cuenta una vez (SC-002), sexo por cría, el resto por la camada, ninguna cría como animal suelto, cursor estable mezclado, camada oculta fuera
- [X] T041 [P] [US3] Ampliar el test de `src/lib/pets/listed-card-view.ts` (o crearlo): la línea de recuento y el `href` según `kind`

### Implementación de US3

- [X] T042 [US3] En la migración: `public.listed_pets` se borra y se recrea con la unión y las columnas nuevas (R4); `db reset` y `db:types`
- [X] T043 [US3] `src/lib/supabase/queries/listed-pets.ts` y `src/lib/pets/listed-card-view.ts` con `kind`; la portada del sitio usa lo mismo
- [X] T044 [US3] Texto `litters.card` con plurales, con `sin-slop`
- [X] T045 [US3] `pnpm gates:affected`

**Checkpoint**: US3 se prueba con camadas sembradas.

---

## Fase 5: User Story 4 — Editar la camada (P4)

**Goal**: corregir lo común, agregar y quitar crías, con la confirmación de solicitudes que se cierran.

**Independent Test**: spec.md US4.

### Tests de US4

- [X] T046 [P] [US4] `tests/db/litters-rules.test.ts` (parte guardar): lo común copiado a cada cría, agregar idempotente por `key`, intercambiar nombres, quitar una cría cierra sus solicitudes, `preview_litter_removal` da el número, `delete_litter` borra camada, crías y fotos, la fecha vieja no traba, sin nivel 1 rechazado, dada de baja rechazada

### Implementación de US4

- [X] T047 [US4] En la migración: `public.save_litter`, `public.preview_litter_removal`, `public.delete_litter` con sus grants (R6); `db reset` y `db:types`
- [X] T048 [US4] `saveLitter`, `previewLitterRemoval`, `deleteLitter` en `src/actions/litters.ts` y `getLitterForEdit` en las consultas
- [X] T049 [US4] `src/app/[locale]/(app)/mis-animales/camadas/[id]/editar/` (`page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`) con la misma puerta de nivel 1 que editar un animal (FR-002) y `LitterForm` en modo editar y `RemoveYoungDialog` con «Se cierran N solicitudes» y «La camada se borra»
- [X] T050 [US4] «Editar» en `MyLitterActions` y en la ficha de la dueña
- [X] T051 [US4] Textos de editar y de los diálogos con `sin-slop`
- [X] T052 [US4] `pnpm gates:affected`

**Checkpoint**: US4 se prueba sobre una camada sembrada con solicitudes.

---

## Fase 6: User Story 5 — Revisar una camada como una sola publicación (P5)

**Goal**: la camada en «Publicaciones por revisar», revisada o dada de baja entera.

**Independent Test**: spec.md US5.

### Tests de US5

- [ ] T053 [P] [US5] Ampliar `tests/db/pet-reviews.test.ts`: la camada entra una vez como `new`, editarla la vuelve como `edited`, la baja pasa a cada cría y cierra sus solicitudes, una persona sin rol no lee la cola ni las fotos en revisión

### Implementación de US5

- [ ] T054 [US5] En la migración: el trigger `litters_review_on_insert`, el reencolado en `save_litter`, `pet_review_queue` y `count_pet_reviews` con camadas, `resolve_litter_review`, `pet_photo_object_in_review` ensanchada (R8); `db reset` y `db:types`
- [ ] T055 [US5] `src/lib/supabase/queries/pet-reviews.ts` y `src/actions/pet-review.ts` con `kind`
- [ ] T056 [US5] `PetReviewItem` muestra las crías de una camada; `PetReviewDecision` resuelve una camada
- [ ] T057 [US5] Textos `litters.review` con `sin-slop`
- [ ] T058 [US5] `pnpm gates:affected`

**Checkpoint**: las cinco user stories andan.

---

## Fase 7: Pulido

- [ ] T059 [P] `tests/e2e/camada.spec.ts`: el camino feliz de US1 a US3 y una sola cría que pasa a un animal (plan.md §Qué se testea)
- [ ] T060 [P] `supabase/seed.sql`: una camada de 4 crías (una sin fotos propias) de una persona sembrada con nivel 1
- [ ] T061 `docs/10-design-system.md`: las filas nuevas y cambiadas de plan.md §Docs y la decisión de la ficha sin tirita
- [ ] T062 Revisar con `vercel:react-best-practices` los TSX nuevos; `"use client"` solo en `LitterForm`, `PublishFlow` y las hojas que lo necesitan
- [ ] T063 Capturas con `node scripts/walk.mjs --story publicar-una-camada --user` de publicar, «Mis animales», el listado y la ficha, a 390 y 1280
- [ ] T064 `pnpm verify` una vez, completo

---

## Dependencias y orden

- Fase 1 bloquea todo. US1 → US2 (la ficha necesita camadas) → US3 (la tarjeta lleva a la ficha) →
  US4 (editar sobre lo publicado) → US5 (la revisión reencola al editar). Cada fase se puede probar
  con una camada sembrada (T005) aunque la anterior no tenga UI.
- Dentro de cada fase: tests primero (fallan), migración, consultas, acciones, componentes, textos.
- Las tareas [P] tocan archivos distintos y no dependen de otra sin terminar.
