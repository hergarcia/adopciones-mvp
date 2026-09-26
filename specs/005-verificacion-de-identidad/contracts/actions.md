# Contratos: acciones de servidor y rutas

Acciones en `src/actions/identity.ts`. El id de la cuenta sale de la sesión, nunca del navegador.
Devuelven `ActionResult<T>`; el `error` es una clave de `messages/es.json`.

## `acceptIdentityConsent(): Promise<void>`

- La llama `IdentityRequestForm` al tocar «Acepto y elijo las fotos». Solo `track('identity_consent_accepted',
  { origin })`. El consentimiento de verdad viaja con el envío (abajo).

## `submitIdentityRequest(form: FormData): Promise<ActionResult<null>>`

- **Entrada**: `consent=yes`, `origin`, `front` y `selfie` (los WebP procesados). Validado con
  `identitySubmissionSchema`.
- **Hace**: sin sesión → `identity.errors.session`. Schema inválido → `identity.errors.photo`
  (no se guarda nada). `submit_identity_request`:

| Decisión | Resultado |
|---|---|
| `sent` | `{ ok: true }`; `track('identity_request_sent', { origin })`; `revalidatePath('/mi-perfil')`; la hoja hace `router.refresh()` y la ruta pasa a mostrar el estado. |
| `no_phone` | `{ ok: false, error: 'identity.errors.no_phone' }` (la cuenta bajó a sin verificar en el medio, FR-002); la hoja navega a la puerta. |
| `already_open`, `already_verified` | `{ ok: false, error: 'identity.errors.already_open' }`; la hoja refresca y se ve el estado (FR-009). |
| `capped` | `{ ok: false, error: 'identity.errors.capped' }`; `track('identity_cap_reached')`; refresca. |
| la base no respondió | `{ ok: false, error: 'identity.errors.send_failed' }`: "No se envió y no guardamos nada". |

## `withdrawIdentityRequest(): Promise<ActionResult<null>>`

- `withdrawn` → `track('identity_request_withdrawn', { origin })`, `revalidatePath`, y la hoja
  navega a `/verificar-identidad?guardado=retirado`.
- `not_open` / `expired` → `{ ok: false, error: 'identity.errors.not_open' }`; la hoja refresca
  y se ve el estado real (FR-012b).
- Falla de la base → `identity.errors.withdraw_failed`; el diálogo queda abierto.

## `resolveIdentityRequest(input: { requestId: string; outcome: 'approve' | 'reject'; reason?: RejectionReason }): Promise<ActionResult<{ next: string }>>`

- Validado con `identityResolutionSchema` (motivo obligatorio para rechazar, prohibido para
  aprobar).
- `resolve_identity_request` con el id de la sesión como `p_admin`:

| Decisión | Resultado |
|---|---|
| `approved` / `rejected` | `{ ok: true, data: { next } }` con el próximo pedido más viejo no propio o `/revision`; `track` aprobado/rechazado con `origin`, `reason` y `review_hours`, sin visita; `after(() => sendIdentityResult(…))`. |
| `gone` / `expired` | `{ ok: false, error: 'review.errors.closed' }`; `ReviewWatcher` pregunta el estado y muestra la vista de cerrado. |
| `own_request` | `review.errors.own_request`. |
| `not_admin` | `review.errors.not_admin`; la hoja navega a `/mi-perfil`. |
| falla | `review.errors.resolve_failed`. |

## `checkReviewRequest(requestId: string): Promise<ActionResult<{ state: 'open' | 'resolved' | 'expired' | 'gone' }>>`

- La llama `ReviewWatcher` cada 10 s y después de un `review.errors.closed`. Lee con la sesión (la
  policy decide) y clasifica con `reviewState`. Quien dejó de administrar recibe `gone` (FR-022b).

## `GET /api/revision/[id]/[kind]`

- `kind` ∈ `front | selfie`, `id` un uuid; si no, 404.
- Lee la fila con la sesión; sin fila → 404 sin cuerpo. Con fila → el WebP,
  `Content-Type: image/webp`, `Cache-Control: private, no-store`.

## `POST /api/cron/identidad`

- Encabezado `x-cron-secret` = `CRON_SECRET`; si no, 401 sin cuerpo.
- Con la clave de servicio: lee `identity_expirations` con `notice_pending`, manda
  `sendIdentityResult({ kind: 'expired' })` a cada una (un intento), pone `notice_pending = false`,
  `track('identity_request_expired', …)` sin visita. Responde 204.

## Correos (`src/lib/email/send-identity-result.ts`)

`sendIdentityResult({ userId, kind: 'approved' | 'rejected' | 'expired', on, reason?, capped?,
retryOn?, levelTwoNow, locale })`. Nunca lanza. Enlaces comunes: aprobado → `/mi-perfil`;
rechazado y vencido → `/verificar-identidad`. Textos en `emails.identity_approved`,
`emails.identity_rejected`, `emails.identity_expired`. Sin imágenes, sin datos de la cédula, sin
quién resolvió (FR-026).
