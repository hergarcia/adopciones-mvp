// Covers: FR-065, FR-071, FR-072, US1-AS1 (el estado de una solicitud en Mis solicitudes)
import { describe, expect, it } from 'vitest'
import { activeCount, applicationView } from './application-view'

describe('applicationView', () => {
  it('enviada: sello de tinta, sin motivo, con el enlace a la ficha', () => {
    expect(applicationView({ status: 'sent', closeReason: null, code: 'semana0001' })).toEqual({
      status: 'sent',
      tone: 'ink',
      reason: null,
      href: '/animales/semana0001',
    })
  })

  it('retirada: sello gris y sin motivo', () => {
    expect(applicationView({ status: 'withdrawn', closeReason: null, code: 'semana0001' })).toEqual(
      { status: 'withdrawn', tone: 'muted', reason: null, href: '/animales/semana0001' },
    )
  })

  it('cerrada: sello gris con su motivo', () => {
    expect(
      applicationView({ status: 'closed', closeReason: 'adopted', code: 'semana0001' }),
    ).toEqual({ status: 'closed', tone: 'muted', reason: 'adopted', href: '/animales/semana0001' })
  })

  it('sin animal que mostrar, sin enlace', () => {
    expect(applicationView({ status: 'closed', closeReason: 'unpublished', code: null })).toEqual({
      status: 'closed',
      tone: 'muted',
      reason: 'unpublished',
      href: null,
    })
  })
})

describe('activeCount', () => {
  it('cuenta solo las enviadas, no las retiradas ni las cerradas', () => {
    expect(
      activeCount([
        { status: 'sent' },
        { status: 'withdrawn' },
        { status: 'sent' },
        { status: 'sent' },
      ]),
    ).toBe(3)
    expect(activeCount([])).toBe(0)
  })
})
