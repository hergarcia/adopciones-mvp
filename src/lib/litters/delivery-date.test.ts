// Covers: US2-AS6, US2-AS7, FR-030, Edge Cases (la fecha de entrega es hoy)
import { describe, expect, it } from 'vitest'
import { visibleDeliveryDate } from './delivery-date'

// 2026-11-03 a las 23:59 en Uruguay (UTC-3) es 2026-11-04 02:59 en UTC.
const LAST_MINUTE = new Date('2026-11-04T02:59:00Z')
const NEXT_DAY = new Date('2026-11-04T03:00:00Z')

describe('visibleDeliveryDate', () => {
  it('una fecha que todavía no llegó se muestra', () => {
    expect(visibleDeliveryDate('2026-11-10', LAST_MINUTE)).toBe('2026-11-10')
  })

  it('la de hoy se muestra hasta el último minuto del día de Uruguay', () => {
    expect(visibleDeliveryDate('2026-11-03', LAST_MINUTE)).toBe('2026-11-03')
  })

  it('desde el día siguiente, en hora de Uruguay, ya no', () => {
    expect(visibleDeliveryDate('2026-11-03', NEXT_DAY)).toBeNull()
  })

  it('sin fecha, nada', () => {
    expect(visibleDeliveryDate(null, LAST_MINUTE)).toBeNull()
  })
})
