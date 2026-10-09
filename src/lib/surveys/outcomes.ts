import type { SurveyOutcome } from './types'

export type SurveyResult = { ok: true } | { ok: false; error: string }

// Cada resultado de responder o cerrar a lo que ve la persona (contracts §Server Actions). La
// respuesta que ya había llegado y la encuesta cerrada en otra pestaña terminan igual que un envío
// (spec §Edge Cases): la encuesta se va. Una cuenta suspendida no llega hasta acá —la sesión ya la
// lleva a su pantalla—; si llegara, es como una sesión que se cerró. `invalid` lo frenó antes el
// schema: si la base lo ve igual, no hay nada que corregir en pantalla.
const ERRORS = {
  not_found: 'surveys.errors.not_found',
  suspended: 'surveys.errors.session',
  invalid: 'surveys.errors.failed',
} as const

export function surveyOutcome(outcome: SurveyOutcome): SurveyResult {
  if (outcome === 'answered' || outcome === 'already' || outcome === 'dismissed')
    return { ok: true }
  return { ok: false, error: ERRORS[outcome] }
}
