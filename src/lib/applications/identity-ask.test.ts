// Covers: US1-AS1, US1-AS5, FR-001, FR-011, FR-013, R3 (lo que ve quien publicó del pedido)
import { describe, expect, it } from 'vitest'
import type { IdentityStatus } from '@/lib/verification/identity-status'
import { canAskIdentity, myIdentityAskView, publisherIdentityAskView } from './identity-ask'
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

  // Covers: US3-AS1, US3-AS5, FR-011 (resuelto: los dos días, nunca «Todavía no la verificó»)
  it.each(APPLICATION_STATUSES)(
    '%s resuelto: `verified` con el día del pedido y el de la aprobación',
    (status) => {
      expect(
        publisherIdentityAskView({
          ...WAITING,
          status,
          identityAsk: { askedAt: ASKED_AT, resolvedAt: '2026-10-31T12:00:00Z' },
        }),
      ).toEqual({ kind: 'verified', askedOn: '2026-10-29', verifiedOn: '2026-10-31' })
    },
  )

  it('la aprobación también cae en el día de Uruguay en el borde de la medianoche', () => {
    const resolved = (resolvedAt: string) =>
      publisherIdentityAskView({ ...WAITING, identityAsk: { askedAt: ASKED_AT, resolvedAt } })
    expect(resolved('2026-11-01T02:59:00Z')).toMatchObject({ verifiedOn: '2026-10-31' })
    expect(resolved('2026-11-01T03:00:00Z')).toMatchObject({ verifiedOn: '2026-11-01' })
  })

  it('el día es el de Uruguay en el borde de la medianoche', () => {
    const ask = (askedAt: string) =>
      publisherIdentityAskView({ ...WAITING, identityAsk: { askedAt, resolvedAt: null } })
    expect(ask('2026-10-30T02:59:00Z')).toEqual({ kind: 'waiting', askedOn: '2026-10-29' })
    expect(ask('2026-10-30T03:00:00Z')).toEqual({ kind: 'waiting', askedOn: '2026-10-30' })
  })
})

// Covers: US2-AS1, US2-AS4, US2-AS5, US2-AS6, US2-AS8, US2-AS9, US2-AS10, FR-015 a FR-018 (lo que ve
// quien solicitó del pedido)
describe('myIdentityAskView', () => {
  const OPEN = {
    status: 'sent' as const,
    identityAsk: { resolvedAt: null, publisherLevel: 1 as const },
  }
  const NONE: IdentityStatus = { kind: 'none' }
  const SENT_AT = new Date('2026-10-29T15:00:00Z')

  it('sin pedido de verificación: `verify` con el nivel de quien publicó', () => {
    expect(myIdentityAskView(OPEN, NONE)).toEqual({ kind: 'verify', publisherLevel: 1 })
    expect(
      myIdentityAskView({ ...OPEN, identityAsk: { resolvedAt: null, publisherLevel: null } }, NONE),
    ).toEqual({ kind: 'verify', publisherLevel: null })
  })

  it('rechazado o vencido: `retry`, diciendo cuál', () => {
    expect(
      myIdentityAskView(OPEN, {
        kind: 'rejected',
        on: '2026-10-20',
        reason: 'unreadable',
        attemptsLeft: 2,
      }),
    ).toEqual({ kind: 'retry', after: 'rejected', publisherLevel: 1 })
    expect(myIdentityAskView(OPEN, { kind: 'expired', on: '2026-10-20' })).toEqual({
      kind: 'retry',
      after: 'expired',
      publisherLevel: 1,
    })
  })

  it('en revisión: `in_review`, sin camino para mandarla otra vez', () => {
    expect(
      myIdentityAskView(OPEN, {
        kind: 'in_review',
        sentAt: SENT_AT,
        expiresAt: new Date('2026-11-05T15:00:00Z'),
      }),
    ).toEqual({ kind: 'in_review', publisherLevel: 1 })
  })

  it('con el tope: `capped` con el día desde el que puede volver a intentarlo', () => {
    expect(
      myIdentityAskView(OPEN, {
        kind: 'capped',
        on: '2026-10-20',
        reason: 'unreadable',
        retryOn: '2026-11-12',
      }),
    ).toEqual({ kind: 'capped', retryOn: '2026-11-12', publisherLevel: 1 })
  })

  it('resuelto, o aprobada mientras se abría: `verified`', () => {
    expect(
      myIdentityAskView(
        { ...OPEN, identityAsk: { resolvedAt: '2026-10-31T12:00:00Z', publisherLevel: 2 } },
        NONE,
      ),
    ).toEqual({ kind: 'verified' })
    expect(myIdentityAskView(OPEN, { kind: 'approved', on: '2026-10-31' })).toEqual({
      kind: 'verified',
    })
  })

  it('sin pedido: `none`', () => {
    expect(myIdentityAskView({ ...OPEN, identityAsk: null }, NONE)).toEqual({ kind: 'none' })
  })

  it.each(APPLICATION_STATUSES.filter((status) => status !== 'sent'))(
    '%s, aun con el pedido: `none`',
    (status) => {
      expect(myIdentityAskView({ ...OPEN, status }, NONE)).toEqual({ kind: 'none' })
    },
  )
})
