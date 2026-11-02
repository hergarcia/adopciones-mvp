import type { ActionResult } from '@/actions/result'
import { SUBMIT_OUTCOMES, submitOutcome, type SubmitDetail } from './submit-outcome'

export const HOLD_OUTCOMES = [...SUBMIT_OUTCOMES, 'held', 'has_held'] as const
export type HoldOutcomeKind = (typeof HOLD_OUTCOMES)[number]

export type HoldRow = {
  outcome: HoldOutcomeKind
  heldId: string | null
  applicationId: string | null
}

/** Quedó esperando la identidad, o salió como siempre porque ya tenía nivel 2 (FR-006). */
export type HoldData = { kind: 'held'; heldId: string } | { kind: 'sent'; applicationId: string }
export type HoldResult = ActionResult<HoldData, SubmitDetail>

const FAILED: HoldResult = { ok: false, error: 'applications.errors.failed' }

function heldOrSent(row: HoldRow): HoldResult {
  if (row.heldId !== null) return { ok: true, data: { kind: 'held', heldId: row.heldId } }
  if (row.applicationId !== null) {
    return { ok: true, data: { kind: 'sent', applicationId: row.applicationId } }
  }
  return FAILED
}

// Cada resultado de dejarla escrita a lo que ve quien escribe (contracts §holdApplication). Lo que
// comparte con mandar una solicitud dice lo mismo que `submitOutcome`; sin el pedido en revisión,
// se queda en el cuestionario con todo escrito y el camino a la pantalla de identidad.
export function holdOutcome(row: HoldRow | null, code: string): HoldResult {
  if (row === null) return FAILED
  switch (row.outcome) {
    case 'held':
    case 'already':
    case 'sent':
      return heldOrSent(row)
    case 'has_held':
      return { ok: false, error: 'applications.held.errors.has_held' }
    case 'needs_identity':
      return { ok: false, error: 'applications.held.errors.no_review' }
  }
  const shared = submitOutcome({ outcome: row.outcome, id: row.applicationId }, code)
  // Stryker disable next-line ConditionalExpression: los resultados que quedan nunca son un envío; la rama solo estrecha el tipo
  return shared.ok ? FAILED : shared
}
