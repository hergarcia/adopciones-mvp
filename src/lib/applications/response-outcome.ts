import type { ActionResult } from '@/actions/result'
import { verifyPath } from '@/lib/verification/gate'
import { publisherApplicationPath } from './paths'

export const ACCEPT_OUTCOMES = [
  'accepted',
  'already_accepted',
  'rejected',
  'gone',
  'you_blocked',
  'closed',
  'publisher_needs_phone',
  'applicant_needs_phone',
  'not_found',
] as const
export type AcceptOutcome = (typeof ACCEPT_OUTCOMES)[number]

export type ResponseDetail = { redirect?: string }
export type AcceptResult = ActionResult<{ firstResponse: boolean }, ResponseDetail>

const FAILED: AcceptResult = { ok: false, error: 'inbox.errors.failed' }

// Cada resultado de aceptar a lo que ve el publicador (research R5). Un doble toque cuenta como
// aceptada (FR-064); sin su teléfono, al aviso de verificación con la vuelta a la solicitud (FR-011);
// lo demás no cambió nada y dice cómo está ahora (FR-044).
export function acceptOutcome(
  row: { outcome: AcceptOutcome; firstResponse: boolean } | null,
  id: string,
): AcceptResult {
  if (row === null) return FAILED
  switch (row.outcome) {
    case 'accepted':
    case 'already_accepted':
      return { ok: true, data: { firstResponse: row.firstResponse } }
    case 'publisher_needs_phone': {
      const back = publisherApplicationPath(id)
      return {
        ok: false,
        error: 'inbox.errors.publisher_needs_phone',
        detail: { redirect: verifyPath({ reason: 'accept', next: back, from: back }) },
      }
    }
    default:
      return { ok: false, error: `inbox.errors.${row.outcome}` }
  }
}
