# Contratos: Server Actions, compuerta y rutas

Todas en `src/actions/phone.ts`, `'use server'`. Devuelven `ActionResult<T, D>` y **no lanzan**
(`docs/08`); el `error` es una clave de `messages/es.json` y `detail` lleva lo que el mensaje
necesita. Todas empiezan igual: sin sesión devuelven `verification.errors.session`, y la hoja
cliente manda a ingresar con la ruta actual como destino.

```ts
// src/actions/result.ts — el segundo parámetro es nuevo; las acciones de la #9 no cambian.
export type ActionResult<T, D = never> =
  | { ok: true; data: T }
  | { ok: false; error: string; seconds?: number; detail?: D }
```

Qué devuelve cada una lo deciden funciones puras con test (`request-outcome.ts`,
`code-check.ts`); la acción orquesta.

## `requestPhoneCode(input: string): Promise<ActionResult<{ number: string; next: RetryDisplay }, { retry?: RetryDisplay }>>`

`RetryDisplay` lo decide `retry-at.ts` en el servidor, en hora de Uruguay, con los segundos que
faltan (plan §5b): el cliente nunca recibe una hora absoluta.

Pide un código para el número escrito. El schema rechaza el campo vacío, en el formulario y acá.

| Resultado | Cuándo | Qué ve la persona |
|---|---|---|
| `ok`, `number` en formato de pantalla, `next` (cuándo se puede pedir otro) | salió (`send`) **o** se frenó en silencio (`skip`): el mismo resultado, sin ninguna diferencia (FR-006a, FR-011) | la pantalla del código |
| `verification.errors.number_empty` | vacío | en el campo |
| `verification.errors.number_format` | no tiene forma de celular (FR-002) | en el campo |
| `verification.errors.number_landline` | empieza con 2 o 4 | en el campo |
| `verification.errors.number_foreign` | otro código de país | en el campo |
| `verification.errors.same_number` | es el que ya tiene verificado (FR-017c); no cuenta | en el campo |
| `verification.errors.wait`, `detail.retry` | la espera de 60 s es lo que más tarde se libera (FR-010.1) | cuenta regresiva |
| `verification.errors.daily_cap`, `detail.retry` | el tope de 5 en 24 h es lo que más tarde se libera (FR-010.2) | qué día y a qué hora, en hora de Uruguay |
| `verification.errors.site_cap`, `detail.retry` | el techo de 200 del sitio es lo que más tarde se libera (FR-011b) | que por ahora no se pueden mandar, y desde cuándo |
| `verification.errors.number_unreachable` | Twilio rechazó el número (FR-002a); cuenta | en el campo: que lo revise |
| `verification.errors.send_failed` | el servicio falló, o no hay servicio (FR-009a, FR-009c); no cuenta | no salió; reintentar ya |

Cuál de las tres claves de espera va lo decide `next_phone_code_at`: la del freno que se libera más
tarde, con esa misma hora (FR-010a).

Si la promesa de la acción se rechaza en el cliente (se cortó la red), o si Twilio aceptó el mensaje
y después falló `settle`, la hoja muestra `verification.errors.request_unknown` y hace
`router.refresh()` (FR-009e).

Efectos: `purge_phone_records` → `reserve_phone_code` → si `send`, el mensaje →
`settle_phone_code` con `sent`, `rejected` o `failed`.

Eventos (los arma `request-outcome.ts`; ninguno vuelve al cliente):

| Evento | Cuándo |
|---|---|
| `phone_code_requested` | `settle` fue `sent`. **No** con `skip`, `rejected`, `failed` ni con ningún freno |
| `phone_code_cap_reached` | `reserve` devolvió `reached_cap` y el pedido terminó contando (`sent`, `rejected` o `skip`): fue el quinto que cuenta. Un quinto `failed` no dispara |
| `phone_site_cap_reached` | `reserve` devolvió `reached_site_cap` y el pedido terminó contando para el techo (`sent` o `skip`) |

## `resendPhoneCode(): Promise<ActionResult<{ number: string; next: RetryDisplay }, { retry?: RetryDisplay }>>`

Pide otro código para el número a medias, que resuelve del lado del servidor: el cliente no manda
ningún número. Mismos resultados y eventos que `requestPhoneCode`, más
`verification.errors.no_pending` si ya no hay número a medias (se canceló en otra pestaña).
`PhoneCodeForm`, con `ok`, vacía el renglón, muestra `verification.code.resent` con el número y
vuelve a contar la espera y los intentos (FR-007d).

## `confirmPhoneCode(code: string, gate: GateParams): Promise<ActionResult<{ destination: string }, ConfirmDetail>>`

```ts
type ConfirmDetail = {
  attemptsLeft?: number   // code_wrong
  number?: string         // code_superseded: a qué número se mandó el último (FR-007a)
  continueTo?: string     // number_in_use, si era un cambio y la cuenta volvió a nivel 1 en el aviso (FR-008c)
  clearInput: boolean     // true después de un código que no sirvió; false después de check_failed (FR-007c)
}
```

