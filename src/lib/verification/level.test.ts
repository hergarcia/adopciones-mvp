import { describe, expect, it } from 'vitest'
import { publicLevel, verificationLevel } from './level'
import type { PhoneStatus } from './phone-status'

const SINCE = new Date('2026-09-20T14:00:00-03:00')
const VERIFIED: PhoneStatus = { kind: 'verified', number: '+59899123456', since: SINCE }
const IDENTITY = { verifiedOn: '2026-09-24' }

// Covers: FR-023, US4-AS1, US4-AS2. Un nivel 2 dado de más engaña a quien entrega un animal.
describe('el nivel de una cuenta', () => {
  it.each<PhoneStatus>([
    { kind: 'none' },
    { kind: 'pending', number: '+59898765432' },
    {
      kind: 'pending_change',
      number: '+59898765432',
      previous: { number: '+59899123456', since: SINCE },
    },
  ])('sin nivel 1 es 0, tenga o no la identidad verificada y avales (%o)', (phone) => {
    expect(verificationLevel(phone, null)).toBe(0)
    expect(verificationLevel(phone, IDENTITY)).toBe(0)
    expect(verificationLevel(phone, IDENTITY, 2)).toBe(0)
  })

  it('con el teléfono verificado y sin identidad, 1, aunque tenga avales', () => {
    expect(verificationLevel(VERIFIED, null)).toBe(1)
    expect(verificationLevel(VERIFIED, null, 1)).toBe(1)
  })

  it('con el teléfono verificado y la identidad, 2', () => {
    expect(verificationLevel(VERIFIED, IDENTITY)).toBe(2)
    expect(verificationLevel(VERIFIED, IDENTITY, 0)).toBe(2)
  })

  // Covers: FR-001 (historia #12)
  it('con nivel 2 y un aval que cuenta, 3', () => {
    expect(verificationLevel(VERIFIED, IDENTITY, 1)).toBe(3)
    expect(verificationLevel(VERIFIED, IDENTITY, 50)).toBe(3)
  })
})

// Covers: FR-003, SC-005. El perfil público y «Mi perfil» sobre la misma escalera.
describe('el nivel del perfil público', () => {
  const VOUCHER = { publicId: 'SemillaBeto00000000006', displayName: 'Beto' }

  it('sin nivel 1 es 0, aunque la base mande avales', () => {
    expect(publicLevel({ levelOne: false, identitySince: null, vouchers: [] })).toBe(0)
    expect(publicLevel({ levelOne: false, identitySince: null, vouchers: [VOUCHER] })).toBe(0)
  })

  it('con nivel 1 y sin identidad, 1', () => {
    expect(publicLevel({ levelOne: true, identitySince: null, vouchers: [] })).toBe(1)
    expect(publicLevel({ levelOne: true, identitySince: null, vouchers: [VOUCHER] })).toBe(1)
  })

  it('con la identidad, 2; con un aval que cuenta, 3', () => {
    expect(publicLevel({ levelOne: true, identitySince: '2026-08-01', vouchers: [] })).toBe(2)
    expect(publicLevel({ levelOne: true, identitySince: '2026-08-01', vouchers: [VOUCHER] })).toBe(
      3,
    )
  })
})
