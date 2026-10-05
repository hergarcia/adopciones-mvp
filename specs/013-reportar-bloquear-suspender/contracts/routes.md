# Contratos: rutas, acciones y correos

## Rutas

| Ruta | Tipo | Quién | Qué |
|---|---|---|---|
| `/perfil/{id}` | página (cambia) | cualquiera | Suma `ProfileSafetyActions` (Reportar, Bloquear; Suspender para quien administra). Para quien bloqueó: `BlockedProfile`. `?reportar=1` y `?bloquear=1` abren el reporte o la confirmación de bloquear al volver de ingresar; `?bloqueo=hecho` anuncia el bloqueo recién hecho. `noindex` como hoy. |
| `/animales/{code}` | página (cambia) | cualquiera | `petPageState` suma `blocked` (quien bloqueó al publicador): `PetUnavailable` `blocked` con `UnblockButton`. Dueña suspendida → `missing`. |
| `/animales`, `/` | páginas (sin cambio de código) | cualquiera | El listado y la portada vienen filtrados de la base (R2, R7). |
| `/mis-bloqueos` | página (nueva, `(app)`) | con perfil (`requireProfile`) | `MyBlocksList`. `noindex`. |
| `/revision/reportes` | página (nueva, `(app)`) | quien administra | `ReportQueue`. Sin administrar → `notFound()`. `noindex`. |
| `/revision/suspendidas` | página (nueva, `(app)`) | quien administra | `SuspendedAccountsList`. Sin administrar → `notFound()`. `noindex`. |
| `/cuenta-suspendida` | página (nueva, grupo `(suspended)`) | la persona suspendida | `SuspendedScreen`. Sin sesión → `/entrar`; con sesión no suspendida → `/mi-perfil`. `noindex`. Sin `AccountMenu`. |
| `/verificar-telefono/no-se-puede-usar` | página (nueva, `(app)`) | con perfil | `NumberWithheldScreen`. `noindex`. |
| `/sigue-disponible/{token}` · `…/listo` · `…/foto` | Route Handler y página (cambia `[token]`) | cualquiera | `[token]` llama a `redirectIfSuspended()`: con la sesión de una suspendida, su pantalla. Sin sesión o con otra, `renew_by_link` devuelve `invalid` y `renewal_link_view` cero filas si la dueña está suspendida: «el enlace no sirve», sin nombre ni foto. |

Todas las páginas nuevas exportan `generateMetadata` con `robots: { index: false, follow: false }` y
los títulos en `messages/es.json` (`metadata.*`).

## Server Actions — `src/actions/moderation.ts`

Todas devuelven `ActionResult<T>` y no lanzan; el `error` es una clave i18n. La única excepción es
el `redirect` de la puerta de la suspendida dentro de `getSessionUser()` (R4). Todas leen la sesión
con `getSessionUser()`; las de quien administra llaman funciones que vuelven a preguntar
`is_admin()`.

| Acción | Entrada (schema) | Salida ok | Errores |
|---|---|---|---|
| `reportPerson` | `reportSchema`: `publicId`, `reason`, `details?` | `{ blockedAlready: boolean }` (de `vouch_standing`) | `moderation.errors.duplicate`, `.self`, `.not_found`, `.details_required`, `.failed` |
| `blockPerson` | `publicId` (`isPublicId`, como las acciones de avales: un botón sin formulario no lleva schema) | `null`; la confirmación vuelve a `/perfil/{id}?bloqueo=hecho` desde el cliente, como el resto de las hojas de esta historia. Uno que ya estaba es éxito y no se mide | `.self`, `.not_found`, `.session`, `.failed` |
| `unblockPerson` | `publicId` | `{ already: boolean }` (`absent` es ok con `already: true`: «Ya estaba desbloqueada»); vuelve con `?bloqueo=deshecho` o `?bloqueo=ya` | `.session`, `.failed` |
| `closeReport` | `closeReportSchema`: `reportId` (cierra sin medidas) | `null` | `.closed` (con cómo/quién en `detail`), `.own`, `.gone`, `.not_admin`, `.failed` |
| `suspendAccount` | `suspensionSchema`: `publicId`, `reason`, `reportId?` | `null` (desde el perfil redirige a `/revision/suspendidas?suspendida={nombre}`, que muestra «Suspendiste a {nombre}») | `.reason_required`, `.already` (con quién/cuándo), `.self`, `.gone`, `.not_admin`, `.failed` |
| `reactivateAccount` | `reactivateSchema`: `suspensionId` | `null` | `.already`, `.gone`, `.not_admin`, `.failed` |

Después de `suspendAccount`: mandar el correo (si falla, el resultado sigue siendo `ok`, FR-031),
medir, revalidar `/animales`, `/` y el perfil. Las imágenes del pedido retirado ya se borraron en
la misma transacción (están en la base). Después de `reactivateAccount`: correo,
medir, revalidar lo mismo.

`withheld` de `check_phone_code` y de `claim_phone_number` llevan a
`/verificar-telefono/no-se-puede-usar` (con el `para` de siempre). Build: como «en otra cuenta», las
acciones (`confirmPhoneCode`, `confirmPhoneClaim`) devuelven la clave (`verification.errors.number_withheld`,
`verification.claim.errors.withheld`) y la hoja cliente navega con `router.replace` a la ruta que le
pasa la página (`withheldPath(gate)`): un `redirect()` dentro de la acción cortaría el `try` de la hoja,
que ya distingue la red de la respuesta.

En `src/actions/vouches.ts`: `unavailable` de `give_vouch` → `vouches.errors.unavailable` («No se
pudo avalar a esta persona.»).

## Queries — `src/lib/supabase/queries/moderation.ts`

`getAccountStanding()` (cacheada por pedido) · `listReportQueue()` · `countOpenReports()` ·
`listSuspendedAccounts()` · `listMyBlocks(userId)` · `getBlockedProfile(viewerId, publicId)` ·
y las llamadas de escritura que usan las acciones. `vouch_standing` cambia en
`queries/vouches.ts`.

## Correos

| Correo | Cuándo | Contenido |
|---|---|---|
| `emails.account_suspended` | al suspender | Asunto «Suspendimos tu cuenta en {app}». El motivo tal cual (escapado), qué significa, que puede borrar su cuenta, `SUPPORT_EMAIL`. Botón «Ver mi cuenta» → `/cuenta-suspendida`. |
| `emails.account_reactivated` | al reactivar | Asunto «Tu cuenta en {app} está activa de nuevo». Botón «Ir a {app}» → `/mi-perfil`. |

Ninguno nombra a quien reportó ni a quien suspendió.

## Eventos

`person_reported { reason }` · `person_blocked` · `person_unblocked` · `account_suspended { from }`
· `account_reactivated` · `report_closed { resolution, hours }` (uno por reporte cerrado, también
por cada uno que cierra una suspensión).
