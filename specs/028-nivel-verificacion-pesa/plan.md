# Implementation Plan: Saber si el nivel de verificación pesa cuando se elige y cuando se solicita

**Branch**: `feature/236-saber-nivel-verificacion-pesa` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/028-nivel-verificacion-pesa/spec.md`

## Summary

Momentos que ya se miden suman un número. Al responder una solicitud o entregar a una persona del
sitio, el nivel de ahora de quien solicitó y si tiene una adopción con seguimiento (sí o no). Al ver
una ficha, tocar «Solicitar» y mandar una solicitud, el nivel de quien publicó (y al mandar, el de
quien solicita). Al publicar y editar, el nivel exigido. La visita al perfil desde «Ver su perfil» de
la solicitud cuenta con un origen nuevo, `application`. El nivel sale de la misma escalera de la base
que pinta la chapita, con dos funciones de lectura nuevas, solo para el servicio (research R1, R2).
Si leer falla, el momento sale sin el dato y la acción sigue igual (R7). Ninguna pantalla cambia y no
se guarda nada nuevo.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre (next-intl, zod, Supabase). **Ninguna dependencia nueva.**

**Storage**: Supabase Postgres local; una migración forward-only con dos funciones de lectura
`security definer`, ejecutables solo por `service_role` (data-model.md). Ninguna tabla ni columna
nueva.

**Testing**: Vitest (unitarias y `tests/db` contra Supabase local), Stryker al 100 % sobre lo que
tiene test. Sin e2e nuevo (research R9).

**Target Platform**: servidor (Server Components y Server Actions); nada llega al cliente

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: cero JS nuevo en el cliente. Una lectura más a la base en cada respuesta,
entrega, solicitud mandada y toque de «Solicitar», después de que la acción ya hizo lo suyo; la
ficha no suma lecturas. Presupuesto de siempre: JS inicial < 150 KB, LCP < 2,5 s, Lighthouse mobile
≥ 90

**Constraints**: Ley 18.331 (solo el número del nivel, un sí o no, el origen; nunca un id, un texto
ni una cantidad); medir nunca cambia el resultado de una acción

**Scale/Scope**: beta de 3-5 rescatistas; ocho momentos que ya existen y un origen nuevo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra eventos, funciones ni rutas; el cómo vive acá y en research. |
| II. Una feature, un PR | Cuatro user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R9: los constructores puros y `profileViewOrigin` con Stryker al 100 %, las dos funciones en `tests/db`. |
| IV. Reglas como código | «Nunca un id ni un texto» lo sostiene el tipo `EventProps` por evento; «el nivel de la chapita» vive en la base (`private.person_level`) y se prueba ahí. |
| V. Datos mínimos y privados | No se guarda nada nuevo. Las funciones devuelven nivel y sí o no de cualquiera por id, así que solo las ejecuta el servicio, con una prueba que intenta ejecutarlas como visitante y como persona. |
| VI. Sin deriva | Ninguna pantalla cambia; no se toca el listado, la portada, los momentos de quien administra, la encuesta de #71 ni la pregunta de #234. |
| VII. Liviana y linda | Todo en el servidor; ningún componente nuevo. |
| VIII. Autonomía con veto | Las cuatro decisiones de la historia van a docs/03 en esta rama; ninguna regla que juzga a los agentes cambia. |

Sin violaciones. Re-chequeado después del diseño: igual.

## Project Structure

### Documentation (this feature)

```text
specs/028-nivel-verificacion-pesa/
├── story.md             # cuerpo verbatim de la historia #236
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/measurement.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/20261028130000_measured_levels.sql  # nuevo: application_measure, pet_publisher_level, grants
src/lib/supabase/types.ts                              # regenerado con pnpm db:types
src/lib/supabase/queries/measured-levels.ts            # nuevo: getApplicationMeasure, getPetPublisherLevel (nunca lanzan)
src/lib/analytics/measured-levels.ts                   # nuevo: tipos, measuredLevelOf, applicationMeasureOf, applicantProps, publisherLevelProps
src/lib/analytics/measured-levels.test.ts              # nuevo
src/lib/analytics/events.ts                            # propiedades nuevas en EventProps, ProfileViewOrigin
src/lib/analytics/application-events.ts                # constructores con la medida de quien solicitó / quien publicó
src/lib/analytics/application-events.test.ts           # casos nuevos
src/lib/analytics/adoption-events.ts                   # handoverEvent con la medida, solo «a una persona del sitio»
src/lib/analytics/adoption-events.test.ts              # casos nuevos
src/lib/analytics/listing-events.ts                    # petViewEvent con publisher_level
src/lib/analytics/listing-events.test.ts               # casos nuevos
src/lib/analytics/view-origin.ts                       # profileViewOrigin
src/lib/analytics/view-origin.test.ts                  # casos nuevos
src/lib/profile/public-paths.ts                        # publicProfilePath(id, { from: 'application' }), PROFILE_FROM_FLAG, isFromApplication
src/lib/profile/public-paths.test.ts                   # casos nuevos: ya tiene prueba, y Stryker al 100 % pide matar la marca nueva
src/actions/application-responses.ts                   # aceptar, rechazar, preguntar, dejar sin efecto leen la medida
src/actions/adoptions.ts                               # entregar a una persona del sitio lee la medida
src/actions/applications.ts                            # mandar lee los dos niveles
src/actions/pets.ts                                    # pet_published, pet_edited con required_level
src/actions/litters.ts                                 # ídem para la camada
src/app/[locale]/(public)/animales/[code]/page.tsx     # pasa el nivel de quien publicó a petViewEvent
src/app/[locale]/(public)/camadas/[code]/page.tsx      # ídem
src/app/[locale]/(app)/solicitar/[code]/page.tsx       # apply_tapped con publisher_level
src/app/[locale]/_components/publisher-application-texts.ts  # «Ver su perfil» con la marca
src/app/[locale]/(public)/perfil/[id]/page.tsx         # origen con profileViewOrigin
docs/03-mvp-features.md                                # las cuatro decisiones (ya en esta rama) y la lectura nueva en «Cómo se leen»
tests/db/measured-levels-support.ts                    # nuevo: personas, solicitudes y adopciones sembradas
tests/db/measured-levels-privacy.test.ts               # nuevo
tests/db/measured-levels-rules.test.ts                 # nuevo
```

**Structure Decision**: la de F00 (CLAUDE.md §Estructura). La lógica de medición en
`lib/analytics`, la lectura en `lib/supabase/queries`, el cableado en las acciones y páginas que ya
miden.

## Diseño

No aplica: la historia no cambia ninguna pantalla (spec FR-022). El único cambio visible al ojo
atento es la dirección de «Ver su perfil», que suma `?desde=solicitud`; el enlace, su texto y su
lugar quedan iguales. No se carga `frontend-design` porque no se escribe JSX ni CSS nuevo.

## Cómo se construye, por user story

0. **Base (bloquea todo)**: la migración con las dos funciones, `pnpm db:types`, las consultas que
   nunca lanzan, `applicantProps` / `publisherLevelProps` con sus pruebas y las pruebas de base de
   las funciones (privacidad y reglas).
1. **US1 — quien rescata elige (P1)**: `EventProps` de aceptar, rechazar, preguntar, primera
   respuesta, dejar sin efecto y entregar; los constructores con sus pruebas; las dos acciones leen la
   medida después de la respuesta.
2. **US2 — quien adopta busca (P2)**: `EventProps` de `pet_viewed`, `apply_tapped` y
   `application_sent`; los constructores con sus pruebas; las dos fichas, «Solicitar» y mandar.
3. **US3 — el perfil desde la solicitud (P3)**: `ProfileViewOrigin`, `profileViewOrigin` con su
   prueba, la marca en `publicProfilePath` y en «Ver su perfil», la página del perfil.
4. **US4 — el nivel exigido (P4)**: `required_level` en `pet_published` y `pet_edited`, las dos
   acciones de animales y las dos de camadas.
5. **Pulido**: la lectura «¿pesa la verificación cuando se elige?» en docs/03 §Métricas de éxito,
   «Cómo se leen», escrita con `sin-slop`; `pnpm gates:affected`.

## Complexity Tracking

Sin violaciones de la constitución.
