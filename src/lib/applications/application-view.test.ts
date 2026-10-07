// Covers: FR-060, FR-061, FR-062, FR-064, FR-065, FR-071, FR-072, US1-AS1, US4-AS1..AS6
// (el estado de una solicitud en Mis solicitudes y en Mi solicitud)
import { describe, expect, it } from 'vitest'
import { activeCount, applicationView } from './application-view'
import { CLOSE_REASONS } from './types'

const ON_VIEW = { code: 'semana0001', petOnView: true, waitingQuestion: false }

describe('applicationView', () => {
  it('enviada a la vista: sello de tinta, sin motivo ni nota, con el enlace a la ficha', () => {
    expect(applicationView({ status: 'sent', closeReason: null, ...ON_VIEW })).toEqual({
      status: 'sent',
      stamp: 'sent',
      tone: 'ink',
      reason: null,
      unavailable: false,
      href: '/animales/semana0001',
    })
  })

  it('enviada con el animal pausado, vencido o con publicador sin nivel: sigue activa, sello de mate cocido y el enlace', () => {
    expect(
      applicationView({
        status: 'sent',
        closeReason: null,
        code: 'semana0001',
        petOnView: false,
        waitingQuestion: false,
      }),
    ).toEqual({
      status: 'sent',
      stamp: 'unavailable',
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
        waitingQuestion: false,
      }),
    ).toEqual({
      status: 'withdrawn',
      stamp: 'withdrawn',
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
        waitingQuestion: false,
      }),
    ).toEqual({
      status: 'closed',
      stamp: 'closed',
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
        waitingQuestion: false,
      }),
    ).toMatchObject({ reason: 'unpublished', href: null })
    expect(
      applicationView({
        status: 'closed',
        closeReason: 'you_blocked',
        code: null,
        petOnView: false,
        waitingQuestion: false,
      }),
    ).toMatchObject({ reason: 'you_blocked', href: null })
  })

  // Covers: FR-050, US1-AS3, US3-AS1 (los estados de la #65)
  it('aceptada: sello de yerba, sin motivo', () => {
    expect(applicationView({ status: 'accepted', closeReason: null, ...ON_VIEW })).toEqual({
      status: 'accepted',
      stamp: 'accepted',
      tone: 'primary',
      reason: null,
      unavailable: false,
      href: '/animales/semana0001',
    })
  })

  it('aceptada con el animal pausado: sigue con el sello de aceptada y sin la nota', () => {
    expect(
      applicationView({ status: 'accepted', closeReason: null, ...ON_VIEW, petOnView: false }),
    ).toMatchObject({ stamp: 'accepted', tone: 'primary', unavailable: false })
  })

  it('rechazada: «No aceptada» en gris', () => {
    expect(applicationView({ status: 'rejected', closeReason: null, ...ON_VIEW })).toMatchObject({
      stamp: 'rejected',
      tone: 'muted',
      unavailable: false,
    })
  })

  it('esperando respuesta con una pregunta sin contestar: «Te preguntaron algo», mate cocido', () => {
    expect(
      applicationView({ status: 'sent', closeReason: null, ...ON_VIEW, waitingQuestion: true }),
    ).toMatchObject({ stamp: 'info_requested', tone: 'warning', unavailable: false })
    expect(
      applicationView({
        status: 'sent',
        closeReason: null,
        ...ON_VIEW,
        petOnView: false,
        waitingQuestion: true,
      }),
    ).toMatchObject({ stamp: 'info_requested', tone: 'warning', unavailable: true })
  })

  it('una pregunta pendiente en una aceptada no cambia el sello', () => {
    expect(
      applicationView({ status: 'accepted', closeReason: null, ...ON_VIEW, waitingQuestion: true }),
    ).toMatchObject({ stamp: 'accepted' })
  })

  it('bloqueada por el publicador: el animal se sigue mostrando, con su enlace', () => {
    expect(
      applicationView({ status: 'closed', closeReason: 'not_receiving', ...ON_VIEW }),
    ).toMatchObject({ reason: 'not_receiving', href: '/animales/semana0001' })
  })
})

describe('activeCount', () => {
  it('cuenta las que esperan respuesta y las aceptadas, no las rechazadas, retiradas ni cerradas', () => {
    expect(
      activeCount([
        { status: 'sent' },
        { status: 'accepted' },
        { status: 'rejected' },
        { status: 'withdrawn' },
        { status: 'sent' },
        { status: 'closed' },
        { status: 'sent' },
      ]),
    ).toBe(4)
    expect(activeCount([])).toBe(0)
  })
})
