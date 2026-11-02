# Contracts: acciones, rutas y momentos

Server Actions devuelven `ActionResult<T>`; el `error` es una clave de i18n. Nunca lanzan.

## `holdApplication` (`src/actions/applications.ts`)

Entrada: el mismo schema zod del cuestionario (`lib/schemas/application.ts`) más `code`,
`attemptId`, `litterCode | null`, `startedAt | null`, `proposedUsed`.

| Resultado de `hold_application` | `ActionResult` |
|---|---|
| `held` / `already` (fila que espera) | `ok`, `{ kind: 'held', heldId }` → redirige a `/solicitar/[code]/dejada?id=<heldId>` |
| `sent` / `already` (solicitud) | `ok`, `{ kind: 'sent', applicationId }` → la confirmación de siempre |
| `has_active` | error `applications.errors.has_active` con el id para ir a Mi solicitud |
| `has_held` | error `applications.held.errors.has_held` → enlace a «Mis solicitudes» |
| `limit` | error `applications.errors.limit` |
| `needs_phone` | error `applications.errors.needs_phone` |
| `needs_identity` | error `applications.held.errors.no_review` (la pantalla de identidad pedida, lo escrito queda) |
| `unavailable` / `not_receiving` / `rejected` / `own` / `you_blocked` / `not_found` | los de `submitApplication` |
| `answers_invalid` | `applications.errors.missing` |
| sin conexión / falla | `applications.errors.connection` / `failed`; lo escrito queda en pantalla |

Momento después de guardar (`deliver`, nunca frena): `application_held` con `held`; con `sent`, el
`application_sent` de siempre con `after: 'identity'`.

## `withdrawHeldApplication` (`src/actions/applications.ts`)

Entrada `{ id: uuid }`. Resultados: `withdrawn` → `ok` y momento `held_application_lapsed` `{ reason:
'withdrawn' }` (desde la bandeja de momentos, como los demás); `released` → error
`applications.withdraw.errors.released` con el id de la solicitud; `closed` → `…errors.closed`;
`not_found` → `…errors.not_found`; falla → `…errors.failed`. La pantalla se refresca con el estado
real.

## Rutas

- `/solicitar/[code]?esperar=1` (y con la marca de la cría): el cuestionario en modo `hold` si la
  puerta da `needs_identity` con `canHold`; si no, lo que la puerta diga.
- `/solicitar/[code]/dejada?id=<held>`: la confirmación; `noindex`; `loading.tsx` y `error.tsx`
  propios (el error dice que quedó guardada y lleva a «Mis solicitudes»).
- `/mis-solicitudes`: suma las que esperan y las que no salieron (sin enlace a un detalle).

## Momentos (PostHog, sin persona)

| Momento | Propiedades | Dónde |
|---|---|---|
| `apply_stopped` | `by`, `litter`, **`hold_offered`** (solo con `by = 'identity'`) | la ruta de «Quiero adoptar» |
| `application_held` | `litter`, `proposed_used`, `seconds` | `holdApplication` |
| `held_application_released` | `litter` | `/api/cron/publicaciones`, desde `held_application_moments` |
| `application_sent` | las de siempre + **`held: true`**, `after: 'identity'` | ídem, junto con el anterior |
| `held_application_lapsed` | `reason` en `expired` · `withdrawn` · `not_receiving` · `capped` · `suspended` | ídem |

## Correos (los tres de resultado de identidad)

`IdentityResult` suma `held: HeldMailLine[]`; vacío = el correo de hoy. Con alguna, el aprobado lleva
«Ver mis solicitudes» como enlace secundario (gana sobre volver al animal).
