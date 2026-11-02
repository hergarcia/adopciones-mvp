// Covers: #289 US1-AS1, US1-AS9, US2-AS5, US3-AS1, FR-012, FR-013, FR-014, FR-028 (el sello, la
// línea, el motivo y los días de una que se dejó escrita)
import { describe, expect, it } from 'vitest'
import { activeWithHeld, heldApplicationView } from './held-view'
import { HELD_LAPSE_REASONS } from './types'

const WAITING = {
  status: 'waiting',
  lapseReason: null,
  writtenAt: '2026-11-02T15:00:00.000Z',
  expiresAt: '2026-11-16T15:00:00.000Z',
  receiving: 'yes',
  levelTwo: false,
  needsRequest: false,
} as const

describe('heldApplicationView', () => {
  it('mientras espera: «Espera tu identidad» en tinta, sin motivo', () => {
    expect(heldApplicationView(WAITING)).toEqual({
      stamp: 'waiting_identity',
      tone: 'ink',
      reason: null,
      line: null,
      writtenDay: '2026-11-02',
      lastDay: '2026-11-16',
    })
  })

  it.each(HELD_LAPSE_REASONS)('no salió por %s: «No salió» en gris, con ese motivo', (reason) => {
    expect(
      heldApplicationView({
        ...WAITING,
        status: 'lapsed',
        lapseReason: reason,
        receiving: null,
        levelTwo: true,
      }),
    ).toEqual({
      stamp: 'not_sent',
      tone: 'muted',
      reason,
      line: null,
      writtenDay: '2026-11-02',
      lastDay: '2026-11-16',
    })
  })

  // Covers: #289 US2-AS5, FR-014
  it.each(['unavailable', 'closed', null] as const)(
    'con nivel 2 y el animal que no recibe por ahora (%s): «No disponible por ahora» y hasta qué día',
    (receiving) => {
      expect(heldApplicationView({ ...WAITING, receiving, levelTwo: true })).toEqual({
        stamp: 'unavailable',
        tone: 'warning',
        reason: null,
        line: 'unavailable',
        writtenDay: '2026-11-02',
        lastDay: '2026-11-16',
      })
    },
  )

  it('sin nivel 2 espera la identidad aunque el animal no reciba; con nivel 2 y recibiendo, también', () => {
    for (const held of [
      { ...WAITING, receiving: 'unavailable' as const },
      { ...WAITING, levelTwo: true },
    ]) {
      expect(heldApplicationView(held)).toMatchObject({
        stamp: 'waiting_identity',
        tone: 'ink',
        line: null,
      })
    }
  })

  // Covers: #289 US3-AS1, US3-AS2, FR-013
  it.each(['yes', 'unavailable', null] as const)(
    'sin pedido en revisión ni identidad aprobada (recibe: %s): sigue esperando, con la línea del último día',
    (receiving) => {
      expect(heldApplicationView({ ...WAITING, receiving, needsRequest: true })).toEqual({
        stamp: 'waiting_identity',
        tone: 'ink',
        reason: null,
        line: 'deadline',
        writtenDay: '2026-11-02',
        lastDay: '2026-11-16',
      })
    },
  )

  it('una que no salió no lleva la línea del plazo aunque ya no haya pedido', () => {
    expect(
      heldApplicationView({
        ...WAITING,
        status: 'lapsed',
        lapseReason: 'expired',
        receiving: null,
        needsRequest: true,
      }),
    ).toMatchObject({ stamp: 'not_sent', line: null })
  })

  it('los días son los de Uruguay: pasada la medianoche UTC todavía es el día anterior', () => {
    const view = heldApplicationView({
      ...WAITING,
      writtenAt: '2026-11-03T02:30:00.000Z',
      expiresAt: '2026-11-17T03:30:00.000Z',
    })
    expect(view.writtenDay).toBe('2026-11-02')
    expect(view.lastDay).toBe('2026-11-17')
  })
})

describe('activeWithHeld', () => {
  it('suma las activas y las que esperan; ni las cerradas ni las que no salieron ocupan lugar', () => {
    expect(
      activeWithHeld(
        [{ status: 'sent' }, { status: 'accepted' }, { status: 'withdrawn' }],
        [{ status: 'waiting' }, { status: 'lapsed' }],
      ),
    ).toBe(3)
    expect(
      activeWithHeld([], [{ status: 'waiting' }, { status: 'waiting' }, { status: 'lapsed' }]),
    ).toBe(2)
    expect(activeWithHeld([], [])).toBe(0)
  })
})
