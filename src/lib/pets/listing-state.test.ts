// Covers: FR-018 (research R11)
import { describe, expect, it } from 'vitest'
import { isStale } from './listing-state'

const SIGNED = '2026-09-28T12:00:00.000Z'
const after = (minutes: number) => new Date(Date.parse(SIGNED) + minutes * 60_000)

describe('isStale', () => {
  it('49 minutos no; 50 y 51, sí', () => {
    expect(isStale(SIGNED, after(49))).toBe(false)
    expect(isStale(SIGNED, after(49.99))).toBe(false)
    expect(isStale(SIGNED, after(50))).toBe(true)
    expect(isStale(SIGNED, after(51))).toBe(true)
  })
})
