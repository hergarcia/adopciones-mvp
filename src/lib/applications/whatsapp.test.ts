// Covers: FR-014, US1-AS4 (el mensaje y la dirección de «Abrir WhatsApp»)
import { describe, expect, it } from 'vitest'
import { whatsappMessage, whatsappUrl, type WhatsappTexts } from './whatsapp'

const texts: WhatsappTexts = (side, values) =>
  side === 'applicant'
    ? `Hola, soy ${values.sender}. Aceptaste mi solicitud por ${values.pet} en ${values.app}.`
    : `Hola, soy ${values.sender}. Acepté tu solicitud por ${values.pet} en ${values.app}.`

describe('whatsappMessage', () => {
  it('quien solicitó dice que la aceptaron; el publicador, que la acepta; con el animal y el sitio', () => {
    expect(
      whatsappMessage(
        { side: 'applicant', petName: 'Tobi', senderName: 'Dani', appName: 'Adopciones' },
        texts,
      ),
    ).toBe('Hola, soy Dani. Aceptaste mi solicitud por Tobi en Adopciones.')
    expect(
      whatsappMessage(
        { side: 'publisher', petName: 'Tobi', senderName: 'Ana', appName: 'Adopciones' },
        texts,
      ),
    ).toBe('Hola, soy Ana. Acepté tu solicitud por Tobi en Adopciones.')
  })
})

describe('whatsappUrl', () => {
  it('el número sin el +, y el texto codificado', () => {
    expect(whatsappUrl('+59899123456', 'Hola, soy Ana. ¿Tobi & Luna?')).toBe(
      'https://wa.me/59899123456?text=Hola%2C%20soy%20Ana.%20%C2%BFTobi%20%26%20Luna%3F',
    )
  })

  it('cualquier cosa que no sea un dígito sale, no solo el primer signo', () => {
    expect(whatsappUrl('+598 99 123-456', 'x')).toBe('https://wa.me/59899123456?text=x')
  })
})
