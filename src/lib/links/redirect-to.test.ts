// Covers: entrar y volver de un correo detrás de Funnel (#356). Con el origen del pedido, el
// navegador terminaba en https://0.0.0.0:3000.
import { describe, expect, it } from 'vitest'
import { redirectTo } from './redirect-to'

describe('redirectTo', () => {
  it('manda la dirección tal cual, sin pegarle el origen del pedido', () => {
    const response = redirectTo('/entrar/enlace?motivo=unknown&next=%2F')

    expect(response.headers.get('location')).toBe('/entrar/enlace?motivo=unknown&next=%2F')
    expect(response.status).toBe(307)
    expect(response.body).toBeNull()
  })

  it('con 303 para lo que llega de un toque en un correo o un botón', () => {
    expect(redirectTo('/mis-solicitudes/1', 303).status).toBe(303)
  })

  it('una dirección de afuera pasa como está', () => {
    expect(redirectTo('https://wa.me/598?text=hola', 303).headers.get('location')).toBe(
      'https://wa.me/598?text=hola',
    )
  })
})
