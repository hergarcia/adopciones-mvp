// Covers: el día que se muestra es el guardado; un momento se dice en la hora de Uruguay
import { describe, expect, it } from 'vitest'
import { calendarDayLabel, momentDayLabel } from './day-label'

describe('calendarDayLabel', () => {
  it('un día guardado se dice ese mismo día, no el anterior de Uruguay', () => {
    expect(calendarDayLabel('2026-10-01', 'es')).toBe('1 de octubre')
    expect(calendarDayLabel('2026-12-31', 'es')).toBe('31 de diciembre')
  })
})

describe('momentDayLabel', () => {
  it('un momento se dice en el día de Uruguay', () => {
    expect(momentDayLabel('2026-10-01T02:00:00Z', 'es')).toBe('30 de septiembre')
    expect(momentDayLabel('2026-10-01T15:00:00Z', 'es')).toBe('1 de octubre')
  })
})
