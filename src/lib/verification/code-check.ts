import type { ActionResult } from '@/actions/result'
import type { AnalyticsEvent } from '@/lib/analytics/events'
import { formatPhoneNumber } from './phone-number'

/** Lo que devuelve la base al comparar un código: hechos, no un mensaje. */
export type CheckFacts = {
  verified: boolean
  wasChange: boolean
  inUse: boolean
  noPending: boolean
  noLiveCode: boolean
  matchesSuperseded: boolean
  expired: boolean
  exhausted: boolean
  attemptsLeft: number | null
  liveNumber: string | null
}

export type ConfirmDetail = {
  attemptsLeft?: number
  number?: string
  continueTo?: string
  /** Después de un código que no sirvió, el renglón se vacía; después de una falla, no. */
  clearInput: boolean
}

export type ConfirmResult = ActionResult<{ destination: string }, ConfirmDetail>

type Input = {
  /** Nulo si la base no respondió. */
  facts: CheckFacts | null
  /** Adónde va al verificar (`verifiedDestination`). */
  destination: string
  /** La acción del aviso, si vino de uno con un destino válido. */
  gateNext: string | null
}

// De lo que pasó en la base a lo que ve la persona y lo que se mide. Cuando un código cae en más de
// un motivo, gana el más útil: reemplazado, agotado, vencido, equivocado (FR-007a).
export function codeCheckOutcome(input: Input): {
  result: ConfirmResult
  events: AnalyticsEvent[]
} {
  const { facts } = input

  // Una falla al comprobar no es un intento equivocado y no borra lo escrito (FR-007c).
  if (facts === null) {
    return {
      result: refused('verification.errors.check_failed', { clearInput: false }),
      events: [],
    }
  }

  if (facts.verified) {
    return {
      result: { ok: true, data: { destination: input.destination } },
      events: facts.wasChange ? ['phone_verified', 'phone_changed'] : ['phone_verified'],
    }
  }

  // Si era un cambio, la cuenta volvió a su número verificado: estando en el aviso, puede seguir a
  // la acción que había tocado (FR-008c).
  if (facts.inUse) {
    const continueTo = facts.wasChange && input.gateNext !== null ? input.gateNext : undefined
    return {
      result: refused('verification.errors.number_in_use', {
        clearInput: true,
        ...(continueTo === undefined ? {} : { continueTo }),
      }),
      events: ['phone_number_in_use'],
    }
  }

  if (facts.noPending) {
    return { result: refused('verification.errors.no_pending', { clearInput: true }), events: [] }
  }

  return { result: codeProblem(facts), events: ['phone_code_failed'] }
}

function codeProblem(facts: CheckFacts): ConfirmResult {
  if (facts.matchesSuperseded) {
    return refused('verification.errors.code_superseded', {
      clearInput: true,
      ...(facts.liveNumber === null ? {} : { number: formatPhoneNumber(facts.liveNumber) }),
    })
  }
  if (facts.noLiveCode) return refused('verification.errors.code_expired', { clearInput: true })
  if (facts.exhausted) return refused('verification.errors.code_exhausted', { clearInput: true })
  if (facts.expired) return refused('verification.errors.code_expired', { clearInput: true })
  return refused('verification.errors.code_wrong', {
    clearInput: true,
    attemptsLeft: facts.attemptsLeft ?? 0,
  })
}

function refused(error: string, detail: ConfirmDetail): ConfirmResult {
  return { ok: false, error, detail }
}
