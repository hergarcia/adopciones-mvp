import { describe, expect, it } from 'vitest'
import { isInSiteNavigation } from './in-site-navigation'

const request = (dest?: string) => new Headers(dest === undefined ? {} : { 'sec-fetch-dest': dest })

// Covers: #302, criterio 4. Quien abre el enlace desde afuera recibe la ficha entera; solo el toque
// dentro del sitio pasa por la espera.
describe('el pedido de un toque dentro del sitio', () => {
  it('el router de Next pide con fetch: puede llegar con la espera', () => {
    expect(isInSiteNavigation(request('empty'))).toBe(true)
  })

  it('abrir la dirección en el navegador trae la pantalla entera', () => {
    expect(isInSiteNavigation(request('document'))).toBe(false)
  })

  it('sin el encabezado, como la vista previa de WhatsApp, también', () => {
    expect(isInSiteNavigation(request())).toBe(false)
  })
})
