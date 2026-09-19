import { describe, expect, it } from 'vitest'
import { destinationLeavingPage, type LinkClick } from './leaving'

const HERE = 'https://adopciones.uy/mi-perfil/editar'

function click(overrides: Partial<LinkClick> = {}): LinkClick {
  return {
    href: '/mi-perfil',
    target: null,
    download: false,
    button: 0,
    modified: false,
    defaultPrevented: false,
    ...overrides,
  }
}

describe('qué clic se lleva puesto un formulario sin guardar', () => {
  it('un enlace nuestro a otra pantalla, sí', () => {
    expect(destinationLeavingPage(click(), HERE)).toBe('/mi-perfil')
  })

  it('se queda con la query y el ancla del destino', () => {
    expect(destinationLeavingPage(click({ href: '/entrar?next=/x#form' }), HERE)).toBe(
      '/entrar?next=/x#form',
    )
  })

  it('una dirección absoluta del mismo sitio también', () => {
    expect(destinationLeavingPage(click({ href: 'https://adopciones.uy/mi-perfil' }), HERE)).toBe(
      '/mi-perfil',
    )
  })

  it('donde no había enlace, no', () => {
    expect(destinationLeavingPage(click({ href: null }), HERE)).toBeNull()
  })

  it('si alguien ya lo atendió, no', () => {
    expect(destinationLeavingPage(click({ defaultPrevented: true }), HERE)).toBeNull()
  })

  it('con el botón del medio, no: abre al lado y esta pantalla sigue acá', () => {
    expect(destinationLeavingPage(click({ button: 1 }), HERE)).toBeNull()
  })

  it('con una tecla apretada, no: el navegador abre otra pestaña', () => {
    expect(destinationLeavingPage(click({ modified: true }), HERE)).toBeNull()
  })

  it('una descarga, no: no navega a ningún lado', () => {
    expect(destinationLeavingPage(click({ download: true }), HERE)).toBeNull()
  })

  it('un enlace que abre en otra pestaña, no', () => {
    expect(destinationLeavingPage(click({ target: '_blank' }), HERE)).toBeNull()
  })

  it('pero `_self` es esta misma pestaña, así que sí', () => {
    expect(destinationLeavingPage(click({ target: '_self' }), HERE)).toBe('/mi-perfil')
  })

  it('y un target vacío es lo mismo que no tenerlo', () => {
    expect(destinationLeavingPage(click({ target: '' }), HERE)).toBe('/mi-perfil')
  })

  it('otro sitio, no: de eso ya avisa el navegador y preguntaríamos dos veces', () => {
    expect(destinationLeavingPage(click({ href: 'https://otro.com/x' }), HERE)).toBeNull()
  })

  it('un ancla de esta misma pantalla, no: no se pierde nada', () => {
    expect(destinationLeavingPage(click({ href: '#zona' }), HERE)).toBeNull()
  })

  it('la misma ruta con otra query sí es otra pantalla', () => {
    expect(destinationLeavingPage(click({ href: '?paso=2' }), HERE)).toBe(
      '/mi-perfil/editar?paso=2',
    )
  })

  it('un href que no es una dirección, no', () => {
    expect(destinationLeavingPage(click({ href: 'http://[' }), HERE)).toBeNull()
  })
})
