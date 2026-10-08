import type { FollowUpOutcome, StageOutcome } from './types'

export type FollowUpResult = { ok: true } | { ok: false; error: string }

// Cada resultado de subir una foto o de mandar la respuesta a lo que ve quien adoptó (contracts
// §Server Actions). El doble toque o el reintento que ya había llegado es un éxito (FR-013). Una
// cuenta suspendida no llega hasta acá —la sesión ya la lleva a su pantalla—, y si llegara, ve lo
// mismo que con el pedido cerrado.
export function followUpOutcome(outcome: FollowUpOutcome | StageOutcome): FollowUpResult {
  switch (outcome) {
    case 'answered':
    case 'already':
    case 'staged':
      return { ok: true }
    case 'suspended':
      return { ok: false, error: 'follow_ups.errors.closed' }
    default:
      return { ok: false, error: `follow_ups.errors.${outcome}` }
  }
}
