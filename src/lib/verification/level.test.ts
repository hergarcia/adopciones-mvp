import { describe, expect, it } from 'vitest'
import { verificationLevel } from './level'
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
  ])('sin nivel 1 es 0, tenga o no la identidad verificada (%o)', (phone) => {
    expect(verificationLevel(phone, null)).toBe(0)
    expect(verificationLevel(phone, IDENTITY)).toBe(0)
  })

  it('con el teléfono verificado y sin identidad, 1', () => {
    expect(verificationLevel(VERIFIED, null)).toBe(1)
  })

  it('con el teléfono verificado y la identidad, 2', () => {
    expect(verificationLevel(VERIFIED, IDENTITY)).toBe(2)
  })
})
