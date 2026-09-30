import { afterEach, describe, expect, it, vi } from 'vitest'

// Covers: US1-AS4, Edge Cases «Fechas en el borde del mes». Correrse un mes miente sobre cuándo se
// verificó alguien.
describe('el mes y el año', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it.each(['America/Montevideo', 'Pacific/Honolulu', 'Asia/Tokyo', 'UTC'])(
    'el primero de agosto es agosto, con el proceso en %s',
    async (zone) => {
      vi.stubEnv('TZ', zone)
      vi.resetModules()
      const { monthYear } = await import('./month-year')
      expect(monthYear('2026-08-01')).toBe('agosto de 2026')
      expect(monthYear('2026-01-01')).toBe('enero de 2026')
    },
  )
})
