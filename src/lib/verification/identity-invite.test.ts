import { describe, expect, it } from 'vitest'
import type { LitterState } from '@/lib/litters/types'
import type { PetState } from '@/lib/pets/types'
import type { IdentityStatus } from './identity-status'
import { identityInviteShown, inviteSubject } from './identity-invite'
import type { PhoneStatus } from './phone-status'

const VERIFIED: PhoneStatus = { kind: 'verified', number: '+59899123456', since: new Date() }
const SHOWN = {
  publications: 1,
  phone: VERIFIED,
  identity: { kind: 'none' } as IdentityStatus,
  dismissed: false,
}

// Covers: US1-AS1, US1-AS4, US1-AS5, US1-AS6, US1-AS7, US1-AS8, FR-001, FR-005, SC-001
describe('identityInviteShown', () => {
  it('con una publicación, nivel 1, sin pedido y sin «Ahora no»', () => {
    expect(identityInviteShown(SHOWN)).toBe(true)
    expect(identityInviteShown({ ...SHOWN, publications: 4 })).toBe(true)
  })

  it('un rechazo sin tope o un vencimiento la dejan ver de nuevo', () => {
    const rejected: IdentityStatus = {
      kind: 'rejected',
      on: '2026-11-01',
      reason: 'unreadable',
      attemptsLeft: 2,
    }
    expect(identityInviteShown({ ...SHOWN, identity: rejected })).toBe(true)
    expect(identityInviteShown({ ...SHOWN, identity: { kind: 'expired', on: '2026-11-01' } })).toBe(
      true,
    )
  })

  it('sin publicaciones, no', () => {
    expect(identityInviteShown({ ...SHOWN, publications: 0 })).toBe(false)
  })

  it('sin el teléfono verificado, perdido o a medias, no', () => {
    const phones: PhoneStatus[] = [
      { kind: 'none' },
      { kind: 'pending', number: '+59899123456' },
      {
        kind: 'pending_change',
        number: '+59899654321',
        previous: { number: '+59899123456', since: new Date() },
      },
    ]
    for (const phone of phones) {
      expect(identityInviteShown({ ...SHOWN, phone })).toBe(false)
    }
  })

  it('en revisión, aprobada o en el tope, no', () => {
    const statuses: IdentityStatus[] = [
      { kind: 'in_review', sentAt: new Date(), expiresAt: new Date() },
      { kind: 'approved', on: '2026-11-01' },
      { kind: 'capped', on: '2026-11-01', reason: 'unreadable', retryOn: '2026-12-01' },
    ]
    for (const identity of statuses) {
      expect(identityInviteShown({ ...SHOWN, identity })).toBe(false)
    }
  })

  it('con «Ahora no» guardado, no', () => {
    expect(identityInviteShown({ ...SHOWN, dismissed: true })).toBe(false)
  })
})

const pet = (state: PetState, name = 'Tobi') => ({ name, state })
const litter = (state: LitterState, name = 'Camada de Kira') => ({ name, state })

// Covers: US1-AS1, FR-007, R3
describe('inviteSubject', () => {
  it('un animal disponible o en proceso, o una camada disponible: su nombre', () => {
    expect(inviteSubject([pet('available')], [])).toBe('Tobi')
    expect(inviteSubject([pet('in_process')], [])).toBe('Tobi')
    expect(inviteSubject([], [litter('available')])).toBe('Camada de Kira')
  })

  it('dos publicaciones, de cualquier tipo: ninguno', () => {
    expect(inviteSubject([pet('available'), pet('available', 'Luna')], [])).toBeNull()
    expect(inviteSubject([pet('available')], [litter('available')])).toBeNull()
    expect(inviteSubject([], [litter('available'), litter('available', 'Otra')])).toBeNull()
  })

  it('un animal que no está en el listado: ninguno', () => {
    for (const state of ['adopted', 'paused', 'expired', 'taken_down'] as const) {
      expect(inviteSubject([pet(state)], [])).toBeNull()
    }
  })

  it('una camada que no está en el listado: ninguno', () => {
    for (const state of ['adopted', 'paused', 'expired', 'taken_down'] as const) {
      expect(inviteSubject([], [litter(state)])).toBeNull()
    }
  })

  it('sin publicaciones: ninguno', () => {
    expect(inviteSubject([], [])).toBeNull()
  })
})
