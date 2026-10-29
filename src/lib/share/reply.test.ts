// Covers: los criterios 1, 2 y 3 de la #250: qué dice la respuesta para quien escribe por privado.
import { describe, expect, it } from 'vitest'
import { replyText, type ReplyLines } from './reply'

const LINES: ReplyLines = {
  hello: '¡Hola! Gracias por escribirme por Luna.',
  inProcess: 'Ya hay una familia en proceso, pero sigo recibiendo solicitudes.',
  steps: 'Las solicitudes las recibo por el sitio.',
  identity: 'Para adoptarla también te piden mostrar tu cédula.',
  contact: 'Si acepto tu solicitud, los dos vemos el teléfono del otro.',
  invite: 'Pedila desde acá:',
}
const LINK = 'https://sitio.test/animales/k3x9p2qa7m?desde=respuesta'
const LUNA = { requiredLevel: 1, inProcess: false, url: LINK } as const

describe('replyText', () => {
  it('disponible y con teléfono: el saludo, el paso, el contacto al aceptar y el enlace al final', () => {
    expect(replyText(LINES, LUNA)).toBe(
      [
        '¡Hola! Gracias por escribirme por Luna.',
        '',
        'Las solicitudes las recibo por el sitio.',
        'Si acepto tu solicitud, los dos vemos el teléfono del otro.',
        '',
        'Pedila desde acá:',
        LINK,
      ].join('\n'),
    )
  })

  it('si el animal pide identidad, avisa de la cédula antes del contacto', () => {
    expect(replyText(LINES, { ...LUNA, requiredLevel: 2 })).toBe(
      [
        '¡Hola! Gracias por escribirme por Luna.',
        '',
        'Las solicitudes las recibo por el sitio.',
        'Para adoptarla también te piden mostrar tu cédula.',
        'Si acepto tu solicitud, los dos vemos el teléfono del otro.',
        '',
        'Pedila desde acá:',
        LINK,
      ].join('\n'),
    )
  })

  it('en proceso, lo dice debajo del saludo', () => {
    expect(replyText(LINES, { ...LUNA, inProcess: true })).toBe(
      [
        '¡Hola! Gracias por escribirme por Luna.',
        'Ya hay una familia en proceso, pero sigo recibiendo solicitudes.',
        '',
        'Las solicitudes las recibo por el sitio.',
        'Si acepto tu solicitud, los dos vemos el teléfono del otro.',
        '',
        'Pedila desde acá:',
        LINK,
      ].join('\n'),
    )
  })
})
