# Implementation Plan: Que el enlace nuevo del correo lleve a publicar, no a Mi perfil

**Branch**: `feature/119-enlace-nuevo-conserva-destino` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-enlace-nuevo-conserva-destino/spec.md`

## Summary

El destino ya viaja en el enlace del correo (`next` en `/auth/confirm`) y se respeta cuando el
enlace sirve. Se pierde en tres costuras: la redirección a «El enlace no sirve» no lo pasa, sus dos
salidas no lo usan, y «Revisá tu correo» pide otro enlace sin él. El arreglo hace que el destino,
ya filtrado por `safeDestination`, viaje en la URL de esas pantallas (nunca en la cuenta ni en una
cookie) y llegue a `resendLinkFor` / `requestLoginLink`, que ya saben ponerlo en el enlace nuevo.
Las URLs se arman en funciones puras de `src/lib/auth/` con test, porque son la frontera contra un
redirect abierto. Sin cambios visibles, sin textos nuevos, sin base de datos, sin dependencias.

## Technical Context

**Language/Version**: TypeScript strict, Next.js 16 (App Router), React 19

**Primary Dependencies**: next-intl (sin claves nuevas), las ya instaladas; ninguna nueva

**Storage**: N/A. El destino no se guarda: viaja en la query de la URL y en el enlace del correo
(decisión 2026-10-07 del product-owner, FR-008)

**Testing**: Vitest para las funciones puras de destino; Playwright para el flujo de punta a punta
de US1 y US2 contra `next start`

**Target Platform**: web, mobile primero

**Project Type**: aplicación web (Next.js App Router)

**Performance Goals**: sin cambio; las pantallas tocadas no suman JS más allá de un string de prop

**Constraints**: nunca un destino fuera del sitio (FR-006); el correo nunca en la pantalla ni en la
URL de «El enlace no sirve» (FR-010); cero cambios visibles (FR-009)

**Scale/Scope**: 3 pantallas de #9, 1 route handler, 2 componentes cliente, 1 action, 2 módulos
puros

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumple | Cómo |
|---|---|---|
| I. La historia dice el qué | Sí | la spec no nombra rutas ni componentes; el cómo vive acá |
| II. Una feature, un PR | Sí | una capacidad: el destino sobrevive a un enlace que no sirvió |
| III. Compuertas y testeo útil | Sí | test de las funciones que deciden la URL (regla de seguridad: redirect abierto) y un e2e del flujo crítico de ingreso hacia publicar; Stryker al 100 % sobre `next-destination.ts` y `link-problem.ts` |
| IV. Reglas como código | Sí | sin reglas nuevas |
| V. Privacidad | Sí | no se guarda nada nuevo; el destino es una ruta del sitio, no un dato personal; el correo sigue resuelto en el servidor por id |
| Sin scope creep | Sí | nada de "Fuera del MVP"; el pliegue de «Revisá tu correo» es la misma promesa, sin cambio visible |
| Multilingüe | Sí | sin strings nuevos |

Re-check después del diseño: sin cambios.

## Diseño

Sin pantallas nuevas ni cambios visibles (FR-009). Se cargó `docs/10-design-system.md` como
referencia: no se usa ningún token ni primitiva nueva.

- **Componentes reutilizados sin cambio visual**: `LinkProblemScreen` (recibe una prop `next` más),
  `EmailLinkForm` (navega a «Revisá tu correo» con el destino), `ResendLinkButton` (recibe `next`),
  `LinkButton` y `Button` de `ui/`.
- **Componentes creados**: ninguno.
- **Tokens usados**: ninguno nuevo.
- **El elemento que llama la atención**: el mismo de hoy en cada pantalla («Enviarme otro enlace» en
  «El enlace no sirve»; la dirección en «Revisá tu correo»).
- **Tres estados**: estas pantallas no traen bloques de datos; los estados de acción existentes
  (enviando, enviado, error, tiempo de espera) quedan idénticos.

Wireframe: igual al de #9 (`specs/002-registro-e-ingreso`), sin diferencias.

## Diseño técnico

### 1. Funciones puras (`src/lib/auth/next-destination.ts`)

- `carriedDestination(candidate: string | null | undefined): string | null` — el destino que vale la
  pena llevar a la pantalla siguiente: `safeDestination(candidate)` si no es `DEFAULT_DESTINATION`,
  si no `null`. Un destino inválido o ausente se vuelve «sin destino» y no se arrastra (FR-001,
  FR-006).
- `signInPath(next: string | null): string` — `SIGN_IN_PATH` sin destino, `signInWithNext(next)` con
  él. Es el `href` de «Escribir mi correo».
- `checkEmailPath(next: string | null): string` — `/entrar/revisa-tu-correo`, con `?next=` cuando
  hay destino. Es a dónde navega el formulario de correo después de un pedido que salió.

### 2. URL de «El enlace no sirve» (`src/lib/auth/link-problem.ts`)

- `linkProblemPath(motivo: string, linkId: string | null, next: string | null): string` — arma
  `/entrar/enlace?motivo=…[&link=…][&next=…]` con `URLSearchParams`, pasando `next` por
  `carriedDestination`. Reemplaza el armado a mano de `problem()` en el route handler.

### 3. Route handler (`src/app/auth/confirm/route.ts`)

- Lee el `next` crudo una vez y lo pasa a `problem()` en las tres salidas a «El enlace no sirve»
  (`unknown` sin fila, motivo con fila, consumo fallido). `problem()` usa `linkProblemPath`.
- El caso `otra-cuenta` queda igual, sin destino (spec §Edge Cases).

### 4. «El enlace no sirve» (`src/app/[locale]/(auth)/entrar/enlace/page.tsx` + `LinkProblemScreen`)

- La página lee `next` de `searchParams`, lo filtra con `carriedDestination` y lo pasa como prop
  `next: string | null` a `LinkProblemScreen` (solo cuando `canResend(problem)`; con `otra-cuenta`
  va `null`).
- `LinkProblemScreen` llama `resendLinkFor(linkId, next ?? undefined)` y usa
  `href={signInPath(next)}` en «Escribir mi correo». Desde `/entrar`, el formulario de correo y el
  botón de Google ya reciben `next` (de #9): US2-AS6 no requiere más.

### 5. «Revisá tu correo»

- `EmailLinkForm`: `router.push(checkEmailPath(carriedDestination(next)))`.
- La página `revisa-tu-correo` lee `next`, lo filtra con `carriedDestination` y lo pasa a
  `ResendLinkButton`, que llama `requestLoginLink(email, next ?? undefined)` (FR-004). El enlace
  «volver» de esa pantalla usa `signInPath(next)` para no perderlo tampoco.

### 6. Defensa en el servidor (`src/actions/auth.ts`)

- `issueLink` pone en el enlace `carriedDestination(next)` y no el `next` crudo: el argumento de una
  Server Action lo controla el cliente. El efecto visible no cambia (el route handler ya filtra al
  usar), pero el correo nunca lleva un destino de otro sitio. Sin destino o con uno inválido, el
  enlace no lleva `next`.

### Qué no cambia

Rate limit, envío fallido, supersesión, cuenta suspendida (`redirectIfSuspended` en las páginas y
en la resolución de la sesión), completar el perfil (ya sigue a `next`) y la verificación de
teléfono antes de publicar (#10). Ningún texto en `messages/es.json`.

## Qué se testea y por qué

- **`src/lib/auth/next-destination.test.ts`** (se extiende): `carriedDestination`, `signInPath`,
  `checkEmailPath`. Si se rompen, la persona termina fuera del sitio (redirect abierto) o pierde el
  destino: lista de docs/09 §Qué vale la pena testear, punto 1. Casos: destino válido con query,
  ausente, vacío, `/mi-perfil` (se vuelve `null`), URL externa, `//host`, `/\host`, control.
