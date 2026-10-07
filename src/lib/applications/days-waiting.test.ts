// Covers: FR-004 (días de calendario en hora de Uruguay)
import { describe, expect, it } from 'vitest'
import { daysWaiting } from './days-waiting'

describe('daysWaiting', () => {
  it('el mismo día de Uruguay es 0, aunque pasen casi 24 horas', () => {
    expect(daysWaiting(new Date('2026-10-03T03:30:00Z'), new Date('2026-10-04T02:59:00Z'))).toBe(0)
  })

  it('al día siguiente es 1, aunque pase apenas una hora', () => {
    expect(daysWaiting(new Date('2026-10-04T02:00:00Z'), new Date('2026-10-04T03:01:00Z'))).toBe(1)
  })

  it('pasada la medianoche UTC sigue siendo el mismo día en Montevideo', () => {
    expect(daysWaiting(new Date('2026-10-03T22:00:00Z'), new Date('2026-10-04T01:00:00Z'))).toBe(0)
  })

  it('cuenta días enteros de calendario y nunca da negativo', () => {
    expect(daysWaiting(new Date('2026-10-01T15:00:00Z'), new Date('2026-10-05T12:00:00Z'))).toBe(4)
    expect(daysWaiting(new Date('2026-10-05T15:00:00Z'), new Date('2026-10-04T12:00:00Z'))).toBe(0)
  })
})
