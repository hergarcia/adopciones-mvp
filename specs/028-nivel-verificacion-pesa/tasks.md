---
description: "Tareas de la historia #236 — Saber si el nivel de verificación pesa cuando se elige y cuando se solicita"
---

# Tasks: Saber si el nivel de verificación pesa cuando se elige y cuando se solicita

**Input**: `specs/028-nivel-verificacion-pesa/` — spec.md, plan.md (§Cómo se construye),
research.md (R1–R10), data-model.md, contracts/measurement.md, quickstart.md

**Tests**: sí, y solo los de research R9; no se agrega ninguno fuera de ahí ni se saca ninguno de
ahí. Todo lo que tiene test se sostiene al 100 % de mutación.

**Organización**: por user story, en orden de prioridad. Antes de tocar la migración o sus tests se
carga `supabase:supabase-postgres-best-practices`. No hay JSX ni CSS nuevo, ni textos visibles
nuevos; el texto de docs/03 se escribe con `sin-slop`. La migración es un solo archivo; después de
cada cambio, `pnpm exec supabase db reset` y `pnpm db:types`.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: se puede hacer en paralelo (otro archivo, sin depender de algo sin terminar)
- **[Story]**: a qué user story pertenece (US1…US4). Base y pulido no llevan etiqueta

---

## Fase 1: Base (bloquea todo)

**Propósito**: las dos funciones de lectura, sus consultas que nunca lanzan y la lógica pura que
convierte una fila en propiedades de medición.

- [X] T001 Crear `supabase/migrations/20261028130000_measured_levels.sql`: `public.application_measure(uuid)` y `public.pet_publisher_level(text)`, `language sql stable security definer set search_path = ''`, con `private.person_level` y `private.follow_up_counts`, `publisher_level` nulo si quien publicó borró su cuenta (la de quien solicitó se lleva la solicitud), y los `revoke`/`grant` solo a `service_role` (data-model.md, research R1, R2)
- [X] T002 `pnpm exec supabase db reset` y `pnpm db:types`
- [X] T003 [P] `src/lib/analytics/measured-levels.ts`: `MeasuredLevel`, `ApplicantMeasure`, `ApplicationMeasure`, `measuredLevelOf`, `applicationMeasureOf`, `applicantProps`, `publisherLevelProps` (data-model.md §Tipos, research R7, R8)
- [X] T004 [P] `src/lib/analytics/measured-levels.test.ts`: `measuredLevelOf` con 0, 1, 2, 3, -1, 4, 1.5 y nulo; `applicationMeasureOf` con una fila completa, sin fila, con quien solicitó nulo, con un nivel fuera de rango; `applicantProps(null)` da `{}` y con medida da exactamente `applicant_level` y `applicant_follow_up`; `publisherLevelProps` ídem con `publisher_level`
- [X] T005 `src/lib/supabase/queries/measured-levels.ts`: `getApplicationMeasure` y `getPetPublisherLevel` con el cliente de servicio, que devuelven `null` ante un error o una fila que falta y usan `applicationMeasureOf` / `measuredLevelOf` (contracts §Las consultas)
- [X] T006 [P] `tests/db/measured-levels-support.ts`: sembrar sobre `application-responses-support.ts`, `adoptions-support.ts` y `follow-ups-support.ts` una rescatista, solicitantes de nivel 1, 2 y 3, una con una adopción con seguimiento respondida como adoptante, otra que solo dio un animal con seguimiento, una suspendida, y una solicitud a una cría de camada
- [X] T007 [P] `tests/db/measured-levels-privacy.test.ts`: un visitante y una persona con sesión no pueden ejecutar `application_measure` ni `pet_publisher_level`, ni con el id de su propia solicitud; el servicio sí (constitución §V)
- [X] T008 `tests/db/measured-levels-rules.test.ts`: el nivel es el de ahora (aprobar la identidad después de mandar da 2; retirar el aval de un nivel 3 da 2; perder el teléfono verificado da 0); `applicant_follow_up` es `true` solo con una adopción como adoptante con el seguimiento respondido, `false` con una pendiente o con una que dio como rescatista, `false` suspendida; quien solicitó borrada o sin solicitud, ninguna fila; quien publicó borrada, `publisher_level` nulo; `publisher_level` y `pet_publisher_level` de una cría dan el nivel de quien publicó la camada; código inexistente da nulo

**Checkpoint**: las funciones existen, los tipos están generados, la lectura pura tiene pruebas al 100 %.

