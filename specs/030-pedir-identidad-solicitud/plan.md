# Implementation Plan: Pedirle a quien solicitó que verifique su identidad antes de decidir

**Branch**: `feature/257-pedir-identidad-quien-solicito` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/030-pedir-identidad-solicitud/spec.md`

## Summary

Quien publicó puede tocar «Pedirle la identidad» en una solicitud que espera respuesta de alguien
sin la identidad aprobada. El pedido es una fila por solicitud con su día (tabla nueva, sin
políticas, leída por las funciones que ya arman cada pantalla de una solicitud). Pedir escribe el
aviso a quien solicitó en la bandeja de salida de la #65, en la misma transacción. Quien solicitó ve
el pedido en Mi solicitud con las chapitas de quien publicó y el camino a la verificación de
siempre, que vuelve a la solicitud con `?solicitud=<id>`. Cuando quien administra aprueba la
identidad, la misma transacción resuelve cada pedido abierto, vuelve a marcar la solicitud como
nueva (borra `opened_at`) y escribe el aviso a quien publicó con la regla del correo de solicitud
nueva. Dos momentos nuevos con el nivel de quien pidió, el origen `asked` en la pregunta de por qué
se deja la verificación y la lectura en docs/03 §Métricas de éxito.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre (next-intl, zod, Supabase con `@supabase/ssr`, Radix bajo
las primitivas). **Ninguna dependencia nueva.**

**Storage**: Supabase Postgres local; una migración forward-only: una tabla, un trigger, tres
funciones nuevas (una es la del trigger), seis redefinidas y tres `check` ampliados (data-model.md)

**Testing**: Vitest (unitarias y `tests/db` contra Supabase local), Stryker al 100 % sobre lo que
tiene test, Playwright (un flujo)

**Target Platform**: web mobile-first, 390 px y 1280 px

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: sin JS nuevo en pantallas públicas; una hoja cliente nueva
(`IdentityAskDialog`) solo en la solicitud de quien publicó, que ya carga `AcceptDialog` y las dos
hojas. Presupuesto de siempre: JS inicial < 150 KB, LCP < 2,5 s, Lighthouse mobile ≥ 90

**Constraints**: Ley 18.331 (quien publicó nunca ve el estado del pedido de verificación de la otra
persona; quien administra no ve el pedido); pedir nunca traba aceptar, rechazar ni preguntar; un
correo que falla no deshace el pedido ni la aprobación

**Scale/Scope**: beta de 3-5 rescatistas; cuatro pantallas tocadas (una solicitud y la lista de un
animal para quien publicó, Mi solicitud, verificar identidad), una columna en Encuestas y dos
correos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra tablas, rutas ni componentes; el cómo vive acá, en research y data-model. |
| II. Una feature, un PR | Cuatro user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R12: lógica pura con Stryker al 100 %, reglas y privacidad en `tests/db`, un e2e. |
| IV. Reglas como código | «Uno por solicitud» es la clave primaria; «solo quien publicó, solo esperando, solo sin identidad» y la regla del correo viven en la base con prueba. |
| V. Datos mínimos y privados | Se guarda el instante del pedido y el de la aprobación, nada del pedido de verificación; tabla sin políticas, funciones que eligen columnas por quién mira; prueba que intenta leer el pedido como visitante, como otra persona y como quien administra; se borra con la solicitud y con cualquiera de las dos cuentas. |
| VI. Sin deriva | No cambia cómo se verifica, el correo de aprobado, el nivel mínimo, aceptar, rechazar ni preguntar. Sin recordatorios ni cancelar el pedido. |
| VII. Liviana y linda | Server Components; `IdentityAskDialog` es la única hoja cliente nueva; tokens y componentes de docs/10; tres estados de cada bloque con datos (§Diseño). |
| VIII. Autonomía con veto | Las seis decisiones de la historia van a docs/03 en esta rama (§4 y §Métricas de éxito); el glosario suma «identidad pedida»; ninguna regla que juzga a los agentes cambia. |

Sin violaciones. Re-chequeado después del diseño: igual.

## Project Structure

### Documentation (this feature)

```text
specs/030-pedir-identidad-solicitud/
├── story.md             # cuerpo verbatim de la historia #257
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
supabase/migrations/20261030120000_identity_asks.sql        # nuevo (data-model.md)
src/lib/supabase/types.ts                                   # regenerado con pnpm db:types
src/lib/applications/types.ts                               # NOTICE_KINDS, PublisherApplication, PetApplicationRow, MyApplication
src/lib/applications/paths.ts                               # APPLICATION_FLAG, identityForApplicationPath, MY_APPLICATION_PATTERN
src/lib/applications/notices.ts                             # identity_verified a quien publicó
src/lib/applications/identity-ask.ts                        # nuevo: myIdentityAskView, publisherIdentityAskView
src/lib/applications/identity-ask.test.ts                   # nuevo
src/lib/applications/publisher-actions.ts (+ .test.ts)      # identityAsk: 'offer' | null
src/lib/applications/response-outcome.ts (+ .test.ts)       # IDENTITY_ASK_OUTCOMES, identityAskOutcome
src/lib/applications/notices.test.ts                        # las dos clases
src/lib/analytics/events.ts                                 # identity_ask_sent, identity_ask_resolved
src/lib/analytics/identity-ask-events.ts (+ .test.ts)       # nuevo
src/lib/verification/exit-question.ts (+ .test.ts)          # asked, applicationId, exitOrigin, exitDestination
src/lib/surveys/exit-summary.ts (+ .test.ts)                # byOrigin desde EXIT_ORIGINS
src/lib/supabase/queries/application-response-records.ts    # askIdentityRecord
src/lib/supabase/queries/application-responses.ts           # mapea las columnas nuevas
src/lib/supabase/queries/applications.ts                    # getMyApplication con identityAsk
src/lib/supabase/queries/review.ts                          # asker_levels
src/actions/application-responses.ts                        # askIdentity
src/actions/review.ts                                       # momentos de pedido resuelto, vaciar la bandeja
src/actions/verification-exit.ts                            # leaveVerification confirma la solicitud
src/lib/email/send-application-notice.ts                    # sin cambios de código: las clases nuevas usan el armado genérico
src/components/applications/identity-ask-dialog.tsx         # nuevo (hoja cliente)
src/components/applications/identity-ask-line.tsx           # nuevo
src/components/applications/identity-ask-note.tsx           # nuevo
src/components/applications/response-actions.tsx            # suma el disparador
src/components/applications/application-card.tsx            # suma la línea de la marca
src/components/surveys/exit-origin-table.tsx                # la columna nueva sale de EXIT_ORIGINS
src/app/[locale]/(app)/solicitudes/[id]/page.tsx            # IdentityAskLine y la oferta
src/app/[locale]/(app)/solicitudes/animal/[petId]/page.tsx  # la marca en la fila (vía textos)
src/app/[locale]/(app)/mis-solicitudes/[id]/page.tsx        # IdentityAskNote
src/app/[locale]/(app)/verificar-identidad/page.tsx         # solicitud=<id>
src/app/[locale]/_components/identity-ask-texts.ts          # nuevo: textos de las tres piezas
src/app/[locale]/_components/publisher-application-texts.ts # textos del disparador
src/app/[locale]/_components/inbox-texts.ts                 # la línea de la fila
messages/es.json                                            # inbox.identity_ask.*, applications.identity_ask.*, emails.applications.identity_asked|identity_verified, surveys.exits.origins.asked
docs/03-mvp-features.md                                     # las seis decisiones (ya en esta rama) y la lectura 7
docs/06-i18n.md                                             # «identidad pedida» (ya en esta rama)
docs/10-design-system.md                                    # filas de IdentityAskDialog, IdentityAskLine, IdentityAskNote
tests/db/identity-asks-support.ts                           # nuevo
tests/db/identity-asks-privacy.test.ts                      # nuevo
tests/db/identity-asks-rules.test.ts                        # nuevo
tests/e2e/identidad-pedida.spec.ts                          # nuevo
```

**Structure Decision**: la de F00 (CLAUDE.md §Estructura). Dominio `applications` para el pedido,
porque vive en una solicitud y lo ven sus dos personas; `verification` solo para el origen de la
pregunta de por qué se va.

## Diseño

Cargado antes de escribir: docs/10 (§Componentes, §Color, §Textos, §Cómo se aplica) y las filas de
`ResponseActions`/`AcceptDialog`, `ApplicantHeader`/`PublisherApplicationState`, `ApplicationCard`,
`IdentityRequired`, `IdentityStamp`, `VerificationBadge`, `ConfirmBody` y `FormNote`. Nada nuevo en
tokens: son pantallas de trabajo que ya existen.

### Una solicitud, para quien publicó — 390 px

```
┌──────────────────────────────────────┐
│ ← Solicitudes por Tobi        [foto] │
│ [Avatar lg] Ana             [chapita]│  ← ApplicantHeader (sin cambios)
│ Nivel 1, Cordón · Ver su perfil      │
│ [Esperando respuesta] desde el 27/10 │  ← PublisherApplicationState
│ Le pediste la identidad el 29/10.    │  ← IdentityAskLine, --text-sm ink
│ Todavía no la verificó.              │     segunda frase ink-muted
│                                      │
│ ...lo que contestó, las preguntas... │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │       Aceptar solicitud          │ │  ← tirita lg (la de siempre)
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │     Pedir más información        │ │  ← secondary (la de siempre)
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │     Pedirle la identidad         │ │  ← secondary, NUEVO; solo con la oferta
│ └──────────────────────────────────┘ │
│ Rechazar                             │  ← ghost
└──────────────────────────────────────┘
```

A 1280 px: la columna `--container-rail` de la izquierda, como hoy; `IdentityAskLine` debajo del
estado y el disparador entre «Pedir más información» y «Rechazar», en la columna `sticky`.

Con la identidad aprobada: `Le pediste la identidad el 29/10.` en tinta y `Verificó su identidad el
31/10.` en `--color-primary` (lo verificado es yerba); la chapita del encabezado ya es la de nivel 2.
Con la solicitud cerrada sin aprobar, solo la primera frase. Sin pedido, la línea no está.

### La confirmación (`IdentityAskDialog`)

```
┌──────────── nota con cinta ──────────┐
│ ¿Le pedís la identidad a Ana?        │  ← título del Dialog, afiche
│                                      │
│ Le vamos a pedir el frente de su     │  ← ConfirmBody, --text-base
│ cédula y una selfie con ella. Las    │
│ revisa una persona y puede tardar    │
│ hasta 2 días.                        │
│ Su solicitud sigue esperando: podés  │
│ aceptarla, rechazarla o preguntarle  │
│ algo cuando quieras.                 │
│                                      │
│ [SaveFailedStrip si no llegó]        │
│ ┌──────────────────────────────────┐ │
│ │      Pedirle la identidad        │ │  ← primary, loading mientras pide
│ └──────────────────────────────────┘ │
│ Cancelar                             │  ← ghost
└──────────────────────────────────────┘
```

Textos finales con `sin-slop`. Es un `Dialog` y no un `Sheet` porque el pedido no se deshace y
manda un correo (docs/10: el `Dialog` es de lo irreversible).

### La fila en «Solicitudes por Tobi» (`ApplicationCard`)

Debajo de «Llegó el 27 de octubre, hace 2 días», una línea más en `--text-sm` `ink-muted`: «Le
pediste la identidad». Sin ícono ni color: el sello «Nueva» que vuelve al aprobarse ya es lo que
llama la atención. Con el pedido resuelto la línea no está (lo dice la chapita nueva).

### Mi solicitud, para quien solicitó — 390 px (`IdentityAskNote`)

```
┌──────────────────────────────────────┐
│ [foto 112] Tobi                      │  ← ApplicationDetailHeader (sin cambios)
│            [Esperando respuesta]     │
│            Enviada el 27/10          │
│                                      │
│ ┌──────────────────────────────────┐ │  ← Card (borde de tinta 2 px)
│ │ Quien publicó a Tobi te pide     │ │  ← h2 --text-xl bold
│ │ que verifiques tu identidad      │ │
│ │ antes de decidir                 │ │
│ │ [chapita md] Carla, nivel 1      │ │  ← VerificationBadge md + --text-sm
│ │ Es el frente de tu cédula y una  │ │  ← --text-base
│ │ selfie con ella. Las ve solo     │ │
│ │ quien revisa y se borran.        │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │   Verificar mi identidad     │ │ │  ← LinkButton tirita lg
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ...preguntas, lo que contestaste,    │
│ Retirar...                           │
└──────────────────────────────────────┘
```

Variantes del pie de la nota, según su pedido de verificación (research R10):

- `verify` / `retry`: «Verificar mi identidad» o «Intentarlo de nuevo» en `LinkButton`; `retry`
  suma arriba «Tu pedido anterior no se aprobó.» o «Tu pedido anterior venció.» en `--text-sm`.
- `in_review`: `IdentityStamp` «En revisión» (`warning`) y «Puede tardar hasta 2 días.», sin botón.
- `capped`: «Podés volver a intentarlo desde el 12/11.» en `--text-sm`, sin botón.
- `verified`: `IdentityStamp` «Verificada» (`primary`) y «Quien publicó ya lo ve en tu solicitud.»,
  sin botón ni chapitas de quien publicó.

A 1280 px: la nota va primera en la columna ancha, en la medida de lectura (`max-w-[var(--measure)]`),
sobre las preguntas y las respuestas.

- **Reutiliza**: `Dialog`, `ConfirmBody`, `Button` (`primary`, `secondary`, `ghost`, `loading`),
  `SaveFailedStrip`, `LinkButton` (`tirita`, `secondary`), `Card`, `VerificationBadge` (`md`),
  `IdentityStamp`, `ApplicationCard`, `ExitOriginTable`.
- **Crea**: `IdentityAskDialog` (applications; quieto · pidiendo · no llegó con «Reintentar» · ya
  verificó · ya no espera — los dos últimos cierran y refrescan con el texto en `ScreenToast`),
  `IdentityAskLine` (applications; esperando · verificó · cerrado sin aprobar), `IdentityAskNote`
  (applications; `verify` · `retry` · `in_review` · `capped` · `verified`).
- **Tokens**: `--color-ink`, `--color-ink-muted`, `--color-primary` (solo «Verificó su identidad» y el
  sello aprobado), `--color-warning` (solo el sello «En revisión»), `--color-line`, `--text-xl`,
  `--text-base`, `--text-sm`, `--space-3`, `--space-4`, `--space-6`, `--dur-fast` (los estados de
  `Button`).
- **Lo único que llama la atención**: del lado de quien publicó sigue siendo «Aceptar solicitud»;
  «Pedirle la identidad» es `secondary`, porque pedir no es decidir. Del lado de quien solicitó,
  «Verificar mi identidad» en `tirita`, **salvo** que tenga una pregunta sin contestar: ahí la
  tirita es «Enviar respuesta» y el enlace pasa a `secondary` (una tirita por pantalla).
- **Accesibilidad**: la nota es una `section` con `aria-labelledby` a su `h2`; la línea de quien
  publicó es un `p` dentro del estado, sin `aria-live` (no cambia en la pantalla); el `Dialog`
  devuelve el foco al disparador al cerrar y anuncia el error con `role="alert"` (lo hace
  `ConfirmBody`).
- **Estados de los bloques con datos**:
  - Cargando: los `loading.tsx` de `/solicitudes/[id]` y `/mis-solicitudes/[id]` ya existen y no
    cambian; la nota y la línea llegan con la página. La nota aparece en una minoría de solicitudes
    y reservarle lugar en el esqueleto movería todas las demás al cargar. En el `Dialog`, «Pedirle
    la identidad» en `loading` mientras pide.
  - Vacío: sin pedido, la línea y la nota no se dibujan y cada pantalla se ve como hoy (FR-014,
    FR-018).
  - Error: si la página no puede leer la solicitud, el `error.tsx` de cada ruta, como hoy. Si no se
    puede leer el estado de la identidad de quien solicitó, la nota sale en `verify` (spec §Edge
    Cases): la pantalla de verificar muestra el estado real.

### «Por qué no se verificaron» en Encuestas

`ExitOriginTable` suma la columna «Se la pidió quien publicó» a la derecha de «Por su cuenta»; las
columnas salen de `EXIT_ORIGINS` con sus etiquetas de `surveys.exits.origins`. A 390 px siguen
siendo números cortos: la etiqueta de la opción se parte antes que la tabla pida scroll.

## Cómo se construye, por user story

1. **US1 — pedir (P1)**: la migración entera (la tabla, el trigger, `ask_identity`,
   `resolve_identity_asks` y las funciones redefinidas sirven a las cuatro partes), `pnpm db:types`,
   tipos, `publisherIdentityAskView`, `publisherActions`, `identityAskOutcome`, la query y la acción,
   `IdentityAskDialog`, `IdentityAskLine`, la marca en `ApplicationCard`, el correo
   `identity_asked`, `identity_ask_sent`, las pruebas de base de pedir y de privacidad.
2. **US2 — verlo y verificarse (P2)**: `getMyApplication` con el pedido, `myIdentityAskView`,
   `IdentityAskNote`, la marca `solicitud` en la pantalla de verificar, la vuelta y «Ahora no», el
   origen `asked` en la pregunta (exit-question, la acción, Encuestas), las pruebas.
3. **US3 — enterarse al aprobar (P3)**: `resolveIdentityRequest` con los niveles, `opened_first`,
   el correo `identity_verified`, la línea «Verificó su identidad», las pruebas de base de resolver
   y de la regla del correo, el e2e.
4. **US4 — medir (P4)**: `identity_ask_resolved`, la lectura 7 en docs/03 §Métricas de éxito.

Los textos se escriben con el skill `sin-slop` en cada US.

## Complexity Tracking

Sin violaciones de la constitución.
