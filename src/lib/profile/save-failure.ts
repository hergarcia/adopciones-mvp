import type { ActionResult } from '@/actions/result'

// La foto viaja achicada en el cliente: un guardado normal tarda pocos segundos aun con 3G, y 30
// dan margen a una subida con mala señal sin dejar a la persona mirando un botón ocupado sin fin
// (research §R4).
export const SAVE_DEADLINE_MS = 30_000

export type SavedProfile = { redirectTo: string; wasComplete: boolean }

export type SaveOutcome =
  { kind: 'result'; result: ActionResult<SavedProfile> } | { kind: 'threw' } | { kind: 'timeout' }

export type NoticeReason = 'offline' | 'no_response' | 'session'

export type SaveVerdict =
  | { kind: 'saved'; data: SavedProfile }
  | { kind: 'invalid'; error: string }
  | { kind: 'notice'; reason: NoticeReason }

export const SESSION_ERROR = 'profile.errors.session'
const SERVER_FAILED = 'profile.errors.save_failed'

// Qué le decimos a la persona según cómo terminó el intento. Un dato rechazado sigue siendo un dato
// rechazado aunque falte la red (FR-006); lo demás es un aviso de que no se guardó, con su motivo.
export function classifySaveFailure({
  online,
  outcome,
}: {
  online: boolean
  outcome: SaveOutcome
}): SaveVerdict {
  if (outcome.kind === 'timeout') return { kind: 'notice', reason: 'no_response' }
  if (outcome.kind === 'threw') {
    return { kind: 'notice', reason: online ? 'no_response' : 'offline' }
  }

  const { result } = outcome
  if (result.ok) return { kind: 'saved', data: result.data }
  if (result.error === SESSION_ERROR) return { kind: 'notice', reason: 'session' }
  // El sitio contestó que no pudo guardar: para la persona es lo mismo que no haber contestado
  // (FR-003), y lo que puede hacer es lo mismo.
  if (result.error === SERVER_FAILED) return { kind: 'notice', reason: 'no_response' }
  return { kind: 'invalid', error: result.error }
}
