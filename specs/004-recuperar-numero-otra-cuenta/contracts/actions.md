# Contratos: acciones de servidor

Todas en `src/actions/phone.ts`. El id de la cuenta sale de la sesión, nunca del navegador. Las que
devuelven algo devuelven `ActionResult<T>`; el `error` es una clave de `messages/es.json`.

## `startPhoneClaim(gate): Promise<ActionResult<{ path: string }>>`

- **Entrada**: la puerta (`para`, `next`, `desde`). La llama la hoja `ClaimChoice`.
- **Hace**: sin sesión → `verification.errors.session`. Con sesión: purga,
  `track('phone_claim_chosen')` (se abra la confirmación o no, FR-014), y lee la prueba: vigente →
  `{ ok: true, data: { path: claimPath(gate) } }` y la hoja navega; sin prueba →
  `verification.claim.errors.expired`, y la hoja muestra `ClaimNeedsNewCode` con el número que ya
  tiene.

## `confirmPhoneClaim(number: string, gate: { para?: string; next?: string; desde?: string }): Promise<ClaimResult>`

`number` es el de la pantalla de confirmación, validado con `phoneNumberSchema`: se confirma ese y
no otro (FR-006).

`ClaimResult = ActionResult<{ destination: string }>`.

| Resultado | Cuándo |
|---|---|
| `{ ok: true, data: { destination } }` | `claimed` o `verified_free`: el mismo resultado para los dos (FR-009). `destination = verifiedDestination(parseGate(gate))`. |
| `{ ok: false, error: 'verification.claim.errors.expired' }` | `no_claim`: la prueba venció, quedó sin efecto o es de otro número que el de la pantalla; o el número no es válido (FR-006, FR-008). |
| `{ ok: false, error: 'verification.errors.session' }` | Sin sesión (FR-009c). |
| `{ ok: false, error: 'verification.claim.errors.check_failed' }` | La base no respondió (FR-011). |

- **Efectos**: purga; `claim_phone_number`; `track` de los eventos de `claimOutcome`;
  `revalidatePath('/mi-perfil')` si salió bien; y, solo con `claimed`, `after(() =>
  sendNumberLost(previousUserId, lostOn))`, con el `lost_on` que devolvió la función, que no cambia el resultado ni su demora (FR-010).
- La red cortada del lado del cliente no llega acá: `ClaimConfirmForm` la atrapa, dice
  `verification.claim.errors.check_failed` y llama a `readPhoneClaim` (FR-011).

## `signInWithOtherAccount(form: FormData): Promise<never>`

- **Entrada**: el formulario de «Entrar con esa cuenta», con `next` en un campo oculto.
- **Hace**: toma el id de la sesión; `endSession({ scope: 'local' })`; si `ok`, `dropClaim(id)` (un reintento si falla),
  `track('signed_out')` y `redirect(signInPath(gate))`.
- **Si `endSession` devuelve `ok: false`**: la prueba queda intacta y redirige a
  `inUsePath(gate, { error: 'salir' })`, donde el aviso de error dice que no se pudo cerrar la sesión
  (FR-003). Si `dropClaim` falla con la sesión ya cerrada, sigue a «Entrar» igual (plan §6).

## `readPhoneClaim(number: string, gate): Promise<ActionResult<ClaimReadback>>`

`ClaimReadback = { state: 'owned'; destination: string } | { state: 'pending' } | { state: 'gone' }`.
La usa `ClaimConfirmForm` después de una falla de red (FR-011). Purga, y compara el número que trae la
pantalla con el verificado de la cuenta y con la prueba vigente (`claimReadback`, plan §14). Recibe
también la puerta, para el destino. Sin sesión, `verification.errors.session`.

## `requestPhoneCode(number)` (sin cambios de firma)

La usa `ClaimNewCodeRequest` con el número que tiene a la vista. `reserve_phone_code` ahora borra la
prueba de la cuenta antes de reservar.

## `confirmPhoneCode(code, gate)` (cambia)

Con "número en uso", `ConfirmResult` ya no trae `continueTo`; `PhoneCodeForm` navega a
`inUsePath(gate)`. Con una verificación, los eventos suman `phone_reverified_after_loss` si la
cuenta tenía el aviso.

## Correo: `sendNumberLost(userId: string, lostOn: string): Promise<void>`

`src/lib/email/send-number-lost.ts`. Busca la dirección con `getAccountEmail(userId)` (clave de
servicio), arma el texto con `verification.lost_email.*` y `lostDayLabel(lostOn)`, y llama a
`sendEmail` con un límite de 60 segundos. Nunca lanza: una falla se escribe en el log del servidor
sin la dirección ni el id.