---

## Fase 2: User Story 1 — Saber qué nivel tiene a quien quien rescata acepta o descarta (P1) 🎯 MVP

**Goal**: aceptar, rechazar, preguntar, la primera respuesta, dejar sin efecto y entregar a una
persona del sitio llegan con el nivel de ahora de quien solicitó y su sí o no de adopción con
seguimiento; entregar por fuera, sin ellos.

**Independent Test**: spec.md US1.

### Tests de US1

- [X] T009 [P] [US1] `src/lib/analytics/application-events.test.ts`: `applicationAcceptedEvents`, `applicationRejectedEvents` y `questionAskedEvents` con medida y sin ella, con y sin primera respuesta: el momento y su `application_first_response` llevan los mismos dos datos, el rechazo conserva `reason`, sin medida no aparece ninguna de las dos propiedades; `acceptanceRevokedEvent` ídem con `reason`; ninguna propiedad de más
- [X] T010 [P] [US1] `src/lib/analytics/adoption-events.test.ts`: `handoverEvent` a una persona del sitio con medida lleva los dos datos; sin medida, ninguno; por fuera del sitio no los lleva aunque llegue una medida

### Implementación de US1

- [X] T011 [US1] `src/lib/analytics/events.ts`: `applicant_level?` y `applicant_follow_up?` en `application_accepted`, `application_rejected`, `question_asked`, `application_first_response`, `acceptance_revoked` y `pet_handed_over` (contracts/measurement.md), con su comentario de disparador al día
- [X] T012 [US1] `src/lib/analytics/application-events.ts` y `src/lib/analytics/adoption-events.ts`: los constructores reciben `ApplicantMeasure | null` y suman `applicantProps`; `firstResponseEvent` recibe la misma medida; `handoverEvent` la usa solo con `site: true`
- [X] T013 [US1] `src/actions/application-responses.ts`: dentro de cada `if` que hoy mide (aceptada, rechazada, dejada sin efecto, preguntada ahora), `getApplicationMeasure(id)` y su `applicant` a los constructores; el resultado de la acción no cambia (FR-019, research R1)
- [X] T014 [US1] `src/actions/adoptions.ts`: en `markPetAdopted`, con `applicationId` no nulo y `outcome === 'done'`, `getApplicationMeasure(applicationId)` a `handoverEvent`; por fuera, `null`

**Checkpoint**: US1 se prueba sola: responder y entregar desde la app dejan los datos en el registro de la medición.

---

## Fase 3: User Story 2 — Saber si quien adopta busca a rescatistas verificados (P2)

**Goal**: ver una ficha, tocar «Solicitar» y mandar una solicitud llegan con el nivel de quien
publicó; mandar, también con el de quien solicita.

**Independent Test**: spec.md US2.

### Tests de US2

- [X] T015 [P] [US2] `src/lib/analytics/listing-events.test.ts`: `petViewEvent` de un animal y de una camada con nivel 1, 2 y 3 lleva `publisher_level`; con nivel nulo no lo lleva; los casos que hoy no miden siguen dando `null`
- [X] T016 [P] [US2] `src/lib/analytics/application-events.test.ts`: `applyTappedEvent` con y sin sesión lleva `publisher_level` cuando se leyó y no lo lleva cuando no; `applicationSentEvent` con los dos niveles, con uno solo y sin ninguno, sin propiedades de más

### Implementación de US2

- [X] T017 [US2] `src/lib/analytics/events.ts`: `publisher_level?` en `pet_viewed` y `apply_tapped`; `applicant_level?` y `publisher_level?` en `application_sent` (contracts/measurement.md)
- [X] T018 [US2] `src/lib/analytics/listing-events.ts` (`PetView` suma `publisherLevel`) y `src/lib/analytics/application-events.ts` (`applyTappedEvent`, `applicationSentEvent` reciben los niveles y usan `publisherLevelProps`)
- [X] T019 [P] [US2] `src/app/[locale]/(public)/animales/[code]/page.tsx` y `src/app/[locale]/(public)/camadas/[code]/page.tsx`: pasar `publisher.level` de la ficha a `petViewEvent` (research R3)
- [X] T020 [P] [US2] `src/app/[locale]/(app)/solicitar/[code]/page.tsx`: `getPetPublisherLevel(code)` en los dos caminos de `apply_tapped` (con y sin sesión), sin cambiar redirecciones ni pantallas (research R2)
- [X] T021 [US2] `src/actions/applications.ts`: con `outcome === 'sent'` y un `id`, `getApplicationMeasure(id)` y sus dos niveles a `applicationSentEvent` (research R4)

