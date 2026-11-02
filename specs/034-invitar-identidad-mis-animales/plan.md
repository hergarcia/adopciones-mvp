# Implementation Plan: Que «Mis animales» invite a verificar la identidad y diga qué cambia en las publicaciones

**Branch**: `feature/281-mis-animales-invite-verificar` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/034-invitar-identidad-mis-animales/spec.md`

## Summary

«Mis animales» suma, arriba de la pared, una nota con cinta que invita a verificar la identidad a
quien tiene al menos una publicación, el teléfono verificado y puede pedir la identidad hoy, y que
nunca tocó «Ahora no». La decide una función pura (`identityInviteShown`, que reusa `isLevelOne` y
`canRequest`) en un componente de servidor de la ruta, que también manda `identity_offer_viewed` con
el origen nuevo `my_pets`. «Verificar mi identidad» lleva a la verificación de siempre con la marca
`invitacion=1`: el pedido se guarda con origen `my_pets` y «Ahora no» vuelve a «Mis animales». «Ahora
no» de la invitación esconde la nota en el cliente y guarda el día en una tabla nueva sin políticas,
leída por dos funciones. La pregunta de por qué se va suma el origen `invited`. El correo de
identidad aprobada suma «Ver Mis animales» cuando el pedido vino de la invitación. La lectura 11 va a
docs/03 §Métricas de éxito.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router, Server Components y Server Actions)

**Primary Dependencies**: las de siempre (next-intl, zod, Supabase con `@supabase/ssr`, Radix bajo
las primitivas). **Ninguna dependencia nueva**, así que `docs/07-stack.md` no cambia.

**Storage**: Supabase Postgres local; una migración forward-only: una tabla, dos funciones nuevas, dos
redefinidas, cuatro `check` ampliados y dos filas de conteo (data-model.md)

**Testing**: Vitest (unitarias y `tests/db` contra Supabase local), Stryker al 100 % sobre lo que
tiene test, Playwright (un flujo)

**Target Platform**: web mobile-first, 390 px y 1280 px

**Project Type**: aplicación web (Next.js + Supabase)

**Performance Goals**: una sola hoja cliente nueva (`IdentityInviteFrame`, un estado y un `form`), solo
en «Mis animales», que es privada y ya es cliente en la pared. Presupuesto de siempre: JS inicial
< 150 KB, LCP < 2,5 s, Lighthouse mobile ≥ 90

**Constraints**: Ley 18.331 (de «Ahora no» solo el día; nadie más que el sitio lo usa; se borra con la
cuenta); la invitación nunca trae JS a pantallas públicas; leer el estado que falla nunca rompe «Mis
animales»; la medición caída no cambia nada

**Scale/Scope**: beta de 3-5 rescatistas; una pantalla tocada («Mis animales»), dos que suman un
origen (verificar identidad, Encuestas) y un correo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cómo se cumple |
|---|---|
| I. La historia dice el qué | La spec no nombra tablas, rutas ni componentes; el cómo vive acá, en research y data-model. |
| II. Una feature, un PR | Cuatro user stories que se construyen y verifican una por una en la misma rama. |
| III. Compuertas y revisión | Plan de pruebas en research R11: lógica pura con Stryker al 100 %, privacidad y reglas en `tests/db`, un e2e. |
| IV. Reglas como código | Cuándo se muestra es `identityInviteShown` con prueba; «una vez por persona» es la clave primaria; los orígenes válidos son `check` de la base con prueba. |
| V. Datos mínimos y privados | Se guarda el día de «Ahora no» y nada más; tabla sin políticas, funciones que solo miran `auth.uid()`; prueba que intenta leer la marca como visitante, como otra persona y como quien administra; cascada con la cuenta. Nada nuevo de la cédula. |
| VI. Sin deriva | No cambia los pasos, los textos ni las reglas de la verificación, el tope, la revisión, lo que dicen la ficha, la tarjeta, la vista previa o el cartel. Sin invitación al publicar ni por correo. |
| VII. Liviana y linda | Server Components; `IdentityInviteFrame` es la única hoja cliente nueva; tokens y componentes de docs/10; tres estados (§Diseño). |
| VIII. Autonomía con veto | Las siete decisiones de la historia van a docs/03 §1 en esta rama; docs/06 suma «invitación a verificar la identidad»; docs/10 suma las filas de los componentes; ninguna regla que juzga a los agentes cambia. |

Sin violaciones. Re-chequeado después del diseño: igual.

## Project Structure

### Documentation (this feature)

```text
specs/034-invitar-identidad-mis-animales/
├── story.md             # cuerpo verbatim de la historia #281
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
supabase/migrations/20261106120000_identity_invite.sql            # nuevo (data-model.md)
src/lib/supabase/types.ts                                         # regenerado con pnpm db:types
src/lib/verification/identity.ts                                  # IDENTITY_ORIGINS suma my_pets
src/lib/verification/paths.ts                                     # INVITE_FLAG, identityFromInvitePath
src/lib/verification/identity-invite.ts (+ .test.ts)              # nuevo: identityInviteShown, inviteSubject, DISMISS_OUTCOMES
src/lib/verification/exit-question.ts (+ .test.ts)                # invited: EXIT_ORIGINS, ExitPlace, exitPlaceOf, exitOrigin, exitDestination
src/lib/analytics/events.ts                                       # identity_invite_dismissed
src/lib/email/send-identity-result.ts                             # toMyPets en IdentityResult aprobado
src/lib/email/identity-approved-link.ts (+ .test.ts nuevo)        # nuevo: approvedSecondary
src/lib/supabase/queries/identity-invite.ts                       # nuevo: isIdentityInviteDismissed, dismissIdentityInviteRecord
src/actions/identity-invite.ts                                    # nuevo: dismissIdentityInvite
src/actions/review.ts                                             # toMyPets en el resultado aprobado
src/components/verification/identity-invite.tsx                   # nuevo (servidor)
src/components/verification/identity-invite-frame.tsx             # nuevo (hoja cliente)
src/app/[locale]/(app)/mis-animales/page.tsx                      # pone el slot; h1 con id y tabIndex -1
src/app/[locale]/(app)/mis-animales/_components/identity-invite-slot.tsx  # nuevo: lee, decide, mide, arma
src/app/[locale]/(app)/verificar-identidad/page.tsx               # la marca invitacion: origen y vueltas
src/app/[locale]/(app)/_components/identity-routes.ts             # tercer caso, la invitación
src/app/[locale]/_components/identity-invite-texts.tsx            # nuevo: los textos de la nota (t.rich con VerifiedWords)
messages/es.json                                                  # identity.invite.*, emails.identity_approved.my_pets_button, surveys.exits.origins.invited
docs/03-mvp-features.md                                           # las siete decisiones (ya en esta rama) y la lectura 11
docs/06-i18n.md                                                   # «invitación a verificar la identidad»
docs/10-design-system.md                                          # filas de IdentityInvite e IdentityInviteFrame; nota en «Mis animales»
tests/db/identity-invite-support.ts                               # nuevo
tests/db/identity-invite-privacy.test.ts                          # nuevo
tests/db/identity-invite-rules.test.ts                            # nuevo
tests/e2e/identidad-invitacion.spec.ts                            # nuevo
```

**Structure Decision**: la de F00 (CLAUDE.md §Estructura). Dominio `verification`: la invitación es
una oferta del nivel 2, como `IdentityStatusCard`, y el pedido y la pregunta de por qué se va ya
viven ahí. La lectura y la decisión van en un componente de la ruta de «Mis animales», porque los
componentes de dominio no hacen fetch.

## Diseño

Cargado antes de escribir: docs/10 (§Principios, §Recursos del cartel, §Pantallas anchas,
§Componentes, §Textos, §Cómo se aplica) y las filas de `Card`, `LinkButton`, `Button`,
`IdentityStatusCard` (la oferta «Pasá a nivel 2» con `Card taped`), `PublisherLevelLine` (las
palabras y el verde del nivel), `ProfileLinkLine` y `HiddenFromPublicNotice` (lo que ya va entre la
fila de «Publicar un animal» y la pared). Nada nuevo en tokens: es una nota en una pantalla de
trabajo que ya existe. El skill `frontend-design:frontend-design` no está en esta sesión; se carga en
el build, antes de escribir el JSX.

### «Mis animales» con la invitación — 390 px

```
┌──────────────────────────────────────┐
│ Mis animales                         │  ← h1 afiche --text-2xl (id, tabIndex -1)
│ ┌──────────────────────────────────┐ │
│ │ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │ │  ← tirita lg: «Publicar un animal» (sin cambios)
│ │        Publicar un animal        │ │
│ └──────────────────────────────────┘ │
│ ¿Qué quiere decir cada estado?       │  ← TextLink (sin cambios)
│                                      │
│        ▄▄▄▄ (cinta)                  │
│ ┌──────────────────────────────────┐ │  ← Card taped, borde de tinta 2 px, sin inclinar
│ │ Podés verificar tu identidad     │ │  ← h2 afiche --text-xl
│ │                                  │ │
│ │ Si la verificás, Tobi va a decir │ │  ← --text-base ink
│ │ «Identidad verificada» en vez de │ │     «Identidad verificada» en --color-primary medium
│ │ «Teléfono verificado» en:        │ │
│ │ - su ficha                       │ │  ← ul --text-base, viñeta de tinta
│ │ - cada tarjeta del listado       │ │
│ │ - la vista previa del enlace     │ │
│ │ - el cartel para compartir       │ │
│ │                                  │ │
│ │ Las fotos de tu cédula se borran │ │  ← --text-sm ink-muted
│ │ después de revisarlas. La        │ │
│ │ revisión tarda hasta 2 días.     │ │
│ │                                  │ │
│ │ ┌──────────────────────────────┐ │ │
│ │ │   Verificar mi identidad     │ │ │  ← LinkButton secondary md, ancho completo
│ │ └──────────────────────────────┘ │ │
│ │ Ahora no                         │ │  ← Button ghost sm, alineado a la izquierda
│ └──────────────────────────────────┘ │
│                                      │
│ En el enlace de tu perfil se ven…    │  ← ProfileLinkLine (sin cambios)
│ [ pared de animales ]                │  ← PetWall (sin cambios)
└──────────────────────────────────────┘
```

Los textos de arriba son el borrador de la forma; los finales se escriben con `sin-slop` en el build
y siguen FR-006 a FR-008: sin «más solicitudes» ni «más adopciones». Con más de una publicación o una
que no está en el listado, la segunda frase dice «lo que publicás va a decir…» y la lista dice «la
ficha» en lugar de «su ficha».

### «Mis animales» con la invitación — 1280 px

```
┌──────────────────────────── hoja 1200 ─────────────────────────────────┐
│ Mis animales                                                           │
│ [▒▒▒ Publicar un animal ▒▒▒]   ¿Qué quiere decir cada estado?          │
│                                                                        │
│        ▄▄▄▄                                                            │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Podés verificar tu identidad       │ Si la verificás, Tobi va a     │ │
│ │                                    │ decir «Identidad verificada»   │ │
│ │ Las fotos de tu cédula se borran   │ en vez de «Teléfono            │ │
│ │ después de revisarlas. La revisión │ verificado» en:                │ │
│ │ tarda hasta 2 días.                │ - su ficha                     │ │
│ │                                    │ - cada tarjeta del listado     │ │
│ │ [ Verificar mi identidad ]  Ahora no│ - la vista previa del enlace  │ │
│ │                                    │ - el cartel para compartir     │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ En el enlace de tu perfil se ven todos tus animales en adopción.       │
│ [foto] [foto] [foto] [foto]                                            │
└────────────────────────────────────────────────────────────────────────┘
```

Desde 1024 la nota ocupa el ancho del contenido (no la medida de lectura) y se arma en dos columnas
iguales con `--space-16` entre ellas, como `SingleTaskLayout`: a la izquierda el título, la línea de
las fotos y las acciones en un renglón; a la derecha qué cambia y dónde. Así no queda como una
franja angosta con media hoja vacía (FR-009a) y es más baja que en el teléfono, así la pared sigue
cerca de su título. Cada columna en `--measure` como máximo. De 640 a 1023, una columna, con el
botón de ancho automático y «Ahora no» al lado.

- **Reutiliza**: `Card` (`taped`), `LinkButton` (`secondary`, `md`), `Button` (`ghost`, `sm`),
  `PageShell`, `PetWall` y `ProfileLinkLine` sin cambios.
- **Crea**: `IdentityInvite` (verification; servidor; nombra o no a un animal) e
  `IdentityInviteFrame` (verification; cliente; a la vista · cerrada). Una fila cada uno en docs/10
  §Componentes, y la nota de «Mis animales» en la fila de `ProfileLinkLine` (va después de la
  invitación).
- **Tokens**: `--color-ink`, `--color-ink-muted`, `--color-primary` (solo «Identidad verificada»,
  el verde de lo verificado, como `PublisherLevelLine`), `--color-line`, `--color-tape` (de la
  cinta, vía `Card taped`), `--text-xl`, `--text-base`, `--text-sm`, `--font-weight-medium`,
  `--space-3`, `--space-4`, `--space-6`, `--space-8`, `--space-16`, `--measure`, `--dur-fast` (los
  estados de `Button`).
- **Lo único que llama la atención**: sigue siendo «Publicar un animal» (`tirita`). La invitación
  es `secondary` y la nota no lleva sello, acento ni inclinación: la cinta es su único gesto
  (§Recursos del cartel, un gesto por elemento). No lleva chapita: el metal queda para la chapita de
  verdad.
- **Accesibilidad**: la nota es una `section` con `aria-labelledby` a su `h2`; la lista de lugares
  es una `ul`; «Ahora no» es un `button` real dentro de un `form`, de 44 px de alto. Al cerrarse, el
  foco pasa al `h1` de la pantalla (research R10); la desaparición no se anuncia, porque fue la
  persona la que la cerró. Contraste: `--color-primary` da 6,3:1 sobre blanco y pasa 4,5:1 sobre el
  papel (lo usa `PublisherLevelLine` en `--text-sm`).
- **Movimiento**: al cerrar, la nota sale sin animación de alto (mover la pared con una animación
  sería «algo que se mueve solo»); los botones responden con `--dur-fast` como siempre.
- **Estados del bloque**:
  - Cargando: la página trae todo antes de pintar; `loading.tsx` no reserva lugar para la nota,
    como no lo reserva para `ProfileLinkLine` (#238): la mayoría no la ve, y reservarlo movería su
    pared al llegar. La nota está desde el primer pintado o no está (FR-010).
  - Vacío: sin publicaciones, `HeadedEmptyState` de hoy y sin nota (FR-002).
  - Error: si no se puede leer la identidad o la marca de «Ahora no», no hay nota y la página se ve
    como hoy, sin aviso (FR-004).

### La verificación desde la invitación

Sin cambios visibles: la misma pantalla, la misma bajada y los mismos pasos. Cambian solo a dónde
vuelven «Ahora no» y la pregunta de por qué se va (a «Mis animales») y el origen que viaja.

### El correo de identidad aprobada

El de hoy; debajo del botón «Ir a mi perfil», el enlace secundario «Ver Mis animales», en el lugar
donde hoy va «Ver a {nombre}» de #63. Nunca los dos: un pedido de la invitación no trae animal.

### «Por qué no se verificaron» en Encuestas

`ExitOriginTable` suma la columna de la invitación a la derecha de «Se la pidió quien publicó»; las
columnas salen de `EXIT_ORIGINS` con sus etiquetas de `surveys.exits.origins`. El texto de la
etiqueta, con `sin-slop` («Se lo ofreció el sitio» o similar).

## Cómo se construye, por user story

1. **US1 — ver la invitación y verificarse (P1)**: la migración entera (sirve a las cuatro
   partes), `pnpm db:types`, `IDENTITY_ORIGINS`, `identityInviteShown` e `inviteSubject` con sus
   pruebas, `isIdentityInviteDismissed`, la marca y `identityFromInvitePath`, `identityRoutes` y
   `exitDestination` con `invited`, la página de verificar con el origen, `IdentityInvite`,
   `IdentityInviteFrame` (por ahora sin acción en «Ahora no»), el slot, la página, los textos,
   docs/10 y docs/06, las pruebas de base de origen y privacidad de la lectura.
2. **US2 — «Ahora no» (P2)**: `dismissIdentityInviteRecord`, `dismissIdentityInvite`, el cierre en
   `IdentityInviteFrame` con el foco, las pruebas de base de una sola fila y de cascada, el e2e.
3. **US3 — el correo (P3)**: `toMyPets` en `review.ts`, `approvedSecondary` con su prueba, el texto.
4. **US4 — medir (P4)**: `identity_offer_viewed` con `my_pets` en el slot, `identity_invite_dismissed`
   en la acción, `invited` en `EXIT_ORIGINS` y `exitOrigin` con sus pruebas, Encuestas, la prueba de
   base de la pregunta con el origen nuevo, la lectura 11 en docs/03 §Métricas de éxito.

Los textos se escriben con el skill `sin-slop` en cada US.

## Complexity Tracking

Sin violaciones de la constitución.
