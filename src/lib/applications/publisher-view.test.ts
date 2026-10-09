// Covers: FR-003, FR-005, FR-042, FR-043, SC-008 (el estado del lado del publicador)
import { describe, expect, it } from 'vitest'
import { publisherApplicationView } from './publisher-view'
import { PUBLISHER_CLOSES } from './types'

const WAITING = {
  status: 'sent' as const,
  publisherClose: null,
  isNew: false,
  waitingQuestion: false,
}

describe('publisherApplicationView', () => {
  it('esperando respuesta, ya abierta: tinta, con los días', () => {
    expect(publisherApplicationView(WAITING)).toEqual({
      stamp: 'waiting',
      tone: 'ink',
      close: null,
      waiting: true,
    })
  })

  it('nueva: el sello «Nueva»', () => {
    expect(publisherApplicationView({ ...WAITING, isNew: true })).toEqual({
      stamp: 'new',
      tone: 'ink',
      close: null,
      waiting: true,
    })
  })

  it('con una pregunta sin contestar: mate cocido, gana sobre «Nueva»', () => {
    expect(publisherApplicationView({ ...WAITING, isNew: true, waitingQuestion: true })).toEqual({
      stamp: 'waiting_answer',
      tone: 'warning',
      close: null,
      waiting: true,
    })
  })

  it('aceptada: yerba, sin días ni cierre, aunque quede una pregunta', () => {
    expect(
      publisherApplicationView({ ...WAITING, status: 'accepted', waitingQuestion: true }),
    ).toEqual({ stamp: 'accepted', tone: 'primary', close: null, waiting: false })
  })

  it('rechazada: gris', () => {
    expect(publisherApplicationView({ ...WAITING, status: 'rejected' })).toEqual({
      stamp: 'rejected',
      tone: 'muted',
      close: null,
      waiting: false,
    })
  })

  it.each(PUBLISHER_CLOSES)('cerrada (%s): gris, con su línea', (close) => {
    expect(
      publisherApplicationView({ ...WAITING, status: 'closed', publisherClose: close }),
    ).toEqual({ stamp: 'closed', tone: 'muted', close, waiting: false })
  })

  it('retirada: la misma línea que un bloqueo o una suspensión de quien solicitó', () => {
    expect(
      publisherApplicationView({ ...WAITING, status: 'withdrawn', publisherClose: 'gone' }),
    ).toEqual({ stamp: 'closed', tone: 'muted', close: 'gone', waiting: false })
    expect(
      publisherApplicationView({ ...WAITING, status: 'withdrawn', publisherClose: null }).close,
    ).toBe('gone')
  })

  it('la elegida con su adopción en curso: «Adoptó» en yerba, sin la línea del cierre', () => {
    const chosen = { ...WAITING, status: 'closed' as const, publisherClose: 'handed_over' as const }
    expect(publisherApplicationView({ ...chosen, adoption: 'ongoing' })).toEqual({
      stamp: 'handed_over',
      tone: 'primary',
      close: null,
      waiting: false,
    })
    expect(publisherApplicationView({ ...chosen, adoption: 'ended' })).toEqual({
      stamp: 'handed_over_ended',
      tone: 'muted',
      close: null,
      waiting: false,
    })
    expect(publisherApplicationView({ ...chosen, adoption: null }).stamp).toBe('closed')
  })

  it('una adopción a mano no cambia una cerrada que no es la elegida', () => {
    expect(
      publisherApplicationView({
        ...WAITING,
        status: 'closed',
        publisherClose: 'adopted',
        adoption: 'ongoing',
      }),
    ).toEqual({ stamp: 'closed', tone: 'muted', close: 'adopted', waiting: false })
  })
})
