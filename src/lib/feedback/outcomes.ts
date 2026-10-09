import type { FeedbackOutcome } from './types'

export type FeedbackResult = { ok: true } | { ok: false; error: string }

// Cada resultado de la base a lo que ve quien opina (contracts §Server Actions). El intento que ya
// había llegado —doble toque, el reintento después de un corte— es un envío (FR-025). `invalid` lo
// frenó antes el schema: si la base lo ve igual, no hay nada que corregir en pantalla.
export function feedbackOutcome(outcome: FeedbackOutcome): FeedbackResult {
  if (outcome === 'sent' || outcome === 'already') return { ok: true }
  if (outcome === 'limit') return { ok: false, error: 'feedback.errors.limit' }
  return { ok: false, error: 'feedback.errors.failed' }
}
