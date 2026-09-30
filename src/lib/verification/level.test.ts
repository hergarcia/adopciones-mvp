import { describe, expect, it } from 'vitest'
import type { IdentityRecord, IdentityStatus } from './identity-status'
import { myVerification, publicLevel, verificationLevel } from './level'
import type { PhoneRow, PhoneStatus } from './phone-status'

const SINCE = new Date('2026-09-20T14:00:00-03:00')
const VERIFIED: PhoneStatus = { kind: 'verified', number: '+59899123456', since: SINCE }
const IDENTITY: IdentityStatus = { kind: 'approved', on: '2026-09-24' }
const NONE: IdentityStatus = { kind: 'none' }

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
    expect(verificationLevel(phone, NONE)).toBe(0)
    expect(verificationLevel(phone, IDENTITY)).toBe(0)
    expect(verificationLevel(phone, IDENTITY, 2)).toBe(0)
  })

  it('con el teléfono verificado y sin identidad, 1, aunque tenga avales', () => {
    expect(verificationLevel(VERIFIED, NONE)).toBe(1)
    expect(verificationLevel(VERIFIED, NONE, 1)).toBe(1)
  })

  it('una identidad en revisión, rechazada o vencida no es la identidad: sigue en 1', () => {
    const inReview: IdentityStatus = { kind: 'in_review', sentAt: SINCE, expiresAt: SINCE }
    expect(verificationLevel(VERIFIED, inReview, 1)).toBe(1)
    expect(verificationLevel(VERIFIED, { kind: 'expired', on: '2026-09-24' }, 1)).toBe(1)
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

// Covers: FR-003. «Mi perfil», la verificación y el lugar de avalar leen el nivel por el mismo camino.
describe('el nivel de quien tiene la sesión, desde sus filas', () => {
  const NOW = new Date('2026-09-26T15:00:00Z')
  const PHONE: PhoneRow = {
    verifiedNumber: '+59899123456',
    verifiedAt: SINCE,
    pendingNumber: null,
    pendingSince: null,
    numberLostOn: null,
  }
  const APPROVED: IdentityRecord = {
    request: null,
    verifiedOn: '2026-09-24',
    rejections: [],
    expiredOn: null,
  }

  it('sin filas no tiene nada: sin teléfono, sin identidad, nivel 0', () => {
    expect(myVerification({ phone: null, identity: null }, NOW)).toEqual({
      phone: { kind: 'none' },
      identity: { kind: 'none' },
      level: 0,
    })
  })

  it('el teléfono y la identidad salen de sus filas, y los avales que cuentan suben a 3', () => {
    expect(myVerification({ phone: PHONE, identity: APPROVED, countingVouches: 1 }, NOW)).toEqual({
      phone: VERIFIED,
      identity: IDENTITY,
      level: 3,
    })
  })

  it('sin avales que cuenten, la identidad deja en 2', () => {
    expect(myVerification({ phone: PHONE, identity: APPROVED }, NOW).level).toBe(2)
  })

  it('el pedido en revisión se lee con la hora de ahora', () => {
    const expiresAt = new Date(NOW.getTime() + 1)
    const record: IdentityRecord = {
      ...APPROVED,
      verifiedOn: null,
      request: { sentAt: SINCE, expiresAt },
    }
    expect(myVerification({ phone: PHONE, identity: record }, NOW)).toMatchObject({
      identity: { kind: 'in_review', sentAt: SINCE, expiresAt },
      level: 1,
    })
  })
})
