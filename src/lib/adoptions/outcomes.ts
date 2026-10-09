import type { CommitmentOutcome, HandoverOutcome } from './types'

export type HandoverResult =
  | { ok: true }
  | {
      ok: false
      error: string
      /** Qué hace la pantalla: volver a elegir entre las aceptadas de ahora, o ver cómo quedó. */
      then: 'choose_again' | 'show_state'
    }

// Cada resultado de marcar adoptado a lo que ve quien publicó (contracts §Server Actions). Un doble
// toque o un reintento que ya había llegado es un éxito (FR-055); la elegida que dejó de estar
// aceptada vuelve a la lista (FR-004); el animal que cambió muestra cómo quedó (US1-AS10).
export function handoverOutcome(outcome: HandoverOutcome): HandoverResult {
  switch (outcome) {
    case 'done':
    case 'already':
      return { ok: true }
    case 'gone':
    case 'you_blocked':
    case 'revoked':
      return { ok: false, error: `adoptions.handover.errors.${outcome}`, then: 'choose_again' }
    default:
      return { ok: false, error: `adoptions.handover.errors.${outcome}`, then: 'show_state' }
  }
}

export type CommitmentResult = { ok: true } | { ok: false; error: string }

// Aceptar el compromiso o decir «Yo no adopté» (contracts §Server Actions), cada uno con sus textos:
// el doble toque o el reintento que ya había llegado es un éxito (FR-055). Una cuenta suspendida no
// llega hasta acá —la sesión ya la lleva a su pantalla (FR-034)—, y si llegara, ve lo mismo que con
// la adopción que ya no está pendiente.
export function commitmentOutcome(
  outcome: CommitmentOutcome,
  action: 'commitment' | 'decline',
): CommitmentResult {
  switch (outcome) {
    case 'done':
    case 'already':
      return { ok: true }
    case 'not_found':
      return { ok: false, error: `adoptions.${action}.errors.not_found` }
    default:
      return { ok: false, error: `adoptions.${action}.errors.closed` }
  }
}
