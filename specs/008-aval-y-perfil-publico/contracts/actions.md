# Contratos: rutas, Server Actions y queries

Las acciones viven en `src/actions/vouches.ts` y `src/actions/profile.ts`, `'use server'`, y
devuelven `ActionResult<T>` (no lanzan). Los `error` son claves de `messages/es.json`. Ninguna
confía en el cliente: cada una vuelve a mirar la sesión y deja las reglas a la función de la base.

## Rutas

| Ruta | Grupo | Qué es | Indexa |
|---|---|---|---|
| `/perfil/[id]` | `(public)` | El perfil público (US1, US3). `generateMetadata` con `nombre` + sitio; `not-found.tsx` es «Este perfil no existe»; **sin `loading.tsx`** (R9); `error.tsx` de la zona. | `noindex, nofollow` |
| `/perfil/[id]/foto` | `(public)` | Route Handler `GET`: la foto de un perfil completo, `image/webp`, `Cache-Control: private, max-age=300`; 404 si no hay (R7). | — |
| `/niveles` | `(public)` | La explicación de los niveles, `?nivel=1\|2\|3`, `?desde=<ruta>` (R12). | `noindex` hasta M5 |
| `/mis-avales` | `(app)` | «Mis avales» (US4). `loading.tsx`, `error.tsx`. `requireProfile('/mis-avales')`. Lee `listMyVouches`. | `noindex` |
| `/mi-perfil` | `(app)` | Cambia: chapita, ver y copiar el perfil público, «Mis avales» con N. Lee `listMyVouches` para el nivel 3 propio y N (`countingReceived`). | igual |
| `/verificar-identidad` | `(app)` | Cambia: chapita en aprobado. Lee `listMyVouches` para el nivel 3. | igual |

Todas las páginas que muestran el perfil de alguien validan el id con `isPublicId`
(`lib/profile/public-paths.ts`) antes de llamar a la base; las acciones también.

## `giveVouch(publicId: string)`

- **Hace:** sesión → `session` (la pantalla manda a ingresar con la vuelta al perfil); `publicId`
  con el formato de R1 → si no, `not_found`; `give_vouch(user.id, publicId, DB_RULES.p_pending_ttl)`.
  Solo si `created` (el aval se dio en esta llamada): `track('vouch_given')` y, si
  `reached_level_three`, `track('level_three_reached')`. Un `given` idempotente no registra nada.
- **Sale:** `{ ok: true }` · errores `vouches.errors.{session, not_found, save_failed}` y los motivos
  de FR-013 (`self`, `reciprocal`, `blocked`, `vouchee_level`, `voucher_level`), que no tienen texto
  propio: la pantalla muestra el del lugar de avalar (`vouches.slot.*`), que es el mismo (FR-013). Del lado del cliente, `classifyVouchOutcome`
  (R16) suma `offline` y `no_response` (plazo de 30 s), cada uno con su clave; `save_failed` se
  muestra como `no_response`. Con éxito, la hoja cliente hace `router.replace` a la misma ruta con
  `?aval=dado` y `VouchNotice` monta el aviso. Con un motivo de FR-013 (`self`, `reciprocal`,
  `blocked`, `vouchee_level`, `voucher_level`), `router.replace` con `?aval=cambio`: la página se
  vuelve a dibujar y el lugar de avalar muestra el motivo de hoy, anunciado con `role="status"`. Con
  `not_found`, `router.refresh()`: la página pasa a «este perfil no existe».
- **Idempotente:** sí (R4).

## `withdrawVouch(publicId: string)`

- **Hace:** sesión; `withdraw_vouch`. `withdrawn` → `track('vouch_withdrawn')`.
- **Sale:** `{ ok: true, data: { outcome: 'withdrawn' | 'absent' } }` · `session`, `save_failed`,
  y en el cliente `offline` y `no_response`. `absent` no es un error: `?aval=ausente`, el aviso dice
  «Ese aval ya no estaba» y la pantalla se actualiza; `withdrawn` es `?aval=retirado`.

## `removeVouch(publicId: string)`

- **Hace:** sesión; `remove_vouch(user.id, publicId)`. `removed` → `track('vouch_removed')`.
- **Sale:** como `withdrawVouch`; `removed` es `?aval=quitado`.

## `trackProfileMoment(moment, props?)` (en `actions/profile.ts`)

- `'profile_link_copied'` sin props; `'profile_contact_rejected'` con `{ field: 'displayName' |
  'locality', kind: ContactKind }`, validados contra las listas cerradas como `trackPetMoment`.

## `saveProfile` (cambia)

- `validateProfile` devuelve `FieldError` por campo (R5); si alguno es de contacto,
  `track('profile_contact_rejected', { field, kind })`. El resto no cambia.

## Queries (`src/lib/supabase/queries/vouches.ts`, con servicio)

- `getPublicProfile(publicId): Promise<PublicProfile | null>` — `public_profile`, envuelta en `cache()`
  de React: la piden `generateMetadata` y la página en el mismo pedido.
- `getVouchStanding(viewerId, publicId): Promise<VouchStanding | null>` — `vouch_standing`.
- `listMyVouches(userId): Promise<MyVouch[]>` — `my_vouches`.
- `getMyPublicId(): Promise<string>` en `queries/profiles.ts`, con la sesión (la dueña lee su
  propia fila por RLS; `public_id` se suma a las columnas de `getMyProfile`).
- `getPublicAvatar(publicId)` en `queries/avatars.ts`: `avatar_path_for` y la descarga con servicio,
  para la ruta de la foto (R7).

Las cuatro llaman con la clave de servicio **solo** a esas funciones, nunca a `.from('profiles')`
ajeno.
