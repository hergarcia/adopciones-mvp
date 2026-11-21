# Contrato: acciones y lecturas nuevas o cambiadas

Historia #281. Todas las acciones devuelven `ActionResult<T>` y no lanzan; el `error` es una clave
de i18n.

## `dismissIdentityInvite()` — nueva

`src/actions/identity-invite.ts`. La llama `IdentityInviteFrame` desde un `<form action>`, así anda
sin JavaScript.

| Caso | Devuelve | Efecto |
|---|---|---|
| Sin sesión | `{ ok: false, error: 'identity.invite.errors.session' }` | nada |
| La base devuelve `dismissed` | `{ ok: true, data: null }` | fila con el día; `identity_invite_dismissed` con `origin: 'my_pets'`; `revalidatePath('/mis-animales')` |
| La base devuelve `already` | `{ ok: true, data: null }` | nada nuevo; sin momento |
| La base falla | `{ ok: false, error: 'identity.invite.errors.failed' }` | nada |

La pantalla nunca muestra el error (FR-016): la nota ya se fue cuando la acción contesta.

## `isIdentityInviteDismissed()` — nueva lectura

`src/lib/supabase/queries/identity-invite.ts`. `rpc('identity_invite_dismissed')`. Lanza si la base
falla, así quien la usa decide: el slot de «Mis animales» lo trata como «no se sabe» y no muestra la
invitación (FR-004).

## `approveOrReject` (revisión) — cambia

`src/actions/review.ts`. Aprobado: `IdentityResult` suma `toMyPets: resolved.origin === 'my_pets'`.
Nada más cambia en la acción ni en lo que ve quien revisa.

## `submitIdentityRequest`, `acceptIdentityConsent`, `withdrawIdentityRequest` — sin cambio de código

Aceptan y devuelven `my_pets` porque leen `IDENTITY_ORIGINS`.

## `leaveVerification` (la pregunta de por qué se va) — sin cambio de código

Lee el origen con `exitOrigin(level, exitPlaceOf(from))`, que suma `invited` (research R6), y el
destino con `exitDestination`, que suma `/mis-animales`.

## Direcciones

| Dirección | Quién la arma | Para qué |
|---|---|---|
| `/verificar-identidad?pedir=1&invitacion=1` | `identityFromInvitePath()` | «Verificar mi identidad» de la invitación |
| `/mis-animales` | `MY_PETS_PATH` | la salida sin mandar desde la invitación y el segundo enlace del correo aprobado |
