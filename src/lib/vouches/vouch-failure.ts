import type { ActionResult } from '@/actions/result'
import type { ActionAttempt } from '@/lib/forms/action-deadline'
import { VOUCH_REFUSALS, type VouchRefusal } from './types'

// Una acción sin fotos: 30 s alcanzan con mala señal, como el perfil (research R16).
export { SAVE_DEADLINE_MS as VOUCH_DEADLINE_MS } from '@/lib/profile/save-failure'

export const VOUCH_SESSION_ERROR = 'vouches.errors.session'
export const VOUCH_NOT_FOUND = 'vouches.errors.not_found'

export type VouchOutcome<T> = ActionAttempt<ActionResult<T>>

export type VouchVerdict<T> =
  | { kind: 'ok'; data: T }
  | { kind: 'offline' }
  | { kind: 'no_response' }
  | { kind: 'session' }
  /** La persona mirada borró su cuenta: la pantalla pasa a «este perfil no existe». */
  | { kind: 'gone' }
  /** Un motivo de FR-013: la pantalla se vuelve a dibujar con el lugar de avalar de hoy. */
  | { kind: 'reason'; reason: VouchRefusal }

function refusalOf(error: string): VouchRefusal | undefined {
  return VOUCH_REFUSALS.find((reason) => error === `vouches.errors.${reason}`)
}

// Qué le decimos a quien tocó avalar, retirar o quitar según cómo terminó el intento (FR-014): sin
// conexión y sin respuesta son dos mensajes distintos; que el sitio no pudo es lo mismo que no
// haber respondido, y reintentar es tocar de nuevo el mismo botón.
export function classifyVouchOutcome<T>({
  online,
  outcome,
}: {
  online: boolean
  outcome: VouchOutcome<T>
}): VouchVerdict<T> {
  if (outcome.kind === 'timeout') return { kind: 'no_response' }
  if (outcome.kind === 'threw') return online ? { kind: 'no_response' } : { kind: 'offline' }

  const { result } = outcome
  if (result.ok) return { kind: 'ok', data: result.data }
  if (result.error === VOUCH_SESSION_ERROR) return { kind: 'session' }
  if (result.error === VOUCH_NOT_FOUND) return { kind: 'gone' }
  const reason = refusalOf(result.error)
  if (reason !== undefined) return { kind: 'reason', reason }
  return { kind: 'no_response' }
}
