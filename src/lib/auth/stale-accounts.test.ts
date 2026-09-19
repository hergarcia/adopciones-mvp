import { describe, expect, it } from 'vitest'
import { isPurgeable, UNCONFIRMED_ACCOUNT_TTL_DAYS } from './stale-accounts'

const NOW = new Date('2026-09-19T12:00:00Z')

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000)
}

// Covers: FR-030a. Esta función decide qué cuenta se borra sin que nadie lo pida, así que lo que
// hay que probar sobre todo es a quién NO toca.
describe('a quién borra la limpieza de cuentas sin confirmar', () => {
  it('a quien nunca abrió su enlace y ya pasó el plazo', () => {
    expect(isPurgeable({ createdAt: daysAgo(8), confirmedAt: null }, NOW)).toBe(true)
  })

  it('justo al cumplirse el plazo', () => {
    const exactly = { createdAt: daysAgo(UNCONFIRMED_ACCOUNT_TTL_DAYS), confirmedAt: null }
    expect(isPurgeable(exactly, NOW)).toBe(true)
  })

  it('NO borra a quien confirmó, por vieja que sea la cuenta', () => {
    const confirmed = { createdAt: daysAgo(400), confirmedAt: daysAgo(399) }
    expect(isPurgeable(confirmed, NOW)).toBe(false)
  })

  it('NO borra a quien confirmó hace un instante', () => {
    expect(isPurgeable({ createdAt: daysAgo(8), confirmedAt: NOW }, NOW)).toBe(false)
  })

  it('NO borra a quien sigue sin confirmar pero está dentro del plazo', () => {
    expect(isPurgeable({ createdAt: daysAgo(6), confirmedAt: null }, NOW)).toBe(false)
  })

  it('NO borra una cuenta recién creada', () => {
    expect(isPurgeable({ createdAt: NOW, confirmedAt: null }, NOW)).toBe(false)
  })

  it('NO borra un milisegundo antes del plazo', () => {
    const almost = new Date(daysAgo(UNCONFIRMED_ACCOUNT_TTL_DAYS).getTime() + 1)
    expect(isPurgeable({ createdAt: almost, confirmedAt: null }, NOW)).toBe(false)
  })
})
