import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { smsSegments } from './segments'

// Se lee del archivo y no con un import: el texto que se prueba es el que va a salir.
function smsBody(): string {
  const messages: unknown = JSON.parse(readFileSync('messages/es.json', 'utf8'))
  const body: unknown = ['verification', 'sms', 'body'].reduce<unknown>(
    (node, key) => (typeof node === 'object' && node !== null ? Reflect.get(node, key) : undefined),
    messages,
  )
  return typeof body === 'string' ? body : ''
}

describe('cuántos mensajes ocupa un texto', () => {
  it('en GSM-7, hasta 160 caracteres es uno', () => {
    expect(smsSegments('a'.repeat(160))).toBe(1)
  })

  it('a partir de 161, se parte en tramos de 153', () => {
    expect(smsSegments('a'.repeat(161))).toBe(2)
    expect(smsSegments('a'.repeat(306))).toBe(2)
    expect(smsSegments('a'.repeat(307))).toBe(3)
  })

  it('los caracteres extendidos valen dos', () => {
    expect(smsSegments('€'.repeat(80))).toBe(1)
    expect(smsSegments(`${'€'.repeat(80)}a`)).toBe(2)
    expect(smsSegments('[]'.repeat(40))).toBe(1)
  })

  it('la é, la ñ y la ü están en GSM-7', () => {
    expect(smsSegments(`${'é'.repeat(80)}${'ñ'.repeat(80)}`)).toBe(1)
  })

  it('una sola ó pasa todo a UCS-2, donde entran 70', () => {
    expect(smsSegments(`código${'a'.repeat(64)}`)).toBe(1)
    expect(smsSegments(`código${'a'.repeat(65)}`)).toBe(2)
  })

  it('en UCS-2, a partir de 71 se parte en tramos de 67', () => {
    expect(smsSegments(`ó${'a'.repeat(133)}`)).toBe(2)
    expect(smsSegments(`ó${'a'.repeat(134)}`)).toBe(3)
  })
})

// Covers: FR-009
describe('el mensaje del código, tal como está en messages/es.json', () => {
  const body = smsBody().replace('{app}', 'X'.repeat(20)).replace('{code}', '482017')

  it('entra en un solo mensaje con un nombre de sitio de 20 caracteres', () => {
    expect(smsSegments(body)).toBe(1)
  })

  it('dice el código', () => {
    expect(body).toContain('482017')
  })
})
