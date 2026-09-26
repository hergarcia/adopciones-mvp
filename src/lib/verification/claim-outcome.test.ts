import { describe, expect, it } from 'vitest'
import {
  claimOutcome,
  claimReadback,
  claimScreen,
  type Claim,
  type ClaimFacts,
} from './claim-outcome'
import { NO_GATE, type Gate } from './gate'
import type { PhoneStatus } from './phone-status'

const DESTINATION = '/mi-perfil?guardado=telefono'
const CLAIMED: ClaimFacts = {
  outcome: 'claimed',
  wasChange: false,
  wasLost: false,
  previousUserId: 'cuenta-anterior',
  lostOn: '2026-09-25',
}
const FREE: ClaimFacts = {
  outcome: 'verified_free',
  wasChange: false,
  wasLost: false,
  previousUserId: null,
  lostOn: null,
}

function outcome(facts: ClaimFacts | null) {
  return claimOutcome({ facts, destination: DESTINATION })
}

// Covers: #25 FR-007, FR-008, FR-009, FR-010, FR-011, FR-014
describe('lo que ve quien confirma, y lo que se mide', () => {
  it('quedarse con el número de otra cuenta: al destino, con la otra cuenta a avisar', () => {
    expect(outcome(CLAIMED)).toEqual({
      result: { ok: true, data: { destination: DESTINATION } },
      events: ['phone_verified', 'phone_claimed', 'phone_number_lost'],
      lostAccount: { userId: 'cuenta-anterior', lostOn: '2026-09-25' },
    })
  })

  it('el número libre: lo mismo para la persona, sin nadie a quien avisar ni número perdido', () => {
    expect(outcome(FREE)).toEqual({
      result: { ok: true, data: { destination: DESTINATION } },
      events: ['phone_verified', 'phone_claimed'],
      lostAccount: null,
    })
    expect(outcome(FREE).result).toEqual(outcome(CLAIMED).result)
  })

  it('si tenía otro verificado, se mide también el cambio', () => {
    expect(outcome({ ...CLAIMED, wasChange: true }).events).toEqual([
      'phone_verified',
      'phone_claimed',
      'phone_number_lost',
      'phone_changed',
    ])
    expect(outcome({ ...FREE, wasChange: true }).events).toEqual([
      'phone_verified',
      'phone_claimed',
      'phone_changed',
    ])
  })

  it('si tenía el aviso de número perdido, se mide que volvió a verificar', () => {
    expect(outcome({ ...CLAIMED, wasLost: true }).events).toEqual([
      'phone_verified',
      'phone_claimed',
      'phone_number_lost',
      'phone_reverified_after_loss',
    ])
    expect(outcome({ ...FREE, wasChange: true, wasLost: true }).events).toEqual([
      'phone_verified',
      'phone_claimed',
      'phone_changed',
      'phone_reverified_after_loss',
    ])
  })

  it('sin la cuenta anterior o sin el día, no hay a quién avisar', () => {
    expect(outcome({ ...CLAIMED, previousUserId: null }).lostAccount).toBeNull()
    expect(outcome({ ...CLAIMED, lostOn: null }).lostAccount).toBeNull()
  })

  it('sin prueba vigente: hace falta un código nuevo, sin medir nada', () => {
    expect(outcome({ ...FREE, outcome: 'no_claim' })).toEqual({
      result: { ok: false, error: 'verification.claim.errors.expired' },
      events: [],
      lostAccount: null,
    })
  })

  it('si la base no respondió: no se pudo confirmar, sin medir nada', () => {
    expect(outcome(null)).toEqual({
      result: { ok: false, error: 'verification.claim.errors.check_failed' },
      events: [],
      lostAccount: null,
    })
  })
})

