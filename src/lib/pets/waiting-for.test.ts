// Covers: spec §Pantallas (desde cuándo espera cada publicación por revisar)
import { describe, expect, it } from 'vitest'
import { waitingFor } from './waiting-for'

const NOW = new Date('2026-10-01T15:00:00Z')
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('waitingFor', () => {
  it.each([
    [0, { unit: 'minutes', count: 1 }],
    [MINUTE - 1, { unit: 'minutes', count: 1 }],
    [2 * MINUTE + 59_000, { unit: 'minutes', count: 2 }],
    [59 * MINUTE, { unit: 'minutes', count: 59 }],
    [HOUR - 1, { unit: 'minutes', count: 59 }],
    [HOUR, { unit: 'hours', count: 1 }],
    [2 * HOUR - 1, { unit: 'hours', count: 1 }],
    [23 * HOUR, { unit: 'hours', count: 23 }],
    [DAY - 1, { unit: 'hours', count: 23 }],
    [DAY, { unit: 'days', count: 1 }],
    [3 * DAY - 1, { unit: 'days', count: 2 }],
    [40 * DAY, { unit: 'days', count: 40 }],
  ])('%i ms → %o', (elapsed, expected) => {
    expect(waitingFor(new Date(NOW.getTime() - elapsed), NOW)).toEqual(expected)
  })

  it('una espera que el reloj ve en el futuro es de un minuto', () => {
    expect(waitingFor(new Date(NOW.getTime() + HOUR), NOW)).toEqual({ unit: 'minutes', count: 1 })
  })
})
