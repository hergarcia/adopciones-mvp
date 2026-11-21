# Implementation Plan: Dejar escrita la solicitud mientras revisan mi identidad, y que salga sola al aprobarse

**Branch**: `feature/289-dejar-escrita-solicitud-identidad` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/037-dejar-escrita-solicitud-identidad/spec.md`

## Summary

Quien tiene el pedido de identidad en revisión puede dejar escrita la solicitud desde la pantalla de
identidad pedida. Lo escrito vive en una tabla propia (`held_applications`), cerrada, que solo leen
funciones de quien la escribió: ninguna función de quien publicó ni de quien administra la toca, así
que no puede filtrarse (research R1). Ocupa uno de los 3 lugares. Sale sola dentro de la aprobación
de la identidad, en la misma transacción, convertida en una solicitud común con `sent_at = now()` y
el aviso de solicitud nueva con la regla de siempre; si el animal está en pausa o a la persona le
falta el teléfono, una tarea de `pg_cron` cada 5 minutos la suelta cuando se puede, y vence a los 14
días con las respuestas borradas. Triggers propios la cierran por adopción, baja, borrado, bloqueo y
suspensión; el tope de rechazos, en el rechazo. Los tres correos de resultado de la identidad nombran
los animales que esperaban. Tres momentos nuevos, una marca en el freno por identidad, `held` en
`application_sent` y la lectura 13 en docs/03.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre (next-intl, zod, Supabase con `@supabase/ssr`, Radix bajo las
primitivas, PostHog). **Ninguna dependencia nueva.**

**Storage**: Supabase Postgres local; una migración forward-only
(`20261108120000_held_applications.sql`): dos tablas, cuatro triggers con sus funciones, una tarea de
`pg_cron`, diez funciones nuevas y cinco redefinidas (data-model.md)

**Testing**: Vitest (unitarias y `tests/db` contra Supabase local), Stryker al 100 % sobre lo que
tiene test, Playwright (un flujo)

**Target Platform**: web mobile-first, 390 px y 1280 px

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: sin JS nuevo en pantallas públicas. `ApplicationForm` ya es hoja cliente y
suma un `mode`; la confirmación y las cards son Server Components; `WithdrawApplicationDialog`
recibe otra acción. Presupuesto de siempre: JS inicial < 150 KB, LCP < 2,5 s, Lighthouse mobile ≥ 90

**Constraints**: Ley 18.331 (las respuestas que esperan las ve solo quien las escribió y se borran el
día que no sale); quien publicó y quien administra no ven que existe; una sola salida por fila; un
correo que falla no deshace nada

**Scale/Scope**: beta de 3-5 rescatistas; pantallas tocadas: identidad pedida, el cuestionario, una
confirmación nueva, «Mis solicitudes», el límite, el retiro; tres correos; una tarea

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra tablas, rutas ni componentes; el cómo vive acá, en research y data-model. |
| II. Una feature, un PR | Cuatro user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R12: privacidad y reglas en `tests/db`, lógica pura con Stryker al 100 %, un e2e. |
| IV. Reglas como código | Una por animal es un índice único parcial; el plazo, el límite y la regla del correo viven en la base con prueba y paridad (14 días, 3). |
| V. Datos mínimos y privados | Tabla sin políticas leída solo por funciones de quien la escribió; respuestas en nulo en la misma sentencia que la cierra; momentos sin persona ni animal; prueba que intenta leer como quien publicó, como quien administra, como visitante y como otra persona; se borra con la cuenta. |
| VI. Sin deriva | No cambia la revisión de identidad, sus tiempos ni topes, el cuestionario, lo que ve quien publicó de una solicitud que ya llegó ni los correos de la bandeja. Sin correos nuevos ni edición de lo que espera. |
| VII. Liviana y linda | Server Components salvo el cuestionario, que ya era hoja cliente; tokens y componentes de docs/10; tres estados de cada bloque con datos (§Diseño). |
| VIII. Autonomía con veto | Las siete decisiones de la historia van a docs/03 en esta rama (§4 y §Métricas de éxito); el glosario suma «solicitud que espera»; ninguna regla que juzga a los agentes cambia. |

Sin violaciones. Re-chequeado después del diseño: igual.

## Project Structure

### Documentation (this feature)

```text
specs/037-dejar-escrita-solicitud-identidad/
├── story.md             # cuerpo verbatim de la historia #289
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
supabase/migrations/20261108120000_held_applications.sql      # nuevo (data-model.md)
src/lib/supabase/types.ts                                     # regenerado con pnpm db:types
src/lib/applications/rules.ts                                 # HELD_TTL_DAYS
src/lib/applications/types.ts                                 # ApplyContext (myHeldId, identityInReview), HeldApplication (tipo propio; ver nota)
src/lib/applications/apply-gate.ts (+ .test.ts)               # has_held, needs_identity.canHold
src/lib/applications/paths.ts                                 # HOLD_FLAG, applyHoldPath, heldSentPath
src/lib/applications/held-view.ts (+ .test.ts)                # nuevo: sello, línea del plazo, motivo
src/lib/applications/held-outcome.ts (+ .test.ts)             # nuevo: resultado de hold_application → ActionResult
src/lib/applications/proposed-answers.ts                      # sin cambios: recibe last_answers ya elegido
src/lib/analytics/events.ts                                   # application_held, held_application_released, held_application_lapsed; hold_offered; held
src/lib/analytics/application-events.ts (+ .test.ts)          # applyStoppedEvent con holdOffered; heldEvents desde los momentos
src/lib/email/send-identity-result.ts                         # held en IdentityResult
src/lib/email/held-mail.ts (+ .test.ts)                       # nuevo: heldMailParagraph
src/lib/email/identity-approved-link.ts (+ .test.ts)          # «Ver mis solicitudes» gana
src/lib/supabase/queries/applications.ts                      # getApplyScreen, listMyApplications con las que esperan, holdApplicationRecord, withdrawHeldRecord, getMyHeldApplication
src/lib/supabase/queries/held-moments.ts                      # nuevo: claimHeldApplicationMoments
src/lib/supabase/queries/review.ts                            # held de resolve_identity_request
src/lib/supabase/queries/identity.ts                          # held de claim_identity_expiry_notices
src/actions/applications.ts                                   # holdApplication, withdrawHeldApplication
src/actions/review.ts                                         # pasa held al correo
src/app/api/cron/identidad/route.ts                           # pasa held al correo de vencido
src/app/api/cron/publicaciones/route.ts                       # toma los momentos
src/lib/cron/route-tasks.ts (o la lista de la vigilancia)     # held-applications
src/components/applications/identity-required.tsx             # estados «en revisión con la opción» y «ya dejó una»
src/components/applications/held-offer.tsx                    # nuevo
src/components/applications/application-form.tsx              # mode="hold"
src/components/applications/application-sent.tsx              # variante held
src/components/applications/application-stamp.tsx             # waiting_identity, not_sent
src/components/applications/my-application-card.tsx           # sin enlace para las que esperan y las que no salieron; «Retirar»
src/components/applications/withdraw-application-dialog.tsx   # outcome released
src/app/[locale]/(app)/_components/identity-required-screen.tsx # canHold, held
src/app/[locale]/(app)/_components/limit-screen.tsx           # las que esperan en la lista
src/app/[locale]/(app)/solicitar/[code]/page.tsx              # esperar=1, has_held, hold_offered
src/app/[locale]/(app)/solicitar/[code]/dejada/page.tsx       # nuevo (+ loading.tsx, error.tsx)
src/app/[locale]/(app)/mis-solicitudes/page.tsx               # las dos listas juntas
src/app/[locale]/_components/application-texts.ts             # textos del modo hold
messages/es.json                                              # applications.held.*, stamps, reasons, withdraw.errors.released, emails.identity_*.held_*, metadata
docs/03-mvp-features.md                                       # las siete decisiones (ya en esta rama) y la lectura 13
docs/06-i18n.md                                               # «solicitud que espera» (ya en esta rama)
docs/10-design-system.md                                      # filas de HeldOffer y las variantes nuevas
tests/db/held-applications-support.ts                         # nuevo
tests/db/held-applications-privacy.test.ts                    # nuevo
tests/db/held-applications-rules.test.ts                      # nuevo
tests/e2e/solicitud-en-espera.spec.ts                         # nuevo
```

**Structure Decision**: la de F00 (CLAUDE.md §Estructura). Dominio `applications`: una solicitud que
espera es una solicitud de quien solicita; `verification` no cambia.

## Diseño

Cargado antes de escribir: docs/10 (§Componentes, §Color, §Textos, §Cómo se aplica) y las filas de
`IdentityRequired`, `ApplicationForm`, `ApplicationSent`, `ApplicationStamp`, `ApplicationList`
`MyApplicationCard`, `PastedApplicationCard`, `LimitReached`, `WithdrawApplicationDialog`,
`DestructiveConfirmDialog` y `Stamp`. El skill `frontend-design:frontend-design` no está en esta
sesión: el plan se apoya solo en docs/10, que es la guía (CLAUDE.md regla 4); la etapa de Build lo
carga antes de escribir JSX. Nada nuevo en tokens.

### Identidad pedida, con el pedido en revisión — 390 px

```
┌──────────────────────────────────────┐
│ [foto 112] Tobi pide identidad       │  ← IdentityRequired (sin cambios arriba)
│            verificada                │
│ Carla pide que quien solicite a Tobi │
│ haya mostrado su cédula. …           │
│ [En revisión]                        │  ← IdentityStamp warning (de siempre)
│ Mandaste tu pedido de identidad el   │
│ 2 de noviembre.                      │
│ Te va a llegar un correo con el      │
│ resultado.                           │
│ ──────────────────────────────────── │  ← --color-line
│ ┌──────────────────────────────────┐ │
│ │   Dejar escrita mi solicitud     │ │  ← HeldOffer: LinkButton tirita lg, NUEVO
│ └──────────────────────────────────┘ │
│ Sale sola cuando aprueben tu         │  ← --text-sm ink-muted
│ identidad. Hasta entonces, Carla no  │
│ la ve.                               │
│ Volver a Tobi                        │  ← ghost (de siempre)
└──────────────────────────────────────┘
```

Con una que ya espera para Tobi, en lugar de `HeldOffer`: «Tu solicitud por Tobi espera tu
identidad.» en `--text-base` y «Ver mis solicitudes» en `secondary`. Sin pedido en revisión o con el
tope, la pantalla de hoy. A 1280 px: `ApplicationPetLayout` como hoy, la oferta en la columna de
trabajo en `--measure`.

### El cuestionario en modo `hold`

El de siempre (`ApplicationForm`, un paso por pantalla). Cambia: arriba de cada paso, una `FormNote`
en `--color-surface`: «Sale sola cuando aprueben tu identidad. Hasta entonces, Carla no la ve.»; en el
último paso, el botón `tirita` dice «Dejarla lista» en lugar de «Enviar solicitud». `ContactLaterNote`
y las notas de en proceso, propuestas y borrador siguen igual. Un error `no_review` deja lo escrito y
muestra `SaveFailedStrip` con el texto y el enlace a la pantalla de identidad.

### La confirmación (`ApplicationSent` variante `held`)

```
┌──────────────────────────────────────┐
│          [foto pegada 192]           │
│        [Espera tu identidad]         │  ← ApplicationStamp lg ink
│  Tu solicitud por Tobi sale sola     │  ← h1 afiche
│  cuando aprueben tu identidad.       │
│  Hasta entonces, Carla no la ve.     │  ← --text-sm ink-muted
│  Tenés 1 de 3 solicitudes activas.   │  ← --text-sm ink-muted
│ ┌──────────────────────────────────┐ │
│ │       Ver mis solicitudes        │ │  ← secondary
│ └──────────────────────────────────┘ │
│      Seguir mirando animales         │  ← ghost
└──────────────────────────────────────┘
```

Centrada en `PageShell` `full`, como la de siempre. Su ruta tiene `loading` (el `Skeleton` de
`ApplicationSent`) y `error` propios: «Tu solicitud quedó guardada, pero no pudimos mostrarla.» con
«Ver mis solicitudes».

### «Mis solicitudes» (`MyApplicationCard`)

Activas (`three`), una que espera:

```
┌──────────────┐
│ [foto 4:5]   │
│ [Espera tu   │  ← ApplicationStamp md ink, sobre la foto
│  identidad]  │
│ Tobi         │  ← afiche --text-lg
│ Escrita el   │  ← --text-sm ink-muted
│ 2 de nov.    │
│ Sale si te   │  ← --text-sm --color-warning, solo sin pedido en revisión
│ aprueban     │
│ antes del    │
│ 16 de nov.   │
│ Verificar mi │  ← enlace de texto, solo con esa línea
│ identidad    │
│ Retirar      │  ← WithdrawApplicationDialog, disparador corto ghost
└──────────────┘
```

Con la identidad aprobada y el animal en pausa: sello `warning` «No disponible por ahora» y «Sale
cuando Tobi vuelva a recibir solicitudes, hasta el 16 de noviembre.» en `--text-sm` `ink-muted`.
Cerradas (pared de cuatro): sello `muted` «No salió», «Escrita el 2 de noviembre» y el motivo debajo,
como cualquier cerrada. Las que esperan y las que no salieron **no** son enlace (no hay detalle,
FR-016, FR-028): la card quieta de `PastedApplicationCard`, sin `.lift`, con «Retirar» como único
control. El conteo «1 de 3 solicitudes activas» suma las que esperan.

### El límite (`LimitReached`)

Las tres en `ApplicationList` `three`; las que esperan llevan su sello `ink` «Espera tu identidad»
(las enviadas siguen sin sello) para que se distingan, cada una con «Retirar».

### El retiro (`WithdrawApplicationDialog`)

El mismo `Dialog`, con el cuerpo «Deja de ocupar uno de tus 3 lugares y no le va a llegar a quien
publicó. No se deshace, pero podés dejar otra escrita.» y un estado más: «ya salió», que dice que le
llegó a quien publicó y refresca la pantalla.

### Correos

La plantilla de siempre (`notice-email-template`); el párrafo nuevo va después del cuerpo, en el
mismo estilo; el enlace secundario pasa a «Ver mis solicitudes» cuando hay alguna.

- **Reutiliza**: `IdentityRequired`, `IdentityStamp`, `LinkButton` (`tirita`, `secondary`),
  `ApplicationForm`, `FormNote`, `SaveFailedStrip`, `ApplicationSent`, `ApplicationStamp`,
  `ApplicationList`, `MyApplicationCard`, `PastedApplicationCard`, `LimitReached`,
  `WithdrawApplicationDialog`, `DestructiveConfirmDialog`, `Skeleton`.
- **Crea**: `HeldOffer` (applications; la oferta con su línea · ya dejó una). Variantes nuevas:
  `ApplicationStamp` `ink` «Espera tu identidad» y `muted` «No salió»; `ApplicationForm`
  `mode="hold"`; `ApplicationSent` `held`; `MyApplicationCard` sin enlace con «Retirar»;
  `IdentityRequired` con `offer`.
- **Tokens**: `--color-ink`, `--color-ink-muted`, `--color-warning` (solo el sello de no disponible y
  la línea del plazo, cuando a la persona le toca actuar), `--color-surface` (la nota del
  cuestionario), `--color-line`, `--text-lg`, `--text-base`, `--text-sm`, `--space-3`, `--space-4`,
  `--space-6`, `--dur-fast`.
- **Lo único que llama la atención**: en la pantalla de identidad pedida con el pedido en revisión,
  «Dejar escrita mi solicitud» en `tirita` (hoy esa pantalla no tiene ninguna en revisión); en el
  cuestionario, «Dejarla lista»; en «Mis solicitudes», nada nuevo: el sello `ink` no compite.
- **Accesibilidad**: la línea de la oferta va asociada al enlace con `aria-describedby`; el sello es
  texto, no solo color; la card sin enlace no lleva `role` de enlace; el `Dialog` devuelve el foco al
  disparador y anuncia el error con `role="alert"`.
- **Estados de los bloques con datos**:
  - Cargando: `loading.tsx` de `/solicitar/[code]`, de `/mis-solicitudes` y de la confirmación
    nueva (el `Skeleton` de `ApplicationSent`). La oferta llega con la página.
  - Vacío: sin solicitudes, el estado vacío de siempre de «Mis solicitudes»; sin pedido en revisión,
    la pantalla de identidad de hoy.
  - Error: si no se puede leer la identidad al dibujar, la pantalla de identidad sin la oferta; si no
    se pueden leer las que esperan, el `error.tsx` de «Mis solicitudes» como hoy (no se muestra una
    lista que cuente de menos el límite).

## Cómo se construye, por user story

1. **US1 — dejarla escrita (P1)**: la migración entera (las dos tablas, los triggers, las funciones,
   la tarea: sirven a las cuatro partes), `pnpm db:types`, `HELD_TTL_DAYS`, la puerta (`has_held`,
   `canHold`), `HeldOffer`, el modo `hold`, `holdApplication`, la confirmación, «Mis solicitudes» y el
   límite con las que esperan, el retiro, las respuestas propuestas, las pruebas de privacidad y de
   `hold_application`.
2. **US2 — salir (P2)**: la salida en la aprobación y en la tarea, el aviso de solicitud nueva, el
   correo aprobado con `held`, la línea de no disponible por ahora, las pruebas de salida y el e2e.
3. **US3 — no salir (P3)**: los motivos en «Mis solicitudes», la línea del plazo, el tope, los correos
   de rechazo y vencido con `held`, las pruebas de cada motivo y del plazo.
4. **US4 — medir (P4)**: `hold_offered`, los momentos desde la acción y desde la bandeja, `held` en
   `application_sent`, la lectura 13 en docs/03 §Métricas de éxito.

Los textos se escriben con el skill `sin-slop` en cada US.

### Cambios al construir US1

- `HeldApplication` es un tipo propio en lugar de un `kind` dentro de `ApplicationSummary`: las dos
  listas llegan de funciones distintas y la que espera no tiene estado de solicitud, motivo de cierre
  ni detalle. `listMyHeldApplications` la lee aparte y «Mis solicitudes», el límite y las dos
  confirmaciones la suman con `activeWithHeld`; las cards se intercalan por día en
  `_components/my-application-rows.tsx`.
- Los motivos `expired` y `capped` de «Cerradas y retiradas» entraron con US1 junto a `withdrawn`: la
  tarea ya puede dejar una que no salió y la pantalla no puede mostrar una clave que falta.
- El día escrito y el último día salen de `heldApplicationView` como días del calendario de Uruguay.

### Cambios al construir US2

- `my_held_applications` devuelve también `level_two` de quien la escribió: «Mis solicitudes» no
  sabía si a la que espera le falta la identidad o que el animal reciba (FR-014). `HeldApplication`
  suma `levelTwo` y `heldApplicationView` saca de ahí el sello `unavailable` y su línea.
- El correo aprobado arma sus párrafos con `heldApprovedParagraphs` (en `held-mail.ts`), que van en
  `lines` de la plantilla, uno por cosa. Sin el teléfono vigente, la que espera dice que sale al
  confirmarlo (`held_waiting_phone`), porque eso es lo que le falta (FR-023). Una que justo venció en
  la aprobación no se nombra (FR-032). US3 suma ahí los de rechazo y vencido.
- El `held` que llega de la base se lee con `toHeldMailLines` en `queries/identity-rows.ts`, que
  también va a usar el correo de vencido; una forma inesperada deja el correo de siempre.

### Cambios al construir US3

- `my_held_applications` devuelve también `needs_request`: sin pedido en revisión ni identidad
  aprobada. «Mis solicitudes» no podía distinguir a quien le rechazaron o le venció el pedido (la
  línea del plazo con «Verificar mi identidad», FR-013) de quien tiene la identidad aprobada y le
  falta el teléfono, que sigue como «Espera tu identidad» sin esa línea. `HeldApplication` suma
  `needsRequest`.
- Los párrafos de rechazo y vencido salen de `heldUntilParagraphs` y `heldCappedParagraphs` en lugar
  de un solo `heldMailParagraph`: cada correo pasa solo las claves que tiene, y el de vencido nunca
  trae una cerrada por el tope.
- La línea del plazo va como aviso de la card (`--color-warning`), porque es lo que le toca hacer a la
  persona; «Verificar mi identidad» es un `TextLink` encima de «Retirar».

### Cambios al construir US4

- `application_held` y el `application_sent` de una que sale sola llevan `proposedUsed`, no
  `proposed_used`: es el nombre que ya tiene `application_sent`, y la lectura compara las dos.
- `held` sale en todo `application_sent`: `true` en la que sale sola, `false` en las que manda la
  persona, así la lectura 2 se parte sin depender de una propiedad ausente.
- El freno por identidad lleva `hold_offered` siempre, verdadero o falso; los demás frenos no lo
  traen. `applyStoppedEvent` recibe la puerta entera para leer `canHold`.
- Los momentos de la base se traducen en `heldMomentEvents` (`lib/analytics/application-events.ts`),
  que descarta un tipo o un motivo que no conoce; `queries/held-moments.ts` solo los toma.

## Complexity Tracking

Sin violaciones de la constitución.
