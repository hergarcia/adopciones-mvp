# Contratos — acciones, queries, rutas y correos

Errores como claves de i18n; `ActionResult<T>` de `src/actions/result.ts`. Ninguna acción confía
en el navegador: la sesión se vuelve a leer y la base controla dueño y estado con el candado de la
solicitud (research R2).

## `src/actions/application-responses.ts`

### `askIdentity(input: unknown): Promise<IdentityAskResult>` (nueva)

Entrada: el id de la solicitud (`z.uuid()`). Sin sesión: `{ ok: false, error:
'inbox.errors.failed' }`.

Llama a `askIdentityRecord(user.id, id)` → `ask_identity`. Con `asked`: mide `identity_ask_sent`
con el nivel de ahora de quien publicó (`getApplicationMeasure(id)?.publisherLevel`) y `litter`.
Después, como las demás respuestas, `settle(id, record)`: vacía la bandeja de salida (sale el correo
a quien solicitó) y revalida las dos puntas.

`identityAskOutcome(record)` (pura, `lib/applications/response-outcome.ts`):

| Base | Resultado |
|---|---|
| `asked`, `already` | `{ ok: true, data: { askedAt } }` |
| `verified` | `{ ok: false, error: 'inbox.identity_ask.errors.verified' }` (la hoja refresca: aparece la chapita nueva) |
| `not_waiting` | `{ ok: false, error: 'inbox.errors.not_waiting' }` |
| `gone` · `you_blocked` · `closed` | las claves que ya usan aceptar y preguntar para esos estados (`inbox.errors.gone`, …) |
| `not_found` | `{ ok: false, error: 'inbox.errors.not_found' }` |
| la base no contestó | `failed('inbox.errors.failed', 'ask_identity')` |

El cliente (`IdentityAskDialog`) trata un rechazo de la promesa (corte de conexión) como «no se
pidió», con «Reintentar» dentro del mismo `Dialog` (FR-004); el reintento es la misma llamada, y la
base devuelve `already` si el primero había llegado.

## `src/actions/review.ts`

### `resolveIdentityRequest` (cambia)

`resolveRequest` devuelve además `askerLevels: MeasuredLevel[]` (los que no se pudieron leer, fuera).
Con `approved`: un `identity_ask_resolved` por nivel, `{ visit: false }`, y `drainApplicationNotices()`
en el `after()` que ya manda el correo del resultado, así los avisos a quien publicó salen sin
demorar la revisión. La respuesta a quien revisa no cambia (FR-029).

## `src/actions/verification-exit.ts`

### `leaveVerification` (cambia)

`exitPlaceOf(from)` trae `applicationId`. Antes de usar el origen `asked`, la acción confirma con
`getMyApplication(applicationId)` que la solicitud es de quien sale; si no, la marca se descarta y el
origen y el destino son los de hoy.

## Queries (`src/lib/supabase/queries/`)

| Query | Archivo | Qué hace |
|---|---|---|
| `askIdentityRecord(publisherId, id)` | `application-response-records.ts` | `rpc('ask_identity')` con el cliente de servicio; `null` si la base falla. |
| `getPublisherApplication(id)` | `application-responses.ts` | mapea las tres columnas nuevas (`identityAsk`, `applicantIdentityVerified`). |
| `listPetApplications(petId)` | `application-responses.ts` | mapea `identityAsked`. |
| `getMyApplication(id)` | `applications.ts` | mapea `identityAsk` con `measuredLevelOf(publisher_level)`. |
| `resolveIdentityRequest(…)` | `review.ts` | mapea `asker_levels` con `measuredLevelOf`. |

## Rutas (`src/lib/applications/paths.ts`)

- `APPLICATION_FLAG = 'solicitud'`.
- `identityForApplicationPath(id)` → `/verificar-identidad?pedir=1&solicitud=<id>`.
- `MY_APPLICATION_PATTERN`, para reconocer `/mis-solicitudes/<uuid>` en la puerta del teléfono
  (research R8).

## Pantallas

| Pantalla | Qué cambia |
|---|---|
| `/solicitudes/[id]` (quien publicó) | `IdentityAskLine` debajo del estado, y la oferta en `ResponseActions` (§Diseño). |
| `/solicitudes/animal/[petId]` | `ApplicationCard` lleva «Le pediste la identidad» con un pedido abierto. |
| `/mis-solicitudes/[id]` (quien solicitó) | `IdentityAskNote` arriba de lo demás con un pedido abierto o resuelto y la solicitud `sent`. |
| `/verificar-identidad` | lee `solicitud`, la valida y vuelve a la solicitud (research R7). |
| `/revision/encuestas` | la columna «Se la pidió quien publicó» en `ExitOriginTable`. |

Todas siguen con `robots: { index: false, follow: false }` (FR-032).

## Correos (`emails.applications.<kind>`)

| Clase | A quién | Botón | Lleva |
|---|---|---|---|
| `identity_asked` | quien solicitó | Mi solicitud | que quien publicó a {name} le pide verificar su identidad antes de decidir, que es el frente de la cédula y una selfie y que su solicitud sigue esperando. |
| `identity_verified` | quien publicó | esa solicitud | que una persona que le solicitó a {name} verificó su identidad y su solicitud lo espera. |

Ninguno lleva el teléfono, las respuestas, el nombre de una persona ni nada de la cédula (FR-019,
FR-026). El asunto y el título nombran a la cría con su camada como los demás. Los textos se
escriben con `sin-slop`.
