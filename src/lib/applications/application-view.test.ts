// Covers: FR-060, FR-061, FR-062, FR-064, FR-065, FR-071, FR-072, US1-AS1, US4-AS1..AS6
// (el estado de una solicitud en Mis solicitudes y en Mi solicitud)
import { describe, expect, it } from 'vitest'
import { activeCount, applicationView } from './application-view'
import { CLOSE_REASONS } from './types'

const ON_VIEW = { code: 'semana0001', petOnView: true }

describe('applicationView', () => {
  it('enviada a la vista: sello de tinta, sin motivo ni nota, con el enlace a la ficha', () => {
    expect(applicationView({ status: 'sent', closeReason: null, ...ON_VIEW })).toEqual({
      status: 'sent',
      tone: 'ink',
      reason: null,
      unavailable: false,
      href: '/animales/semana0001',
    })
  })

  it('enviada con el animal pausado, vencido o con publicador sin nivel: sigue activa, sello de mate cocido y el enlace', () => {
    expect(
      applicationView({ status: 'sent', closeReason: null, code: 'semana0001', petOnView: false }),
    ).toEqual({
      status: 'sent',
      tone: 'warning',
      reason: null,
      unavailable: true,
      href: '/animales/semana0001',
    })
  })

  it('retirada: sello gris, sin motivo y sin la nota aunque el animal no esté a la vista', () => {
    expect(
      applicationView({
        status: 'withdrawn',
        closeReason: null,
        code: 'semana0001',
        petOnView: false,
      }),
    ).toEqual({
      status: 'withdrawn',
      tone: 'muted',
      reason: null,
      unavailable: false,
      href: '/animales/semana0001',
    })
  })

  it.each(CLOSE_REASONS)('cerrada por %s: sello gris con su motivo y sin la nota', (reason) => {
    expect(
      applicationView({
        status: 'closed',
        closeReason: reason,
        code: 'semana0001',
        petOnView: false,
      }),
    ).toEqual({
      status: 'closed',
      tone: 'muted',
      reason,
      unavailable: false,
      href: '/animales/semana0001',
    })
  })

  it('animal borrado o de alguien que quien mira bloqueó: sin enlace a la ficha', () => {
    expect(
      applicationView({
        status: 'closed',
        closeReason: 'unpublished',
        code: null,
        petOnView: false,
      }),
    ).toMatchObject({ reason: 'unpublished', href: null })
    expect(
      applicationView({
        status: 'closed',
        closeReason: 'you_blocked',
        code: null,
        petOnView: false,
      }),
    ).toMatchObject({ reason: 'you_blocked', href: null })
  })

  it('bloqueada por el publicador: el animal se sigue mostrando, con su enlace', () => {
    expect(
      applicationView({ status: 'closed', closeReason: 'not_receiving', ...ON_VIEW }),
    ).toMatchObject({ reason: 'not_receiving', href: '/animales/semana0001' })
  })
})

describe('activeCount', () => {
  it('cuenta solo las enviadas, no las retiradas ni las cerradas', () => {
    expect(
      activeCount([
        { status: 'sent' },
        { status: 'withdrawn' },
        { status: 'sent' },
        { status: 'closed' },
        { status: 'sent' },
      ]),
    ).toBe(3)
    expect(activeCount([])).toBe(0)
  })
})