**Checkpoint**: US2 se prueba sola: mirar, tocar «Solicitar» y mandar dejan el nivel de quien publicó en el registro.

---

## Fase 4: User Story 3 — Contar las veces que quien rescata abre el perfil de quien solicitó (P3)

**Goal**: la visita al perfil desde «Ver su perfil» de la solicitud cuenta como `application`;
desde afuera, como `link`.

**Independent Test**: spec.md US3.

### Tests de US3

- [X] T022 [P] [US3] `src/lib/analytics/view-origin.test.ts`: `profileViewOrigin` con la marca y llegada del sitio da `application`; con la marca y un `Referer` vacío, de otro origen o `https://sitio.com.evil` da `link`; sin la marca, lo mismo que `viewOrigin`

### Implementación de US3

- [X] T023 [US3] `src/lib/analytics/events.ts`: `PROFILE_VIEW_ORIGINS` y `ProfileViewOrigin`; `public_profile_viewed.origin` pasa a ese tipo; `src/lib/analytics/view-origin.ts`: `profileViewOrigin` (research R6)
- [X] T024 [US3] `src/lib/profile/public-paths.ts`: `PROFILE_FROM_FLAG` y `publicProfilePath(publicId, options?)` que agrega `?desde=solicitud` solo con `{ from: 'application' }`; las llamadas que ya existen no cambian
- [X] T025 [US3] `src/app/[locale]/_components/publisher-application-texts.ts`: `profileHref` con `{ from: 'application' }`
- [X] T026 [US3] `src/app/[locale]/(public)/perfil/[id]/page.tsx`: leer la marca de `searchParams` y medir con `profileViewOrigin`; `shouldTrackView` igual (FR-013)

**Checkpoint**: US3 se prueba sola: «Ver su perfil» deja `origin: "application"`, la dirección pegada deja `link`.

---

## Fase 5: User Story 4 — Saber qué parte de las publicaciones pide nivel 2 (P4)

**Goal**: publicar y guardar una edición llegan con el nivel exigido después de guardar; una camada,
una sola vez.

**Independent Test**: spec.md US4.

### Tests de US4

Ninguno (research R9): el valor pasa tal cual desde el schema ya probado a `track`, que lo tipa
`EventProps`; no hay cálculo que pueda salir mal.

### Implementación de US4

- [X] T027 [US4] `src/lib/analytics/events.ts`: `required_level: RequiredLevel` en `pet_published` y `pet_edited`
- [X] T028 [P] [US4] `src/actions/pets.ts`: `required_level` del dato ya validado en `pet_published` y en `pet_edited` (research R5)
- [X] T029 [P] [US4] `src/actions/litters.ts`: ídem para la camada, en su único `pet_published` y en `pet_edited`

**Checkpoint**: US4 se prueba sola: publicar y editar dejan `required_level` en el registro.

---

## Fase 6: Pulido

- [X] T030 `docs/03-mvp-features.md` §Métricas de éxito, «Cómo se leen»: punto 5, «¿Pesa la verificación cuando se elige?», con lo que dice la sección Medición de la historia y los momentos y propiedades de contracts/measurement.md, escrito y revisado con `sin-slop` (FR-024)
- [X] T031 Revisar contra contracts/measurement.md que ningún momento de esta historia lleve un id, un código, un nombre o un texto (FR-020, SC-006), con el registro de `pnpm dev` de quickstart.md
- [X] T032 `pnpm gates:affected` verde, Stryker al 100 % en lo que tiene test

---

## Dependencias

- Fase 1 bloquea todo. US1, US2, US3 y US4 dependen solo de la Fase 1 y tocan archivos distintos,
  salvo `src/lib/analytics/events.ts` y `src/lib/analytics/application-events.ts`, que comparten
  US1 y US2: se hacen en ese orden. US3 y US4 no necesitan las funciones de la base, pero van
  después por orden de prioridad.
- Dentro de cada US: los tests primero, en rojo; después la implementación.
- El pulido va al final: la lectura de docs/03 nombra lo que dejaron las cuatro US.

## Phase 7: Convergence

- [X] T033 Add reading point 5, «¿Pesa la verificación cuando se elige?», to docs/03-mvp-features.md §Métricas de éxito «Cómo se leen», naming the events and properties of contracts/measurement.md per FR-024 (missing)
