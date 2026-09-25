import { describe, expect, it } from 'vitest'
import { hasPending, isLevelOne, phoneStatus, type PhoneRow } from './phone-status'

const NOW = new Date('2026-09-22T20:00:00-03:00')
const DAY = 24 * 60 * 60 * 1000
const SINCE = new Date('2026-09-20T14:00:00-03:00')

function row(overrides: Partial<PhoneRow>): PhoneRow {
  return {
    verifiedNumber: null,
    verifiedAt: null,
    pendingNumber: null,
    pendingSince: null,
    numberLostOn: null,
    ...overrides,
  }
}

// Covers: FR-012, FR-015, FR-017, FR-017b, FR-018, US1-AS3, US1-AS4, US3-AS2
describe('el estado del teléfono de una cuenta', () => {
  it('sin fila, o con la fila vacía, no tiene teléfono', () => {
    expect(phoneStatus(null, NOW)).toEqual({ kind: 'none' })
    expect(phoneStatus(row({}), NOW)).toEqual({ kind: 'none' })
  })

  it('con un número verificado, verificado y desde cuándo', () => {
    const status = phoneStatus(row({ verifiedNumber: '+59899123456', verifiedAt: SINCE }), NOW)
    expect(status).toEqual({ kind: 'verified', number: '+59899123456', since: SINCE })
  })

  it('con solo un número a medias, a medias', () => {
    const status = phoneStatus(row({ pendingNumber: '+59898765432', pendingSince: NOW }), NOW)
    expect(status).toEqual({ kind: 'pending', number: '+59898765432' })
  })

  it('con los dos, un cambio a medias que recuerda el anterior', () => {
    const status = phoneStatus(
      row({
        verifiedNumber: '+59899123456',
        verifiedAt: SINCE,
        pendingNumber: '+59898765432',
        pendingSince: NOW,
      }),
      NOW,
    )
    expect(status).toEqual({
      kind: 'pending_change',
      number: '+59898765432',
      previous: { number: '+59899123456', since: SINCE },
    })
  })

  it('un número a medias de casi 7 días sigue a medias', () => {
    const pendingSince = new Date(NOW.getTime() - 7 * DAY + 1)
    expect(phoneStatus(row({ pendingNumber: '+59898765432', pendingSince }), NOW).kind).toBe(
      'pending',
    )
  })

  it('a los 7 días se descarta: sin nada, no queda teléfono', () => {
    const pendingSince = new Date(NOW.getTime() - 7 * DAY)
    expect(phoneStatus(row({ pendingNumber: '+59898765432', pendingSince }), NOW)).toEqual({
      kind: 'none',
    })
  })

  it('a los 7 días, un cambio a medias vuelve al número anterior con su fecha', () => {
    const pendingSince = new Date(NOW.getTime() - 8 * DAY)
    const status = phoneStatus(
      row({
        verifiedNumber: '+59899123456',
        verifiedAt: SINCE,
        pendingNumber: '+59898765432',
        pendingSince,
      }),
      NOW,
    )
    expect(status).toEqual({ kind: 'verified', number: '+59899123456', since: SINCE })
  })

  it('un par a medias incompleto no cuenta como número a medias', () => {
    expect(phoneStatus(row({ pendingNumber: '+59898765432' }), NOW)).toEqual({ kind: 'none' })
    expect(phoneStatus(row({ verifiedNumber: '+59899123456' }), NOW)).toEqual({ kind: 'none' })
  })
})

// Covers: FR-012, FR-017, US2-AS3
describe('nivel 1', () => {
  it('solo con el teléfono verificado y nada a medias', () => {
    expect(isLevelOne({ kind: 'verified', number: '+59899123456', since: SINCE })).toBe(true)
  })

  it('sin teléfono, a medias o con un cambio a medias, no', () => {
    expect(isLevelOne({ kind: 'none' })).toBe(false)
    expect(isLevelOne({ kind: 'pending', number: '+59898765432' })).toBe(false)
    expect(
      isLevelOne({
        kind: 'pending_change',
        number: '+59898765432',
        previous: { number: '+59899123456', since: SINCE },
      }),
    ).toBe(false)
  })
})

describe('si hay un número esperando el código', () => {
  it('a medias o en un cambio a medias, sí; si no, no', () => {
    expect(hasPending({ kind: 'pending', number: '+59898765432' })).toBe(true)
    expect(
      hasPending({
        kind: 'pending_change',
        number: '+59898765432',
        previous: { number: '+59899123456', since: SINCE },
      }),
    ).toBe(true)
    expect(hasPending({ kind: 'none' })).toBe(false)
    expect(hasPending({ kind: 'verified', number: '+59899123456', since: SINCE })).toBe(false)
  })
})
