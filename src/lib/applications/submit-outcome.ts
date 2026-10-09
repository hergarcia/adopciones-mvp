import type { ActionResult } from '@/actions/result'
import type { ApplicationErrors } from '@/lib/schemas/application'
import { petPath } from '@/lib/pets/paths'
import { verifyPath } from '@/lib/verification/gate'
import { applyAfterPhonePath, applyPath } from './paths'

export const SUBMIT_OUTCOMES = [
  'sent',
  'already',
  'not_found',
  'own',
  'you_blocked',
  'unavailable',
  'not_receiving',
  'has_active',
  'rejected',
  'limit',
  'needs_phone',
  'needs_identity',
  'answers_invalid',
] as const
export type SubmitOutcomeKind = (typeof SUBMIT_OUTCOMES)[number]

/**
 * Lo que acompaña a un envío frenado: la solicitud que ya tiene, adónde lleva, o el error de cada
 * pregunta que la base miró con el animal de ahora.
 */
export type SubmitDetail = { id?: string; redirect?: string; errors?: ApplicationErrors }
export type SubmitResult = ActionResult<{ id: string }, SubmitDetail>

const FAILED: SubmitResult = { ok: false, error: 'applications.errors.failed' }

// Cada resultado de la base a lo que ve quien envía (research R5): se queda en el cuestionario con
// todo escrito y el motivo (FR-030), o va a la pantalla que lo resuelve, con el borrador guardado
// (FR-014). Un mismo intento que ya había llegado cuenta como enviado (FR-031).
export function submitOutcome(
  row: { outcome: SubmitOutcomeKind; id: string | null } | null,
  code: string,
): SubmitResult {
  if (row === null) return FAILED
  switch (row.outcome) {
    case 'sent':
    case 'already':
      return row.id === null ? FAILED : { ok: true, data: { id: row.id } }
    case 'has_active':
      return row.id === null
        ? FAILED
        : { ok: false, error: 'applications.errors.has_active', detail: { id: row.id } }
    case 'limit':
    case 'unavailable':
    case 'not_receiving':
      return { ok: false, error: `applications.errors.${row.outcome}` }
    case 'not_found':
      return { ok: false, error: 'applications.errors.not_receiving' }
    case 'needs_phone':
      return {
        ok: false,
        error: 'applications.errors.needs_phone',
        detail: {
          redirect: verifyPath({
            reason: 'apply',
            next: applyAfterPhonePath(code),
            from: petPath(code),
          }),
        },
      }
    case 'needs_identity':
      return {
        ok: false,
        error: 'applications.errors.needs_identity',
        detail: { redirect: applyPath(code) },
      }
    // La rechazaron por este animal mientras contestaba: la ficha le dice que no fue aceptada (FR-023).
    case 'rejected':
      return {
        ok: false,
        error: 'applications.errors.rejected',
        detail: { redirect: petPath(code) },
      }
    // La ficha ya dibuja lo que corresponde: «Editar», o el animal de alguien que bloqueaste.
    case 'own':
    case 'you_blocked':
      return {
        ok: false,
        error: 'applications.errors.not_receiving',
        detail: { redirect: petPath(code) },
      }
  }
  // `answers_invalid`: las respuestas pasaron el schema y la base no las aceptó.
  return FAILED
}
