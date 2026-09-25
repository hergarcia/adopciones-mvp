import type { ActionResult } from '@/actions/result'
import type { AnalyticsEvent } from '@/lib/analytics/events'
import type { Gate } from './gate'
import { isLevelOne, type PhoneStatus } from './phone-status'

/** La prueba vigente de una cuenta: el número y hasta cuándo se puede confirmar. */
export type Claim = { number: string; validUntil: Date }

/** Lo que devuelve la base al quedarse con un número: hechos, no un mensaje. */
export type ClaimFacts = {
  outcome: 'claimed' | 'verified_free' | 'no_claim'
  wasChange: boolean
  wasLost: boolean
  previousUserId: string | null
  lostOn: string | null
}

export type ClaimResult = ActionResult<{ destination: string }>

export const CLAIM_EXPIRED = 'verification.claim.errors.expired'
export const CLAIM_CHECK_FAILED = 'verification.claim.errors.check_failed'

/** A quién avisarle que perdió el número, y de qué día. Vive en memoria lo que tarda el correo. */
export type LostAccount = { userId: string; lostOn: string }

// De lo que pasó en la base a lo que ve la persona, lo que se mide y a quién avisarle. Quedarse con
// un número de otra cuenta y encontrarlo libre se ven exactamente igual: si no, la pantalla le
// diría a la cuenta nueva si la otra todavía lo tenía (FR-009).
export function claimOutcome(input: { facts: ClaimFacts | null; destination: string }): {
  result: ClaimResult
  events: AnalyticsEvent[]
  lostAccount: LostAccount | null
} {
  const { facts } = input
  if (facts === null) {
    return { result: { ok: false, error: CLAIM_CHECK_FAILED }, events: [], lostAccount: null }
  }
  if (facts.outcome === 'no_claim') {
    return { result: { ok: false, error: CLAIM_EXPIRED }, events: [], lostAccount: null }
  }

  const claimed = facts.outcome === 'claimed'
  const events: AnalyticsEvent[] = ['phone_verified', 'phone_claimed']
  if (claimed) events.push('phone_number_lost')
  if (facts.wasChange) events.push('phone_changed')
  if (facts.wasLost) events.push('phone_reverified_after_loss')

  return {
    result: { ok: true, data: { destination: input.destination } },
    events,
    lostAccount:
      claimed && facts.previousUserId !== null && facts.lostOn !== null
        ? { userId: facts.previousUserId, lostOn: facts.lostOn }
        : null,
  }
}

export type ClaimScreen =
  | { kind: 'show'; claim: Claim; continueTo: string | null }
  | { kind: 'redirect'; to: string }
  | { kind: 'needs_new_code' }

// Qué dibujan «Ese número está en otra cuenta» y la confirmación al cargarse. Sin prueba no se sabe
// si venció, si se usó o si nunca existió, así que nunca se dice "teléfono verificado": con un
// teléfono verificado, «Mi perfil» muestra el estado real; sin él, hace falta un código nuevo, y el
// número ya no se conserva (FR-009d, FR-013e).
export function claimScreen(input: {
  claim: Claim | null
  status: PhoneStatus
  gate: Gate
}): ClaimScreen {
  const { claim, status, gate } = input
  if (claim !== null) {
    // Si era un cambio, la cuenta volvió a su número verificado: estando en el aviso, puede seguir a
    // la acción que había tocado (FR-008c de la #10).
    const canContinue = gate.reason !== null && isLevelOne(status)
    return { kind: 'show', claim, continueTo: canContinue ? gate.next : null }
  }
  if (status.kind === 'verified' || status.kind === 'pending_change') {
    return { kind: 'redirect', to: '/mi-perfil' }
  }
  return { kind: 'needs_new_code' }
}

export type ClaimReadback =
  { state: 'owned'; destination: string } | { state: 'pending' } | { state: 'gone' }

// Después de una falla al confirmar: el estado real, comparando el número de la pantalla con el de
// la cuenta (FR-011). Solo es de la cuenta si su verificado es ese número, aunque tenga otro.
export function claimReadback(input: {
  number: string
  verifiedNumber: string | null
  claim: Claim | null
  destination: string
}): ClaimReadback {
  if (input.verifiedNumber === input.number) {
    return { state: 'owned', destination: input.destination }
  }
  if (input.claim?.number === input.number) return { state: 'pending' }
  return { state: 'gone' }
}