| Resultado | Cuándo |
|---|---|
| `ok`, `destination` | verificado. `next` si es válido; si no, `/mi-perfil?guardado=telefono` (lo decide `gate.ts`, FR-013b, FR-018a) |
| `verification.errors.code_format` | no son seis dígitos después de quitar espacios y guiones (FR-007b); no cuenta como intento |
| `verification.errors.code_wrong`, `attemptsLeft` | equivocado, quedan intentos (FR-007) |
| `verification.errors.code_exhausted` | quinto equivocado, o ya estaba agotado |
| `verification.errors.code_expired` | venció, o no hay código vivo |
| `verification.errors.code_superseded`, `number` | es uno anterior al último (FR-006) |
| `verification.errors.no_pending` | ya no hay número a medias (se canceló en otra pestaña) |
| `verification.errors.number_in_use`, `continueTo?` | el código era correcto y el número es de otra cuenta (FR-008). El número a medias ya se descartó (FR-008b). **La acción no revalida la página**: el mensaje queda a la vista (FR-008c) |
| `verification.errors.check_failed` | la base no respondió, o la promesa se rechazó en el cliente: no cuenta como intento y lo escrito queda (FR-007c) |

Eventos (los arma `code-check.ts`):

| Evento | Cuándo |
|---|---|
| `phone_verified` | verificado |
| `phone_changed` | verificado, y la cuenta tenía otro número verificado |
| `phone_code_failed` | equivocado, agotado, vencido o reemplazado. **No** con `code_format`, `check_failed`, `no_pending` ni `number_in_use` |
| `phone_number_in_use` | número en uso |

## `cancelPendingPhone(formData: FormData): Promise<never>`

Lee el campo oculto `from` —la ruta entera de la pantalla desde la que se cancela, con su
consulta—, llama a `cancel_pending_phone` y redirige a `from` validado con `safeDestination`, con
`guardado=cancelado` o, si falló, `error=cancelar` (lo arma `gate.ts`, sobre una ruta que puede
tener ya su consulta). La pantalla de destino compone el aviso con lo que quedó: en un cambio, "tu
número sigue siendo…"; en una primera verificación, sin número (FR-015a). Si `from` es el aviso y
la cuenta volvió a nivel 1, la página redirige a `next` (FR-013d).

Se usa desde un `<form action>`, así que funciona sin JavaScript; `CancelPendingButton` solo
agrega el estado ocupado. Sin evento.

## Compuerta: `requireVerifiedPhone` (páginas) y `checkVerifiedPhone` (acciones)

En `src/lib/auth/require-verified-phone.ts`, junto a `requireProfile`. Las dos ejecutan
`gateCheck` de `lib/verification/gate.ts`, que tiene test.

```ts
checkVerifiedPhone({ path, reason, from }): Promise<{ ok: true } | { ok: false; gatePath: string }>
```

Para una acción: sin nivel 1, la acción devuelve `verification.errors.gate` con `detail.gatePath` y
la hoja cliente lleva a la persona al aviso sin perder lo que escribió (FR-013). Un `redirect`
dentro de la acción la sacaría del formulario.

`requireVerifiedPhone`, para una página, llama primero a `requireProfile`.

```ts
type GateReason = 'publish' | 'apply'
requireVerifiedPhone({ path: string; reason: GateReason; from?: string }): Promise<Profile>
```

Sin nivel 1 redirige a `gatePath({ reason, next: path, from })`:
`/verificar-telefono?para=<publicar|solicitar>&next=<ruta>&desde=<ruta>`. `from` es la pantalla
desde la que se tocó la acción, para «Ahora no» (FR-013e); si falta, «Ahora no» va al inicio. Con
nivel 1 devuelve el perfil y no hace nada más (FR-013d).

Las historias de publicar y de solicitar llaman a `requireVerifiedPhone` en su `page.tsx` y a
`checkVerifiedPhone` en su acción —la puerta vale también al enviar, FR-013— y no escriben otra
compuerta. Es el piso (FR-013g): el nivel
mínimo que exija un publicador se suma encima, en esa historia.

## Rutas

| Ruta | Grupo | Compuerta | Qué hace |
|---|---|---|---|
| `/verificar-telefono` | `(app)` | `requireProfile` con su propia URL, `para`, `next` y `desde` incluidos | «Verificar teléfono» y, con `para`, «Aviso de verificación pendiente». Con nivel 1 y `para`, redirige a `next` sin mostrar nada |
| `/verificar-telefono/codigo` | `(app)` | `requireProfile`; sin número a medias, vuelve a `/verificar-telefono` con `para`, `next` y `desde`, o a `next` si ya está verificada | «Escribir el código», con «Ahora no» si trae `para` |

Las dos exportan `generateMetadata` con `robots: { index: false, follow: false }`, y tienen su
`loading.tsx`; `/verificar-telefono` tiene además su `error.tsx`, que cubre a las dos.
