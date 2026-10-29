// Covers: US1-AS1, US1-AS5, FR-001, FR-011, FR-013, R3 (lo que ve quien publicó del pedido)
import { describe, expect, it } from 'vitest'
import { canAskIdentity, publisherIdentityAskView, shortDayLabel } from './identity-ask'
import { APPLICATION_STATUSES } from './types'

const ASKED_AT = '2026-10-29T15:00:00Z'
const WAITING = {
  status: 'sent' as const,
  identityAsk: null,
  applicantIdentityVerified: false,
}

describe('canAskIdentity', () => {
  it('esperando respuesta, sin pedido y sin la identidad aprobada: sí', () => {
    expect(canAskIdentity(WAITING)).toBe(true)
  })

  it('con la identidad aprobada, o sin saberlo porque el animal no se muestra: no', () => {
    expect(canAskIdentity({ ...WAITING, applicantIdentityVerified: true })).toBe(false)
    expect(canAskIdentity({ ...WAITING, applicantIdentityVerified: null })).toBe(false)
  })

  it('con un pedido ya hecho: no', () => {
    expect(
      canAskIdentity({ ...WAITING, identityAsk: { askedAt: ASKED_AT, resolvedAt: null } }),
    ).toBe(false)
  })

  it.each(APPLICATION_STATUSES.filter((status) => status !== 'sent'))('%s: no', (status) => {
    expect(canAskIdentity({ ...WAITING, status })).toBe(false)
  })
})

describe('publisherIdentityAskView', () => {
  it('sin pedido y con la oferta: `offer`', () => {
    expect(publisherIdentityAskView(WAITING)).toEqual({ kind: 'offer' })
  })

  it('sin pedido y sin la oferta: `none`', () => {
    expect(publisherIdentityAskView({ ...WAITING, applicantIdentityVerified: true })).toEqual({
      kind: 'none',
    })
    expect(publisherIdentityAskView({ ...WAITING, status: 'accepted' })).toEqual({ kind: 'none' })
  })

  it('con el pedido abierto esperando respuesta: `waiting` con el día', () => {
    expect(
      publisherIdentityAskView({
        ...WAITING,
        identityAsk: { askedAt: ASKED_AT, resolvedAt: null },
      }),
    ).toEqual({ kind: 'waiting', askedOn: '2026-10-29' })
  })

  it.each(APPLICATION_STATUSES.filter((status) => status !== 'sent'))(
    '%s sin resolver: `asked_only` con el día',
    (status) => {
      expect(
        publisherIdentityAskView({
          ...WAITING,
          status,
          identityAsk: { askedAt: ASKED_AT, resolvedAt: null },
        }),
      ).toEqual({ kind: 'asked_only', askedOn: '2026-10-29' })
    },
  )

  // Lo que se ve con el pedido resuelto lo suma la parte de enterarse al aprobar (US3).
  it('resuelto: `none`, nunca «Todavía no la verificó»', () => {
    expect(
      publisherIdentityAskView({
        ...WAITING,
        identityAsk: { askedAt: ASKED_AT, resolvedAt: '2026-10-31T12:00:00Z' },
      }),
    ).toEqual({ kind: 'none' })
  })

  it('el día es el de Uruguay en el borde de la medianoche', () => {
    const ask = (askedAt: string) =>
      publisherIdentityAskView({ ...WAITING, identityAsk: { askedAt, resolvedAt: null } })
    expect(ask('2026-10-30T02:59:00Z')).toEqual({ kind: 'waiting', askedOn: '2026-10-29' })
    expect(ask('2026-10-30T03:00:00Z')).toEqual({ kind: 'waiting', askedOn: '2026-10-30' })
  })
})

describe('shortDayLabel', () => {
  it('día y mes, con los dos dígitos', () => {
    expect(shortDayLabel('2026-10-29')).toBe('29/10')
    expect(shortDayLabel('2026-03-05')).toBe('05/03')
  })
})