const CLAIM: Claim = { number: '+59899123456', validUntil: new Date('2026-09-25T14:32:00-03:00') }
const SINCE = new Date('2026-09-20T14:00:00-03:00')
const VERIFIED: PhoneStatus = { kind: 'verified', number: '+59898111222', since: SINCE }
const NONE: PhoneStatus = { kind: 'none' }
const PENDING: PhoneStatus = { kind: 'pending', number: '+59898765432' }
const CHANGE: PhoneStatus = {
  kind: 'pending_change',
  number: '+59898765432',
  previous: { number: '+59898111222', since: SINCE },
}
const PUBLISH: Gate = { reason: 'publish', next: '/publicar', from: '/animales/tobi' }

// Covers: #25 FR-001, FR-009c, FR-009d, SC-006
describe('qué dibujan los caminos y la confirmación al cargarse', () => {
  it('con prueba, nivel 1 y el aviso de una acción: los caminos con «Seguir»', () => {
    expect(claimScreen({ claim: CLAIM, status: VERIFIED, gate: PUBLISH })).toEqual({
      kind: 'show',
      claim: CLAIM,
      continueTo: '/publicar',
    })
  })

  it('con prueba y sin nivel 1: sin «Seguir»', () => {
    expect(claimScreen({ claim: CLAIM, status: NONE, gate: PUBLISH })).toEqual({
      kind: 'show',
      claim: CLAIM,
      continueTo: null,
    })
    expect(claimScreen({ claim: CLAIM, status: CHANGE, gate: PUBLISH })).toMatchObject({
      continueTo: null,
    })
  })

  it('con prueba y nivel 1, pero sin la acción o sin destino: sin «Seguir»', () => {
    expect(claimScreen({ claim: CLAIM, status: VERIFIED, gate: NO_GATE })).toMatchObject({
      kind: 'show',
      continueTo: null,
    })
    expect(
      claimScreen({ claim: CLAIM, status: VERIFIED, gate: { ...PUBLISH, reason: null } }),
    ).toMatchObject({ continueTo: null })
    expect(
      claimScreen({ claim: CLAIM, status: VERIFIED, gate: { ...PUBLISH, next: null } }),
    ).toMatchObject({ continueTo: null })
  })

  it('sin prueba y con un teléfono verificado: «Mi perfil», sin la marca de verificado', () => {
    expect(claimScreen({ claim: null, status: VERIFIED, gate: PUBLISH })).toEqual({
      kind: 'redirect',
      to: '/mi-perfil',
    })
    expect(claimScreen({ claim: null, status: CHANGE, gate: NO_GATE })).toEqual({
      kind: 'redirect',
      to: '/mi-perfil',
    })
  })

  it('sin prueba y sin teléfono verificado: hace falta un código nuevo', () => {
    expect(claimScreen({ claim: null, status: NONE, gate: PUBLISH })).toEqual({
      kind: 'needs_new_code',
    })
    expect(claimScreen({ claim: null, status: PENDING, gate: NO_GATE })).toEqual({
      kind: 'needs_new_code',
    })
  })
})

// Covers: #25 FR-011. «Teléfono verificado» solo si el número de la pantalla es el de la cuenta.
describe('el estado real después de una falla al confirmar', () => {
  function readback(verifiedNumber: string | null, claim: Claim | null) {
    return claimReadback({ number: CLAIM.number, verifiedNumber, claim, destination: DESTINATION })
  }

  it('si el número quedó en la cuenta, al destino', () => {
    expect(readback(CLAIM.number, null)).toEqual({ state: 'owned', destination: DESTINATION })
  })

  it('si la cuenta tiene otro verificado y la prueba sigue, todavía no es suyo', () => {
    expect(readback('+59898111222', CLAIM)).toEqual({ state: 'pending' })
  })

  it('si la cuenta tiene otro verificado y la prueba ya no está, se fue', () => {
    expect(readback('+59898111222', null)).toEqual({ state: 'gone' })
  })

  it('una prueba de otro número no es la de la pantalla', () => {
    expect(readback(null, { ...CLAIM, number: '+59898765432' })).toEqual({ state: 'gone' })
  })
})
