// Covers: #289 US1-AS1, US1-AS9, FR-012, FR-028 (el sello, el motivo y los días de una que se dejó
// escrita)
import { describe, expect, it } from 'vitest'
import { activeWithHeld, heldApplicationView } from './held-view'
import { HELD_LAPSE_REASONS } from './types'

const WAITING = {
  status: 'waiting',
  lapseReason: null,
  writtenAt: '2026-11-02T15:00:00.000Z',
  expiresAt: '2026-11-16T15:00:00.000Z',
} as const

describe('heldApplicationView', () => {
  it('mientras espera: «Espera tu identidad» en tinta, sin motivo', () => {
    expect(heldApplicationView(WAITING)).toEqual({
      stamp: 'waiting_identity',
      tone: 'ink',
      reason: null,
      writtenDay: '2026-11-02',
      lastDay: '2026-11-16',
    })
  })

  it.each(HELD_LAPSE_REASONS)('no salió por %s: «No salió» en gris, con ese motivo', (reason) => {
    expect(heldApplicationView({ ...WAITING, status: 'lapsed', lapseReason: reason })).toEqual({
      stamp: 'not_sent',
      tone: 'muted',
      reason,
      writtenDay: '2026-11-02',
      lastDay: '2026-11-16',
    })
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
