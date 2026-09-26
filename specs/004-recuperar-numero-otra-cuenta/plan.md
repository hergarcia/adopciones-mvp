# Implementation Plan: Recuperar un número verificado en otra cuenta

**Branch**: `feature/25-recuperar-numero-otra-cuenta` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: `specs/004-recuperar-numero-otra-cuenta/spec.md` (3 user stories, endurecida en tres
rondas con `spec-grader` y `spec-adversary`; lo que quedó abierto está en sus Assumptions)

## Summary

La historia #10 dejó un callejón: quien escribe bien el código de un número que figura en otra
cuenta solo puede verificar otro número. Esta historia agrega los otros dos caminos —entrar con esa
cuenta, y quedarse con el número— y lo que le pasa a la cuenta que lo pierde: se queda sin el
número, recibe un correo en el momento y ve un aviso en «Mi perfil».

Tres decisiones ordenan el plan:

1. **La prueba es una fila aparte, no un código vivo.** Al descubrir el número en uso,
   `check_phone_code` ya consume el código y descarta el número a medias (historia #10). En vez de
   revivir ese código, anota una **prueba** en una tabla propia, `phone_claims`: una fila por cuenta
   con el número y hasta cuándo vale (el vencimiento del código escrito). Nadie la lee desde el
   cliente, se reemplaza con cualquier pedido que deje un código nuevo, se borra cuando el número se verifica en
   cualquier cuenta, y se consume al confirmar.
2. **Quedarse con el número es una sola función de Postgres, con los candados de las dos
   cuentas.** `claim_phone_number` toma el candado de la cuenta que reclama y el de la que tiene el
   número, en orden de id para que dos reclamos cruzados no se traben, y hace todo o nada: suelta el
   número de la anterior, le anota el día, lo verifica en la nueva. Es el mismo patrón que la
   historia #10 usó para topes e intentos, por el mismo motivo: hecho en la aplicación, dos reclamos
   en paralelo dejarían el número en dos cuentas o en ninguna.
3. **Nada de lo que queda une a las dos cuentas con más precisión que el día.** La cuenta anterior
   guarda `number_lost_on` (un `date`, día de Uruguay); la nueva guarda su `verified_at` truncado al
   comienzo de ese día; y `phones.updated_at`, que nadie lee y que marcaría el instante exacto en las
   dos filas, se borra (FR-013, FR-013f). El id de la cuenta anterior sale de la función solo para
   mandar el correo, en memoria, y no se guarda en ningún lado.

## Technical Context

**Language/Version**: TypeScript 7.0.2 (`strict`), React 19.3, Next.js 16.3.5 (App Router)

**Primary Dependencies**: las de `main`. **Ninguna nueva.** El correo sale por el mismo camino que
el enlace de ingreso (Resend, o `.artifacts/mail/` sin clave). El envío después de responder usa
`after` de `next/server`, que ya trae Next 16.

**Storage**: Postgres de Supabase (local). Una migración: una tabla nueva (`phone_claims`), una
columna nueva (`phones.number_lost_on`), una columna menos (`phones.updated_at` con su trigger),
tres funciones nuevas y cinco cambiadas. Detalle en [data-model.md](./data-model.md).

**Testing**: Vitest (unidad + base local), Playwright (un flujo), Stryker al 100 % sobre lo que
tenga test.

**Target Platform**: web, mobile-first a 390 px.

**Project Type**: aplicación web Next.js, estructura fijada por F00.

**Performance Goals**: los del presupuesto: LCP < 2,5 s, JS inicial < 150 KB, Lighthouse mobile ≥ 90.
Dos pantallas chicas nuevas; el JS de cliente nuevo son cuatro hojas chicas (`ClaimConfirmForm`,
`ClaimChoice`, `ClaimNewCodeRequest` y `ClaimDeadline`, que es solo un temporizador alrededor de
contenido dibujado en el servidor).

**Constraints**: sin dominio: el correo sale de verdad solo a la dirección de la cuenta de Resend
(KL-006); en local y en CI se escribe en `.artifacts/mail/` y de ahí lo lee la prueba.

**Scale/Scope**: 2 rutas nuevas, 7 componentes nuevos más 1 extraído (`FormSubmit`) y 3 cambiados, 1 tabla, 3
funciones nuevas, 0 dependencias.

## Constitution Check

| Principio | Cómo lo cumple este plan |
|---|---|
| **I. La historia dice el qué** | La spec no nombra una tabla ni una ruta; el cómo está acá. |
| **II. Una feature, un PR** | Tres user stories que se construyen y verifican una por una, en un PR. |
| **III. Compuertas verdes y revisión fresca** | `pnpm verify` completo; qué se testea y por qué, en §Qué se testea. |
| **IV. Reglas como código** | Quedarse con el número es una función de la base con candado y su test de concurrencia; que la prueba no la lea nadie y que el día perdido lo lea solo su dueña son permisos y RLS con su test; qué ve la persona según lo que pasó es una función pura con test. |
| **V. Datos personales mínimos y privados** | `phone_claims` sin policies y sin permisos para `anon` ni `authenticated`; el número de la prueba se borra al consumirse, al reemplazarse y en la purga; la cuenta anterior guarda solo un `date`; se borra `phones.updated_at`, que nadie usaba y hubiera unido a las dos cuentas al segundo. |
| **VI. Sin deriva** | Nada de la tabla "Fuera del MVP": el aviso es un correo, no una notificación push. No se recupera la cuenta vieja entera ni se revalida el número cada tanto. |
| **VII. Liviana y linda, medido** | Server Components por defecto; cuatro hojas cliente chicas. Todo contra `docs/10`, sin tokens nuevos. |

**Sin violaciones**: la tabla de Complexity Tracking queda vacía.

## Diseño

Guía: `docs/10-design-system.md`, identidad **«Cartel»**. Cargado
`frontend-design:frontend-design` antes de escribir esta sección.

**La idea que ordena las pantallas.** Quedarse con el número de otra cuenta es la única acción del
producto que le saca algo a otra persona. Por eso no puede verse como un trámite más: la
confirmación dice primero qué le pasa a la otra cuenta, y recién abajo está la tirita. Y por eso,
en «Ese número está en otra cuenta», quedarse con el número **no** es la tirita: el próximo paso
real de la mayoría es verificar otro número o entrar con la cuenta que ya tienen; quedarse con el
número es un desvío deliberado, en `secondary`.

Los `h1` van en `.afiche` y en oración con mayúscula inicial, como todos; los wireframes los
escriben así.

### Tokens, sin ninguno nuevo

Color: `--color-canvas` de fondo; `--color-ink` para texto, bordes y acciones; `--color-ink-muted`
en la hora límite y en la aclaración de «Entrar con esa cuenta»; `--color-accent` solo en errores;
`--color-warning` en el sello del aviso de número perdido («Sin verificar»: le toca actuar a
alguien). Tipografía: `.afiche` en los `h1`, `--text-base` en el cuerpo, `--text-sm` en ayudas,
`--font-weight-medium` en el número (es lo que la persona necesita confirmar, como en
`CodeEntryScreen`). Movimiento: `--dur-fast` en botones, `--dur-base` en la entrada de un error.
`.perforado` en la tirita. **No se agrega ningún token.**

### Ese número está en otra cuenta · `/verificar-telefono/en-otra-cuenta`

Hoy es un estado cliente dentro de `PhoneCodeForm`. Pasa a ser una **ruta**, porque la
confirmación tiene que poder volver a ella (FR-006) y porque después de una sesión vencida hay que
poder volver a encontrarla (FR-009c). `PhoneCodeForm`, al recibir "número en uso", navega ahí con
la puerta (`router.replace`). La página lee la prueba de la cuenta en el servidor.

```
390 px, prueba vigente, sin «Seguir»
┌──────────────────────────────────────┐
│ Ese número está en otra cuenta   (h1)│  role="alert" al llegar
│                                      │
│ El 099 123 456 ya está verificado en │
│ otra cuenta.                         │
│                                      │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ [ Verificar otro número          ]   │  tirita
│                                      │
│ [ Entrar con esa cuenta ]            │  secondary
│ Se cierra la sesión de esta cuenta.  │  ink-muted, aria-describedby
│                                      │
│ [ Es mío y no puedo entrar a esa     │  secondary
│   cuenta ]                           │
│ Podés confirmarlo hasta las 14:32.   │  ink-muted, del servidor
└──────────────────────────────────────┘
```

- Con «Seguir» (era un cambio, se llegó por el aviso de la puerta y la cuenta volvió a nivel 1):
  «Seguir» es la tirita y los tres caminos quedan debajo en `secondary`, como hoy (FR-008c de la
  #10). La página lo decide sola: prueba vigente, cuenta en nivel 1 y una puerta con destino.
- **Vacío**: no aplica; sin prueba vigente la página no dibuja los caminos (ver abajo).
- **Cargando**: `loading.tsx` con el `Skeleton` del título y tres renglones de botón. «Entrar con
  esa cuenta» es un `<form action>` con su hoja cliente de estado ocupado (`FormSubmit`, el patrón
  de `CancelPendingSubmit`), y limpia el borrador del perfil de este navegador al enviarse, como
  toda salida de una cuenta (`AccountActions`). «Es mío…» es la hoja cliente `ClaimChoice`: llama
  a `startPhoneClaim`, que comprueba la prueba **antes** de navegar; mientras tanto el botón queda
  ocupado. Si la prueba sigue, navega a la confirmación; si ya no vale (venció, se pidió otro
  código en otra pestaña, el número se verificó en otra cuenta), reemplaza la pantalla por
  `ClaimNeedsNewCode` con `ClaimNewCodeRequest` y el número que la pantalla ya tiene: nunca se
  pierde el número ni se rebota a «Mi perfil» sin explicación (FR-008). El número no viaja en
  ninguna URL. La pantalla del código ya necesita JavaScript (`PhoneCodeForm`), así que este
  camino también.
- **Error**: si cerrar la sesión falla, la acción no lanza: vuelve a esta misma ruta con
  `?error=salir`, y `PhoneNotice` monta el aviso de error ("No pudimos cerrar la sesión. Probá de
  nuevo."), como `cancelPendingPhone` con `?error=cancelar`. La prueba queda como estaba, porque se
  borra después de cerrar la sesión (FR-003).
- **Prueba vencida o sin efecto**: con la pantalla abierta, cuando pasa la hora límite,
  `ClaimDeadline` —un temporizador que envuelve la pantalla y recibe la vista vencida ya dibujada
  por el servidor como prop— la reemplaza sola (FR-005a). Las hojas de adentro (`ClaimChoice`,
  `ClaimConfirmForm`) cambian a la misma vista con `useExpireClaim()` cuando el servidor les dice
  que la prueba ya no vale: una sola vista vencida por pantalla, no una por hoja. Al tocar «Es mío…» con la prueba ya sin
  efecto, lo mismo (arriba).
- **Carga directa sin prueba** (se escribió la dirección, se volvió después de ingresar): la
  página no puede distinguir una prueba vencida de una que nunca existió (la purga borra las
  vencidas). Decide `claimScreen` (§4): con un teléfono verificado, a «Mi perfil» **sin** marca de
  confirmación; sin teléfono verificado, `ClaimNeedsNewCode` sin número (FR-009c, FR-009d). Esta
  tabla es solo para la carga de la ruta; desde la pantalla abierta manda lo de arriba.

El texto `verification.errors.number_in_use_ways` (el que explicaba cómo entrar o borrar la otra
cuenta) se borra: lo reemplazan los caminos (KL-028).

### Quedarme con este número · `/verificar-telefono/quedarme`

```
390 px
┌──────────────────────────────────────┐
│ Quedarte con el 099 123 456     (h1) │
│                                      │
│ La otra cuenta va a perder este      │
│ número y va a quedar sin verificar.  │
│                                      │
│ Le vamos a avisar por correo y en su │
│ perfil que otra cuenta demostró      │
│ tenerlo, sin decirle cuál.           │
│                                      │
│ Si vuelve a demostrar que el número  │
│ es suyo, puede quedárselo de vuelta. │
│                                      │
│ (si tenía otro) Tu número 098 111 222│
│ deja de estar en tu cuenta.          │
│                                      │
│ Podés confirmarlo hasta las 14:32.   │  ink-muted
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ [ Quedarme con este número       ]   │  tirita
│ Volver                               │  ghost → en-otra-cuenta
└──────────────────────────────────────┘
```

- Cuatro párrafos cortos y no una lista: son consecuencias que se leen en orden, no ítems. Sin
  caja ni sello: el sello marca un estado, y acá no hay ninguno todavía.
- **El elemento que se lleva la atención** es la tirita, como en toda pantalla; el `h1` nombra el
  número, porque lo que se confirma es ese número.
- **Vacío**: no aplica; sin prueba vigente, `ClaimNeedsNewCode` o la redirección de FR-009d.
- **Cargando**: `loading.tsx` con la forma del título, cuatro renglones y el botón. Mientras se
  confirma, la tirita `loading` (spinner sobre el texto, mismo ancho) y no admite otro toque.
- **Error** (debajo de la tirita, `ErrorText` anunciado): la prueba ya no vale → se reemplaza la
  pantalla por `ClaimNeedsNewCode` con el número; no se pudo confirmar (la red) → "No pudimos
  confirmar. Mirá cómo quedó." y la hoja llama a `readPhoneClaim(number, gate)`, que compara el número de
  la pantalla con el verificado de la cuenta y con la prueba: si el número ya es de la cuenta, va
  al destino con la confirmación; si la prueba sigue, se queda con el error y confirmar habilitado;
  si no, `ClaimNeedsNewCode` con el número (FR-011). La confirmación "Teléfono verificado" aparece
  **solo** cuando el verificado de la cuenta es el número de la pantalla. Sesión vencida → a
  «Entrar» con `next = claimPath(gate)`, que lleva la puerta adentro, así al volver siguen el
  destino y «Seguir» (FR-009c).

### Hace falta un código nuevo · `ClaimNeedsNewCode`

```
Con el número a la vista                 Esperando (espera o tope)            Sin el número
┌────────────────────────────────┐      ┌────────────────────────────────┐   ┌────────────────────────────────┐
│ Pedí un código nuevo      (h1) │      │ Pedí un código nuevo      (h1) │   │ Pedí un código nuevo      (h1) │
│ Para quedarte con el número    │      │ Para quedarte con el número    │   │ Para quedarte con el número    │
│ hace falta un código nuevo.    │      │ hace falta un código nuevo.    │   │ hace falta un código nuevo.    │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │      │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │   │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│ [ Mandarme un código nuevo     │      │ [ Mandarme un código nuevo ]   │   │ [ Verificar teléfono        ]  │
│   al 099 123 456            ]  │      │   (deshabilitado)              │   │   LinkButton tirita            │
│                                │      │ Podés pedir otro mañana a las  │   │                                │
│                                │      │ 9:15.   (NextCodeHint)         │   │                                │
└────────────────────────────────┘      └────────────────────────────────┘   └────────────────────────────────┘
```

**Cambio en el build (2026-09-25):** con el número a la vista, el número va en la frase ("Para
quedarte con el 099 123 456 hace falta un código nuevo.") y la tirita dice solo «Mandarme un código
nuevo»: con el número adentro, la tirita se partía en dos renglones apretados a 390 px.

El estado de las dos pantallas cuando la prueba ya no vale. **Reemplaza la pantalla entera,
encabezado incluido**: queda un solo `h1` («Pedí un código nuevo»), una frase ("Para quedarte con
el número hace falta un código nuevo."), y:

- **Con el número a la vista** (la pantalla estaba abierta y pasó la hora): la tirita «Mandarme un
  código nuevo al 099 123 456», que llama a `requestPhoneCode` con ese número y lleva a «Escribir
  el código». Si la espera o el tope no dejan, el botón se deshabilita y `NextCodeHint` dice cuándo,
  con el día y la hora de Uruguay (FR-008); la hoja usa `useRetryCountdown`, como `ResendCode`, y
  la disponibilidad inicial (`RetryDisplay`) la lee la página con `codeAvailability(user.id)`,
  como «Escribir el código».
- **Sin el número** (la página se cargó con la prueba ya vencida: el servidor ya no lo tiene,
  FR-013e): la tirita es un `LinkButton` a «Verificar teléfono», con la puerta.

`ClaimNeedsNewCode` es un solo cascarón de servidor (encabezado y frase) con un lugar para la
acción: el `LinkButton`, o la hoja cliente `ClaimNewCodeRequest` con el número.

### Mi perfil · aviso de número perdido

`PhoneStatusCard` cambia según el estado, con una sola tarjeta y un solo llamado a verificar:

- **Sin teléfono y con el aviso**: `NumberLostNotice` **reemplaza** el cuerpo de la tarjeta de
  "sin teléfono" (el paso pendiente de siempre): la misma `Card` y el mismo «Verificar mi
  teléfono», con el sello y el texto del aviso en lugar de `noneValue` y `noneBody`.
- **A medias y con el aviso**: arriba, `NumberLostNotice` sin botón (una línea con el sello y el
  día); abajo, el `PhoneNumberCard` a medias de siempre, que ya trae terminar, corregir y
  cancelar. Dos sellos, porque son dos estados: «Sin verificar» (perdiste el número) y «Sin
  confirmar» (el nuevo espera el código).

```
Sin teléfono, con aviso                  A medias, con aviso
┌──────────────────────────────────┐     ┌──────────────────────────────────┐
│ Tu teléfono                      │     │ Tu teléfono                      │
│ ┌──────────────────────────────┐ │     │ Sin verificar (sello) desde el   │
│ │ Sin verificar (sello warning)│ │     │ 25 de septiembre de 2026: otra   │
│ │ Desde el 25 de septiembre de │ │     │ cuenta demostró tener tu número. │
│ │ 2026, porque otra cuenta     │ │     │ ┌──────────────────────────────┐ │
│ │ demostró tener tu número. Si │ │     │ │ 098 765 432  Sin confirmar   │ │
│ │ sigue siendo tuyo,           │ │     │ │ [Escribir el código] …       │ │
│ │ verificalo de nuevo.         │ │     │ └──────────────────────────────┘ │
│ │ [ Verificar mi teléfono ]    │ │     │                                  │
│ └──────────────────────────────┘ │     │                                  │
└──────────────────────────────────┘     └──────────────────────────────────┘
```

El sello «Sin verificar» es un estado nuevo del teléfono: se registra en `docs/10` §Decisiones,
junto a «Verificado» y «Sin confirmar» (2026-09-22), con el mismo `--color-warning` que «Sin
confirmar» porque también le toca actuar a la persona.

- Una `Card` con el sello «Sin verificar» en `--color-warning`, como el «Sin confirmar» de
  `PhoneNumberCard`: es un estado y le toca actuar a la persona. Sin nada de la otra cuenta.
- Con un número a medias, el aviso va arriba y debajo el `PhoneNumberCard` a medias de siempre, con
  terminar, corregir y cancelar (FR-011a). Con el teléfono verificado, el aviso no existe
  (FR-011b): la base no deja las dos cosas juntas.
- **Vacío**: sin aviso es el paso pendiente de la #10. **Cargando** y **error**: los del perfil.
- «Verificar mi teléfono» sigue en `secondary`: la tirita de «Mi perfil» es «Editar mi perfil».

### El correo a la cuenta anterior

La misma plantilla que el enlace de ingreso, que pasa a ser una sola (`renderNoticeEmail`): título,
cuerpo, un botón («Ir a mi perfil») a `APP_URL/mi-perfil`, el enlace escrito y una nota al pie.
Ningún token de ingreso en el enlace: es un enlace común (FR-010). Sin el número, sin nada de la
cuenta nueva. El día, en texto largo de Uruguay.

### Componentes

| Componente | Capa | Nuevo / cambia | Qué hace |
|---|---|---|---|
| `NumberInUseWays` | verification | cambia | Recibe el número, la hora límite, la puerta y las acciones; dibuja los tres caminos (más «Seguir» si corresponde). Server component; la hora límite la pinta `ClaimDeadline`. |
| `ClaimNumberScreen` | verification | nuevo | La confirmación entera: `h1` con el número, las consecuencias, la hora límite y `ClaimConfirmForm`. Server component. |
| `ClaimConfirmForm` | verification | nuevo, cliente | La tirita de confirmar, su estado ocupado, sus errores y el cambio a `ClaimNeedsNewCode`. La hoja cliente más chica que hace falta: el resultado decide la pantalla. |
| `ClaimDeadline` | verification | nuevo, cliente | Solo el temporizador: envuelve la pantalla (`children`) y, a los `msLeft` de `claimDeadline` (§13), la reemplaza por la vista vencida que recibe ya dibujada del servidor (FR-005a). La hora "hasta las 14:32" la escribe el servidor. |
| `ClaimChoice` | verification | nuevo, cliente | «Es mío y no puedo entrar a esa cuenta»: llama a `startPhoneClaim`, navega si la prueba vale, o muestra la vista vencida con el número. |
| `ClaimNeedsNewCode` | verification | nuevo | Cascarón de servidor: encabezado, frase y un lugar para la acción. |
| `ClaimNewCodeRequest` | verification | nuevo, cliente | La acción con número: el pedido a un toque, con espera y tope. |
| `NumberLostNotice` | verification | nuevo | La nota del perfil con el sello y el día. Recibe la fecha y los textos. |
| `PhoneStatusCard` | verification | cambia | Suma `lostOn` y monta `NumberLostNotice`. |
| `PhoneCodeForm` | verification | cambia | Con "número en uso" navega (`router.replace`) a `inUsePath(gate)`, que recibe como prop, en vez de montar `NumberInUseWays`. |
| `FormSubmit` | verification | se extrae | La hoja cliente de estado ocupado de un `<form action>`, con `variant` y `label`: `CancelPendingSubmit` pasa a ser esto (`ghost`), y la usa también «Entrar con esa cuenta» (`secondary`). Es la segunda repetición; «Es mío…» no la usa, porque es `ClaimChoice`, que llama a una acción y decide qué mostrar. No sabe del dominio; vive en `verification/` porque todos sus usos son de acá, y se muda a `ui/` cuando la use otro dominio. |

`docs/10` §Componentes se actualiza en este PR con estas filas.

## Project Structure

### Documentation (this feature)

```
specs/004-recuperar-numero-otra-cuenta/
├── story.md
├── spec.md
├── plan.md
├── data-model.md
├── quickstart.md
├── contracts/actions.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```
supabase/migrations/<ts>_phone_claims.sql         tabla, columna, funciones nuevas y cambiadas
src/lib/verification/rules.ts                      (sin números nuevos: la prueba vale lo que el código)
src/lib/verification/claim-outcome.ts (+ .test)    claimOutcome, claimScreen, claimReadback
src/lib/verification/claim-deadline.ts (+ .test)   la hora límite y cuánto falta
src/lib/verification/lost-notice.ts (+ .test)      si «Mi perfil» muestra el aviso, y con qué día
src/lib/verification/code-check.ts (+ .test)       in_use sin continueTo; verified trae was_lost
src/lib/verification/notice.ts (+ .test)           la marca error=salir
src/lib/supabase/queries/session.ts                endSession devuelve { ok } y acepta el alcance
src/lib/verification/phone-status.ts               PhoneRow suma numberLostOn
src/lib/verification/gate.ts (+ .test)             inUsePath, claimPath, signInPath
src/lib/supabase/queries/phone-claims.ts           getMyClaim, claimPhoneNumber, dropClaim
src/lib/supabase/queries/phones.ts                 lee number_lost_on
src/lib/supabase/queries/accounts.ts               getAccountEmail (admin, solo para el correo)
src/lib/supabase/queries/phone-codes.ts            checkPhoneCode trae was_lost
src/lib/email/notice-email-template.ts             la plantilla única (sale de login-link-template)
src/lib/email/send-email.ts                        el envío único (sale de send-login-link)
src/lib/email/send-number-lost.ts                  arma y manda el correo de número perdido
src/lib/analytics/events.ts                        cuatro eventos nuevos
src/actions/phone-claim.ts                         startPhoneClaim, confirmPhoneClaim, readPhoneClaim, signInWithOtherAccount
                                                   (aparte de phone.ts, que con ellas pasaba el tope de líneas del lint)
src/app/[locale]/(app)/verificar-telefono/en-otra-cuenta/{page,loading}.tsx
src/app/[locale]/(app)/verificar-telefono/quedarme/{page,loading}.tsx
src/app/[locale]/(app)/mi-perfil/page.tsx          pasa numberLostOn a PhoneStatusCard
src/app/[locale]/_components/verification-texts.ts textos nuevos
src/app/[locale]/_components/phone-status-texts.ts los textos del aviso de número perdido
src/components/verification/*                      ver §Componentes
messages/es.json                                   verification.claim.*, verification.lost.*, emails.number_lost.* (junto a emails.login_link), metadata.phone_in_use, metadata.phone_claim
tests/db/phone-claims.test.ts                      privacidad, reglas y concurrencia
tests/db/phone-support.ts                          las llamadas a las funciones del teléfono, compartidas con phones.test.ts
src/app/[locale]/(app)/verificar-telefono/_components/claim-route.tsx   lo que comparten las dos rutas al cargarse
tests/e2e/telefono.spec.ts                         el flujo de quedarse con el número
```

## Decisiones técnicas

### 1. La prueba vive en `phone_claims`, una fila por cuenta

`check_phone_code`, en la rama de `unique_violation`, además de lo que hace hoy (código usado,
número a medias descartado, cuenta como estaba) toma el candado del número (§2) y hace `insert …
on conflict (user_id) do update` en `phone_claims` con el número y `valid_until =
v_live.expires_at`: con el candado, la prueba no puede escribirse después de que una verificación
concurrente de ese número borró las pruebas ajenas. La hora límite la lee después la ruta nueva
con `get_phone_claim`; `check_phone_code` no la devuelve. No se
reutiliza la fila del código porque su `number` se borra al consumirse (FR-023 de la #10) y porque
la regla de vida de una prueba es otra.

Se deja sin efecto:
- **un pedido de código que deja un código vivo**: donde la #10 reemplaza los códigos vivos de la
  cuenta —la rama `skip` de `reserve_phone_code` y el cierre `sent` de `settle_phone_code`—, se
  borra también la prueba de la cuenta. Un pedido frenado por la espera, el tope o el techo, o que
  falla al salir, no cambia nada, como en la #10 (FR-005, "vale solamente la última");
- **que el número se verifique en cualquier cuenta**: `check_phone_code` (rama verificada) y
  `claim_phone_number` borran toda prueba de **otras** cuentas con ese número (FR-005, FR-009a). Así
  la que pierde una carrera no se lo saca a la ganadora con la misma prueba;
- **«Entrar con esa cuenta»**: la acción borra la fila después de cerrar la sesión (FR-003);
- **el vencimiento**: toda función compara `valid_until > now()`; la purga
  (`purge_phone_records`) borra las vencidas, y corre en cada pedido de código y en cada
  `startPhoneClaim`, `confirmPhoneClaim` y `readPhoneClaim` (FR-013e);
- **borrar la cuenta**: `on delete cascade`.

### 2. `claim_phone_number`: todo o nada, con los dos candados

```
claim_phone_number(p_user_id, p_number, p_time_zone) → (outcome, was_change, was_lost, previous_user_id, lost_on)
```

`lost_on` es el `number_lost_on` que la función acaba de escribir en la cuenta anterior: el correo
usa ese mismo valor, así el día del correo y el de «Mi perfil» no pueden diferir ni cerca de la
medianoche (FR-011a).

1. Lee la prueba vigente de la cuenta para `p_number`, el número de la confirmación. Sin prueba, o
   con la prueba de otro número → `outcome = 'no_claim'` (FR-006).
2. Busca quién tiene el número verificado (lectura sin candado), y toma
   `lock_phone_account` de las dos cuentas **en orden de id**, y después el **candado del número**
   (`pg_advisory_xact_lock(hashtextextended('phone-number:' || número, 0))`, con nombre:
   `lock_phone_number`, porque lo toman dos funciones). Después de tomarlos
   vuelve a leer la prueba y al dueño: si cambió en el medio, decide con lo que lee ahora. Tomar
   los candados de cuenta en el mismo orden evita que A reclamando a B y B reclamando a A se
   traben; el del número serializa lo que no tiene dueño: dos reclamos de un número libre, o un
   reclamo y una verificación común del mismo número en una tercera cuenta. `check_phone_code`
   toma el mismo candado del número, después del de su cuenta, antes de verificar. Ninguna función
   toma un candado de cuenta después de uno de número, así que no hay ciclo. Y como red de
   seguridad, los pasos 3 y 5 van dentro de un mismo bloque `begin … exception when
   unique_violation`: si salta, se deshacen los dos (la anterior no pierde nada) y la función
   devuelve `no_claim`. La persona ve FR-008, nunca "no pudimos confirmar".
3. Si el número lo tiene otra cuenta: le borra `verified_number` y `verified_at`, le pone
   `number_lost_on` = el día de hoy en `p_time_zone`, y **no toca** su `pending_number` ni sus
   códigos (FR-007.4). `outcome = 'claimed'`, `previous_user_id` = esa cuenta.
4. Si nadie lo tiene: `outcome = 'verified_free'`, `previous_user_id` nulo (FR-009).
5. En los dos casos: la cuenta que reclama queda con `verified_number` = el número,
   `verified_at` = el comienzo del día de hoy en `p_time_zone` (FR-013f), sin número a medias y con
   `number_lost_on` nulo; `was_change` si tenía otro verificado, `was_lost` si tenía el aviso. Borra
   la prueba propia y las de otras cuentas con ese número. Reemplaza los códigos vivos de la cuenta
   (como `cancel_pending_phone`), para que un código viejo no reviva nada.

La zona horaria llega como parámetro desde `URUGUAY_TIME_ZONE` en `lib/verification/rules.ts`,
que es su única fuente, como los números de las reglas de la #10.

`previous_user_id` es el único punto donde el servidor sabe a quién le sacó el número. Vive en la
memoria de la acción lo que tarda en pedir el correo, y no se guarda ni se loguea.

### 3. El correo sale después de responder

`confirmPhoneClaim` responde en cuanto la función termina, y el correo va en `after()` de
`next/server`: busca la dirección con la clave de servicio (`getAccountEmail`), arma el texto y lo
manda, con un límite de 60 segundos hecho con `Promise.race` contra un temporizador, porque el
SDK de Resend no documenta una señal de aborto; pasado el límite, cuenta como falla (FR-010). Los
textos se piden con `getTranslations({ locale, namespace })`, con el idioma tomado antes de
`after()`, para no depender del contexto de la petición. Si falla, se registra en
el log del servidor sin la dirección ni el id, y nada se deshace. Así lo que ve la cuenta nueva, y
cuándo, no depende del correo: `claimed` y `verified_free` tardan lo mismo (FR-009, FR-010).

La plantilla y el envío salen del enlace de ingreso: `login-link-template.ts` pasa a
`notice-email-template.ts` (`renderNoticeEmail`, `renderNoticeText`, que reciben el idioma para el
`lang` del documento en vez del `es` fijo de hoy) y `sendLoginLink` a
`sendEmail`, con el mismo escritor a disco sin `RESEND_API_KEY`. Es la segunda plantilla con la
misma forma, así que se extrae (convenciones §Componentizar). La plantilla no tiene test unitario
(tampoco lo tenía): la cubren los dos e2e que leen `.artifacts/mail/`, el del enlace de ingreso y
el de esta historia.

### 4. Las dos pantallas nuevas leen la prueba en el servidor

`getMyClaim()` llama a `get_phone_claim(p_user_id)` con la clave de servicio, después de
comprobar la sesión, y devuelve `{ number, validUntil }` solo si la prueba vale; nulo si no. Es la
única lectura de la prueba, y la hace el servidor para la dueña: `phone_claims` no tiene policies
ni permisos para `anon` ni `authenticated` (FR-013e). La página decide con una función pura
(`claimScreen` en `claim-outcome.ts`):

| Estado | `en-otra-cuenta` | `quedarme` |
|---|---|---|
| prueba vigente, cuenta en nivel 1 y puerta con destino | los caminos **con «Seguir»** al destino | la confirmación |
| prueba vigente, sin nivel 1 o sin destino | los caminos, sin «Seguir» | la confirmación |
| sin prueba, cuenta con teléfono verificado | «Mi perfil», sin marca | «Mi perfil», sin marca |
| sin prueba, sin teléfono verificado | `ClaimNeedsNewCode` sin número | `ClaimNeedsNewCode` sin número |

Sin prueba, la página no sabe si venció, si se consumió o si nunca existió; por eso nunca dice
"Teléfono verificado". Con un teléfono verificado, «Mi perfil» muestra el estado real; sin él, se
explica que hace falta un código nuevo. FR-011 no pasa por esta tabla: lo resuelve
`readPhoneClaim(number)` (§14), que sí sabe de qué número se trata porque lo trae la pantalla.

### 5. «Es mío…» es una acción, para medir el toque

`startPhoneClaim(gate)`: comprueba la sesión, purga, registra `phone_claim_chosen` y lee la prueba.
Devuelve la ruta de la confirmación si vale, o `claim.errors.expired` si no, y la hoja `ClaimChoice`
navega o muestra la vista vencida con el número que ya tiene (§Diseño). El toque se mide del lado
del servidor, se abra la confirmación o no (FR-014), y la prueba se comprueba antes de navegar, así
el número nunca se pierde en el camino.

### 6. «Entrar con esa cuenta»

`signInWithOtherAccount(form)`: toma el id de la sesión, `endSession({ scope: 'local' })`, borra la
prueba de ese id con la clave de servicio (`dropClaim`), registra `signed_out` y redirige a
`signInPath(gate)` (`/entrar?next=<next>` con el `next` de la puerta si es válido). Hoy
`endSession` descarta el `error` de `signOut()` y nunca falla: pasa a devolver `{ ok: boolean }`
(la salida de «Mi perfil» lo ignora como hoy), y a aceptar el alcance. `local` cierra **esta**
sesión, como dice la pantalla; la salida de «Mi perfil» sigue como está. Si `ok` es falso, no toca
la prueba y redirige a `inUsePath(gate, { error: 'salir' })` (FR-003); `screenNotice` suma esa
marca (`verification.notice.sign_out_failed`) y `PhoneNotice` la muestra como el error de cancelar. Si la sesión se cerró pero
`dropClaim` falla dos veces (se reintenta una), se sigue igual a «Entrar»: la prueba vence sola en menos de 10 minutos, y solo
la podría usar esa misma cuenta volviendo a entrar, que es quien demostró tener el número. Queda
en §Riesgos.

### 7. «Mi perfil» y el aviso

`phones` suma `number_lost_on date`, con `check (verified_number is null or number_lost_on is
null)`: el aviso y un teléfono verificado no pueden convivir (FR-011b). `check_phone_code` (rama
verificada) y `claim_phone_number` lo ponen en nulo. La fila de una cuenta que perdió el número y
no tiene nada más ya no se borra: `cancel_pending_phone`, `purge_phone_records` y la rama
`in_use` de `check_phone_code` borran la fila solo si además `number_lost_on is null`.
`lostNotice(row)` decide si se muestra y con qué día. El día es un `date` de calendario, no un
instante: se lee como `YYYY-MM-DD` y se formatea con `dateStyle: 'long'` y `timeZone: 'UTC'`
sobre la medianoche UTC de ese día (`lostDayLabel`). Formatearlo como el instante de "Nivel 1
desde…", con la zona de Uruguay, lo correría al día anterior. El correo usa la misma función, así
que el día es el mismo en el perfil y en el correo (FR-011a).

La policy `phones_select_own` ya deja leer solo la fila propia, así que el día lo ve solo su dueña
(FR-013b) sin policy nueva. Nadie escribe `phones` desde el cliente (historia #10).

### 8. `phones.updated_at` se borra

Nadie lo lee (ni la aplicación ni un test), y en este flujo marcaría el mismo instante en las dos
filas: es exactamente el registro que une a las dos cuentas (FR-013f). La migración borra el
trigger `phones_touch_updated_at` y la columna. `touch_updated_at()` sigue, porque la usa
`profiles`.

### 9. Qué ve la persona: `claimOutcome`

Función pura en `lib/verification/claim-outcome.ts`, como `codeCheckOutcome`: de los hechos de
`claim_phone_number` (o `null` si la base no respondió) al `ActionResult` y los eventos.

| Hechos | Resultado | Eventos |
|---|---|---|
| `null` | `check_failed`, sin limpiar nada | — |
| `no_claim` | `claim_expired` | — |
| `claimed` | ok, destino | `phone_verified`, `phone_claimed`, `phone_number_lost` (+`phone_changed` si `was_change`, +`phone_reverified_after_loss` si `was_lost`) |
| `verified_free` | ok, destino | `phone_verified`, `phone_claimed` (+ los mismos opcionales) |

`claimed` y `verified_free` devuelven exactamente el mismo resultado (FR-009). El destino es el de
la #10: `verifiedDestination(gate)`.

### 10. Los eventos

Cuatro nuevos en `EVENTS`, sin datos de la persona, con la marca de visita de la #9:
`phone_claim_chosen` (FR-014 "elegido"), `phone_claimed` ("confirmado"), `phone_number_lost`
("número perdido"), `phone_reverified_after_loss`. Ninguno se dispara siempre junto con otro:
`phone_claimed` sin `phone_number_lost` en `verified_free`; `phone_reverified_after_loss` también
desde `check_phone_code`, al verificar otro número. `phone_verified` ya se registraba solo cuando la
cuenta queda verificada, así que no se cuenta dos veces.

### 11. Encontrable

Las dos rutas nuevas son privadas: `generateMetadata` con título de `messages/es.json` y
`robots: { index: false, follow: false }`, como las otras de verificación.

### 12. Borrar la cuenta

`phone_claims` cae por `on delete cascade` sobre `auth.users`, y `number_lost_on` con la fila de
`phones`. La confirmación del borrado ya nombra el teléfono; el día perdido es parte del teléfono y
no se nombra aparte.

### 13. La hora límite: `claimDeadline`

Función pura en `lib/verification/claim-deadline.ts`: de `validUntil` y `now` a `{ label, msLeft }`,
con `label` en hora de Uruguay ("14:32") usando el mismo formateador de `retry-at.ts`, y `msLeft`
nunca negativo. `ClaimDeadline` programa el cambio con `msLeft`; en `0` la prueba ya no vale
(`valid_until > now()` en la base, con el mismo borde).

### 14. Leer el estado real después de una falla: `readPhoneClaim`

`readPhoneClaim(number, gate)`: acción de lectura. Primero pasa el número por `phoneNumberSchema`
(`lib/schemas/phone`), el mismo del formulario, que acepta `099 123 456` y lo deja en E.164; un
número que no pasa es `gone`. Después compara con el verificado de la cuenta y con la prueba
vigente, y devuelve `owned` (con el destino), `pending` o
`gone`. La decide `claimReadback` en `claim-outcome.ts`. No revela nada que la cuenta no sepa: el
número lo trae ella y la respuesta es sobre su propia cuenta.

### 15. Los permisos de `check_phone_code`

Al cambiar su tipo de retorno se hace `drop function` + `create`, y Supabase le vuelve a conceder
`execute` a `anon` y `authenticated`. La migración repite `revoke all … from public, anon,
authenticated` y `grant execute … to service_role` con la firma nueva, y el test existente de
`tests/db/phones.test.ts` que prueba que `anon` y `authenticated` no ejecutan las funciones del
teléfono suma las tres nuevas (esa aserción vive ahí, no en `phone-claims.test.ts`).

## Qué se testea, y por qué

Contra `docs/09` §Qué vale la pena testear. Todo lo que tiene test va al 100 % de mutación.

| Archivo | Por qué | Qué afirma |
|---|---|---|
| `tests/db/phone-claims.test.ts` | Regla de privacidad y regla de negocio con consecuencias, en la base | **Privacidad**: `phone_claims` no la lee ni la escribe `anon`, otra cuenta ni la dueña; `number_lost_on` lo lee solo la dueña, y la dueña no lo puede actualizar ni borrar su fila; `phones` ya no tiene `updated_at`. **Reglas**: el número pasa de A a B, A queda sin verificado y con el día de hoy en Uruguay, B con `verified_at` al comienzo del día; A conserva su cambio a medias y su código vivo; sin prueba, prueba vencida, prueba después de otro pedido de código y prueba de otra cuenta: `no_claim` y nada cambia; número libre: `verified_free` y A no se toca; dos reclamos en paralelo: uno `claimed`, el otro `no_claim`, el número en una sola cuenta; la cuenta que reclama queda sin número a medias, con sus códigos vivos reemplazados (uno viejo ya no verifica nada), con `was_change` si tenía otro verificado y ese otro libre para otra cuenta; reclamos cruzados en paralelo terminan sin trabarse; dos reclamos en paralelo de un número libre, y un reclamo en paralelo con la verificación común de ese número en una tercera cuenta: uno gana y el otro recibe `no_claim` o `in_use`; un reclamo en paralelo con A terminando un cambio (`check_phone_code`) y con A cancelando (`cancel_pending_phone`): se serializan y el número queda en una sola cuenta; verificar el número en otra cuenta borra las pruebas ajenas; `check_phone_code` verificado limpia `number_lost_on`; la purga, cancelar y "número en uso" no borran una fila con `number_lost_on`; la purga borra las pruebas vencidas y deja las vigentes; un pedido frenado por la espera o el tope, o que falla al salir, no borra la prueba, y uno que sale o que el tope por número frena en silencio sí; borrar la cuenta borra la prueba. **El día de la zona**: la prueba no puede fijar el `now()` de Postgres, así que llama a `claim_phone_number` con una zona cuyo día de hoy difiera del de UTC en ese momento (`Pacific/Kiritimati`, UTC+14) y afirma `number_lost_on = (now() at time zone zona)::date` y `verified_at = date_trunc('day', now() at time zone zona) at time zone zona`: prueba que el día sale del parámetro y no de UTC. |
| `src/lib/verification/claim-outcome.test.ts` | Regla de lo que ve la persona según lo que pasó, con casos que engañan si se rompen | Cada fila de la tabla de §9: resultado, destino, eventos exactos; `claimed` y `verified_free` dan el mismo resultado; `null` no limpia lo escrito. Cada fila de `claimScreen` (§4): «Seguir» solo con prueba vigente, nivel 1 y destino; sin prueba nunca hay marca de confirmación. `claimReadback` (§14): `owned` solo si el verificado es el número de la pantalla, aunque la cuenta tenga otro verificado. |
| `src/lib/verification/claim-deadline.test.ts` | La hora que se le promete a la persona y el momento en que la pantalla cambia | Un segundo antes de `validUntil` queda 1 s; exactamente en `validUntil`, 0; después, 0 y no negativo; una hora límite a las 23:58 de Uruguay se dice "23:58" aunque en UTC sea otro día. |
| `src/lib/verification/gate.test.ts` | Ya tiene test; suma tres rutas | `inUsePath`, `claimPath` y `signInPath` conservan la puerta (y `signInPath` solo un `next` válido); `inUsePath(gate, { error: 'salir' })` suma la marca sin perder la puerta; sin puerta no agregan consulta. |
| `src/lib/verification/notice.test.ts` | Ya tiene test; suma una marca | `error=salir` da el aviso de error de cerrar la sesión. |
| `src/lib/verification/lost-notice.test.ts` | Decide si se le dice a alguien que perdió su número, y con qué día | Aviso solo si hay `numberLostOn` y no hay verificado; `lostDayLabel('2026-09-25')` dice el 25 y no el 24, el corrimiento de zona que rompería la fecha. Que la base guarde el día de Uruguay (una pérdida a las 22:30 de Uruguay es ese día y no el siguiente) lo afirma el test de base. |
| `src/lib/verification/code-check.test.ts` | Ya tiene test; cambia la rama `in_use` y la verificada | `in_use` devuelve `number_in_use` sin `continueTo`: el «Seguir» lo decide ahora la página de la ruta nueva, a partir del estado del teléfono y la puerta (§4); `was_lost` agrega `phone_reverified_after_loss` a los eventos de una verificación. |
| `tests/e2e/telefono.spec.ts` | Uno de los flujos críticos, y la privacidad del correo | Las pruebas comparten la base, así que **no toca a las personas sembradas**: crea dos cuentas por corrida con `uniqueEmail()` y `uniqueNumber()`, como el e2e de la #10. La primera verifica el número; la segunda pide su código, lo escribe, ve los tres caminos, «Es mío…», confirma y llega al destino de la puerta, verificada; hay un correo para la primera en `.artifacts/mail/` que no contiene el número en ninguna de sus formas ni el nombre ni el correo de la segunda, y cuyo único enlace es `/mi-perfil` sin token de ingreso; la primera entra con `linkFor` y ve el aviso con el día. El tramo de la segunda cuenta empieza en el aviso de la puerta (`/verificar-telefono?para=publicar&next=/mi-perfil/editar`), así que al confirmar llega a `/mi-perfil/editar` y no a «Mi perfil» (SC-007). **SC-008**: en el camino, con `tests/e2e/support/web-vitals.ts` (4G y CPU ×4), LCP < 2,5 s y CLS < 0,05 en `/verificar-telefono/quedarme`, y la tirita de confirmar habilitada (hidratada) antes de los 2,5 s, como la #10 midió sus pantallas con sesión. |

**No se testea**: `send-number-lost.ts` (arma el correo y llama al envío; lo que expone un dato —qué dice el correo— lo afirma el e2e, y el límite de 60 s es un `Promise.race` de una línea sin regla de negocio), los momentos de medición uno por uno (FR-014a: los recorre `acceptance-qa` en la app real, como en la #10; los eventos exactos de cada resultado sí los afirma `claim-outcome.test.ts`), las páginas, `ui/`, `NumberLostNotice` y `ClaimNumberScreen` (solo pintan),
`getMyClaim` y `getAccountEmail` (queries finas), la plantilla del correo (ya probada por el enlace
de ingreso, y no recibe el número: no lo puede mostrar).

## Documentación en este PR

- `docs/03-mvp-features.md`: las cuatro **Decisión (2026-09-25, product-owner)** de la historia
  (§1 y §4), ya escritas en la etapa Spec.
- `docs/10-design-system.md` §Decisiones: el sello «Sin verificar» del número perdido, con fecha.
- `docs/10-design-system.md` §Componentes: las filas de §Componentes; `CancelPendingButton` usa
  `FormSubmit`.
- `docs/06-i18n.md` §Glosario: "quedarse con el número" (claim) y "prueba" en este sentido, para
  que el código diga `claim` y la interfaz, "quedarte con el número".
- `docs/known-limitations.md`: KL-028 pasa a resuelta por la historia #25.
- `docs/07-stack.md`: nada; no hay dependencia nueva (`after` es de Next).

## Riesgos

- **El correo puede no salir** y no se reintenta hasta que exista el cron (M5). La cuenta anterior
  se entera igual por «Mi perfil». Asunción de la spec, a validar por Hernán.
- **La purga depende del tráfico** hasta M5: una prueba vencida puede quedar guardada más de 10
  minutos, pero ninguna función la usa (`valid_until > now()` en todas) y la purga corre en cada
  pedido de código y en cada acción de esta historia.
- **`dropClaim` puede fallar después de cerrar la sesión** (§6): la acción lo reintenta una vez;
  si falla de nuevo, la prueba sobrevive hasta 10 minutos, usable solo por la misma cuenta. Está en
  las Assumptions de la spec.
- **Cambiar la precisión de `verified_at` solo en este camino** hace que un `verified_at` a
  medianoche sugiera, a quien administra, que la cuenta se quedó con un número de otra. No dice de
  cuál, y la spec ya acepta la correlación por día (Assumptions).
