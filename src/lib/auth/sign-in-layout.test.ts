import { describe, expect, it } from 'vitest'
import { signInLayout } from './sign-in-layout'

// Covers: FR-009a, FR-010, FR-011. Lo que se prueba es qué camino le queda adelante a la persona,
// no el markup.
describe('qué camino encabeza la pantalla de ingreso', () => {
  it('con Google configurado y sin motivo, Google adelante y el correo cerrado', () => {
    expect(signInLayout(true, undefined)).toEqual({ lead: 'google', isEmailOpen: false })
  })

  it('sin Google configurado, el correo es el camino, con o sin motivo', () => {
    expect(signInLayout(false, undefined)).toEqual({ lead: 'email' })
    expect(signInLayout(false, 'google-cancelado')).toEqual({ lead: 'email' })
  })

  it('si Google no verificó la dirección, el correo pasa adelante: el aviso dice que por Google no', () => {
    expect(signInLayout(true, 'google-sin-verificar')).toEqual({ lead: 'email' })
  })

  it('si el intento con Google falló de otra forma, Google sigue adelante y el correo queda abierto', () => {
    expect(signInLayout(true, 'google-cancelado')).toEqual({ lead: 'google', isEmailOpen: true })
    expect(signInLayout(true, 'cualquier-cosa')).toEqual({ lead: 'google', isEmailOpen: true })
  })
})
