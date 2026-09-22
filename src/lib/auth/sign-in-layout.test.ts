import { describe, expect, it } from 'vitest'
import { signInLayout } from './sign-in-layout'

// Covers: FR-009a, FR-010, FR-011. Lo que se prueba es qué camino le queda adelante a la persona y
// qué aviso lo acompaña, no el markup.
describe('qué camino encabeza la pantalla de ingreso', () => {
  it('con Google configurado y sin motivo, Google adelante, el correo cerrado y sin aviso', () => {
    expect(signInLayout(true, undefined)).toEqual({
      lead: 'google',
      isEmailOpen: false,
      notice: null,
    })
  })

  it('sin Google configurado, el correo es el camino, con o sin motivo', () => {
    expect(signInLayout(false, undefined)).toEqual({ lead: 'email', notice: null })
    expect(signInLayout(false, 'google-cancelado')).toEqual({
      lead: 'email',
      notice: 'google_cancelled',
    })
  })

  it('si Google no verificó la dirección, el correo pasa adelante y el aviso lo explica', () => {
    expect(signInLayout(true, 'google-sin-verificar')).toEqual({
      lead: 'email',
      notice: 'google_unverified',
    })
  })

  it('si el intento con Google falló de otra forma, Google sigue adelante y el correo queda abierto', () => {
    const cancelled = { lead: 'google', isEmailOpen: true, notice: 'google_cancelled' }
    expect(signInLayout(true, 'google-cancelado')).toEqual(cancelled)
    expect(signInLayout(true, 'cualquier-cosa')).toEqual(cancelled)
  })
})
