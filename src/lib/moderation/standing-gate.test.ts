// Covers: FR-019, US2-AS6 (la puerta de la cuenta suspendida, research R4)
import { describe, expect, it } from 'vitest'
import { DEFAULT_DESTINATION, SIGN_IN_PATH } from '@/lib/auth/next-destination'
import { SUSPENDED_SCREEN_PATH } from './paths'
import { standingGate, suspendedScreenGate } from './standing-gate'

const suspended = {
  kind: 'suspended',
  reason: 'Vendía cachorros',
  since: '2026-10-03T12:00:00Z',
} as const

describe('standingGate', () => {
  it('deja seguir a una cuenta activa', () => {
    expect(standingGate({ kind: 'active' })).toBeNull()
  })

  it('manda a la pantalla de suspendida a una cuenta suspendida', () => {
    expect(standingGate(suspended)).toBe(SUSPENDED_SCREEN_PATH)
  })

  it('cierra ante la duda: si no se pudo preguntar, también a la pantalla', () => {
    expect(standingGate({ kind: 'unknown' })).toBe(SUSPENDED_SCREEN_PATH)
  })
})

describe('suspendedScreenGate', () => {
  it('sin sesión, a ingresar', () => {
    expect(suspendedScreenGate(null)).toEqual({ kind: 'redirect', to: SIGN_IN_PATH })
  })

  it('una cuenta activa vuelve a «Mi perfil»', () => {
    expect(suspendedScreenGate({ kind: 'active' })).toEqual({
      kind: 'redirect',
      to: DEFAULT_DESTINATION,
    })
  })

  it('si no se pudo preguntar, la pantalla de error con reintentar', () => {
    expect(suspendedScreenGate({ kind: 'unknown' })).toEqual({ kind: 'error' })
  })

  it('una suspendida ve su pantalla con el motivo y desde cuándo', () => {
    expect(suspendedScreenGate(suspended)).toEqual({
      kind: 'show',
      reason: 'Vendía cachorros',
      since: '2026-10-03T12:00:00Z',
    })
  })
})