- **`src/lib/auth/link-problem.test.ts`** (se extiende): `linkProblemPath` con y sin `linkId`, con
  destino válido, sin destino, con destino inválido (no aparece), y escape del destino con query.
- **`tests/e2e/enlace-no-sirve.spec.ts`** (nuevo), dos flujos críticos contra `next start`:
  1. US1: portada → «Publicar un animal» → pedir enlace → abrirlo (se consume) → abrirlo otra vez en
     otro contexto del navegador (US1-AS8; además el minuto entre pedidos se cuenta por navegador) →
     «El enlace no sirve» → «Enviarme otro enlace» → abrir el nuevo → completar el perfil →
     verificar teléfono → publicar (US1-AS1, AS2, AS4, AS8).
  2. US2: abrir `/auth/confirm` con un id desconocido y `next=/mis-animales/publicar` → «Escribir mi
     correo» lleva a `/entrar?next=…` → pedir enlace → en «Revisá tu correo» pedir otro → abrir el
     último → llega a completar el perfil con el destino de publicar (US2-AS1, AS3; el resto del
     camino hasta publicar ya lo prueba el flujo 1 y `portada.spec.ts`). Más un paso con
     `next=https://otro.com`: «Escribir mi correo» lleva a `/entrar` sin destino (US2-AS5).
  El e2e es el único lugar que prueba el route handler y el cableado de las props; por eso son dos
  flujos y no uno, y el segundo es corto.
- **No se testea**: las páginas, `LinkProblemScreen` y `ResendLinkButton` (solo pasan la prop), el
  route handler (lo cubre el e2e) y `issueLink` (acción que solo encadena; el filtro que usa ya
  tiene test).

## Project Structure

### Documentation (this feature)

```text
specs/014-enlace-nuevo-conserva-destino/
├── story.md
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/navegacion.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
  app/auth/confirm/route.ts                         problem() con destino
  app/[locale]/(auth)/entrar/enlace/page.tsx        lee y pasa next
  app/[locale]/(auth)/entrar/revisa-tu-correo/page.tsx  lee y pasa next
  components/auth/link-problem-screen.tsx           prop next
  components/auth/email-link-form.tsx               navega con next
  components/auth/resend-link-button.tsx            prop next
  lib/auth/next-destination.ts (+ .test.ts)         carriedDestination, signInPath, checkEmailPath
  lib/auth/link-problem.ts (+ .test.ts)             linkProblemPath
  actions/auth.ts                                   issueLink filtra el destino
tests/e2e/enlace-no-sirve.spec.ts                   US1 y US2 de punta a punta
```

**Structure Decision**: la del repo (CLAUDE.md §Estructura); nada nuevo fuera de los archivos de
arriba.

## Complexity Tracking

Sin violaciones.
