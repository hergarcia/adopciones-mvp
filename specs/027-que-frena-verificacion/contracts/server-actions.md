# Contratos — acciones del servidor y queries

Todas en español los errores como claves de i18n; `ActionResult<T>` de `src/actions/result.ts`.

## `src/actions/verification-exit.ts` (nuevo)

### `leaveVerification(form: FormData): Promise<never>`

El `<form action>` de `NotNowButton`. Campos:

- `level`: `phone` | `identity`.
- `from`: la pantalla con su consulta (`self`), validada con `validPath`.

Hace: vuelve a leer la puerta (`parseGate`) o el animal (`RETURN_FLAG`) de `from`; calcula
`exitOrigin` y `exitDestination`; sin sesión, a ingresar con `from`; `askVerificationExit(level,
origin)`; con ticket, pone la cookie del nivel (`salida-telefono` / `salida-identidad`, `httpOnly`,
`sameSite: 'lax'`, `secure` en producción, `maxAge` un día, `path: '/'`), mide
`verification_exit_asked` y redirige a `from` con `pregunta=1`; sin ticket o si la base falla,
redirige al destino (salir nunca se traba).

### `answerVerificationExit(input: unknown): Promise<ActionResult<null>>`

Entrada: `{ level, option, body }` → `verificationExitAnswerSchema`. Lee el ticket de la cookie del
nivel. Resultado:

- `{ ok: true }` con `answered` (mide `verification_exit_answered` con el origen que devolvió la base)
  y con `already` o sin cookie (no mide): el cliente navega al destino.
- `{ ok: false, error: 'verification.exit.errors.<campo>' }` por el schema (`contact`, `too_long`,
  `option`), con el campo y el fragmento como en `surveyAnswerSchema`.
- `{ ok: false, error: 'verification.exit.errors.failed' }` si la base no contestó.
- La cookie se borra con `answered` y `already`.

El corte de conexión no llega a la acción: el cliente lo ve como un rechazo de la promesa y muestra
`SaveFailedStrip` (patrón de `SurveyCard`).

### `skipVerificationExit(input: unknown): Promise<ActionResult<null>>`

Entrada: `{ level }`. Lee el ticket de la cookie, `skip_verification_exit`, mide
`verification_exit_skipped` con `skipped`, borra la cookie. Siempre `{ ok: true }` salvo sin sesión:
el cliente navega al destino aunque la acción falle (seguir sin contestar nunca se traba; una cuenta
de `skipped` perdida por un corte es aceptable, research R3).

### `cancelPendingPhone` (existente, `src/actions/phone.ts`)

Suma: si cancelar salió bien y `verificationExitDue('phone')`, sigue como `leaveVerification` con
`level = phone` y el mismo `from`. Si no, como hoy.

## `src/lib/supabase/queries/verification-exits.ts` (nuevo)

| Función | Devuelve |
|---|---|
| `verificationExitDue(level)` | `boolean`; `false` si la base falla (la pantalla queda como hoy) |
| `askVerificationExit(level, origin)` | `string \| null` (el ticket) |
| `answerVerificationExit({ ticket, option, body })` | `{ outcome, level, origin } \| null` |
| `skipVerificationExit(ticket)` | `{ outcome, level, origin } \| null` |
| `verificationExitSummary()` | `ExitSummaryRow[]`; lanza si la base falla (la página tiene su `error.tsx`) |
| `verificationExitTexts(level, count)` | `{ items: { id, body, answeredOn }[]; hasMore }` con `readNewest` |

## Cookies

`src/lib/verification/exit-cookie.ts`: el nombre por nivel y las opciones, una sola vez para la
acción y las páginas, que solo leen si existe (nunca el valor fuera de las acciones).
