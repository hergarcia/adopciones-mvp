// Covers: FR-012 (la fecha de última actualización, en día de Uruguay y sin depender del servidor)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatUpdatedOn } from './dates'

describe('formatUpdatedOn', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // En Uruguay todavía es el 9; en UTC ya es el 10.
    vi.setSystemTime(new Date('2026-10-09T23:30:00-03:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('dice el día anotado, no el del reloj ni el de UTC', () => {
    expect(formatUpdatedOn('2026-10-09', 'es-UY')).toBe('9 de octubre de 2026')
  })

  it('el primer día del año sigue siendo ese año', () => {
    expect(formatUpdatedOn('2026-01-01', 'es-UY')).toBe('1 de enero de 2026')
  })

  it.each([['2026-13-01'], ['2026-02-30'], ['9/10/2026'], ['2026-10-9'], [''], ['2026-10-09x']])(
    'un día que no es válido lanza: %s',
    (day) => {
      expect(() => formatUpdatedOn(day, 'es-UY')).toThrow(day)
    },
  )
})
