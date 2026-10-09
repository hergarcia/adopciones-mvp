// Covers: FR-030, FR-031, FR-053, US4-AS1, US4-AS2
import { describe, expect, it } from 'vitest'
import { supportWhatsAppHref, supportWhatsAppUrl } from './whatsapp'

describe('supportWhatsAppUrl', () => {
  it('sin número no hay WhatsApp de soporte', () => {
    expect(supportWhatsAppUrl(null, 'Hola, les escribo desde Adopciones.')).toBeNull()
  })

  it('con número, el saludo codificado que nombra al sitio y nada más', () => {
    expect(supportWhatsAppUrl('59899000000', 'Hola, les escribo desde Adopciones.')).toBe(
      'https://wa.me/59899000000?text=Hola%2C%20les%20escribo%20desde%20Adopciones.',
    )
  })
})

describe('supportWhatsAppHref', () => {
  it('sin número, ningún enlace', () => {
    expect(supportWhatsAppHref(null)).toBeNull()
  })

  it('con número, la ruta propia que mide y redirige, sin el número', () => {
    expect(supportWhatsAppHref('59899000000')).toBe('/api/soporte/whatsapp')
  })
})
