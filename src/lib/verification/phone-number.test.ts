import { describe, expect, it } from 'vitest'
import { formatPhoneNumber, parsePhoneNumber } from './phone-number'

// Covers: FR-001, FR-002, FR-003, US1-AS8
describe('un celular uruguayo, escrito de cualquier forma', () => {
  it.each([
    '099 123 456',
    '099123456',
    '99123456',
    '99 123 456',
    '+598 99 123 456',
    '+59899123456',
    '598 99 123 456',
    '598-99-123-456',
    '00598 99 123 456',
    '+598 099 123 456',
    '598099123456',
    '(099) 123-456',
    '099.123.456',
  ])('«%s» es +59899123456', (input) => {
    expect(parsePhoneNumber(input)).toEqual({ ok: true, e164: '+59899123456' })
  })

  it('acepta todas las compañías, del 091 al 099', () => {
    expect(parsePhoneNumber('091 000 000')).toEqual({ ok: true, e164: '+59891000000' })
    expect(parsePhoneNumber('094 555 777')).toEqual({ ok: true, e164: '+59894555777' })
  })
})

describe('lo que no es un celular uruguayo', () => {
  it('vacío, o solo separadores, es que falta', () => {
    expect(parsePhoneNumber('')).toEqual({ ok: false, problem: 'empty' })
    expect(parsePhoneNumber(' - ')).toEqual({ ok: false, problem: 'empty' })
  })

  it.each(['2900 1234', '29001234', '4732 1234', '+598 2900 1234', '598 4732 1234'])(
    '«%s» es un fijo',
    (input) => {
      expect(parsePhoneNumber(input)).toEqual({ ok: false, problem: 'landline' })
    },
  )

  it.each(['+54 11 5555 5555', '0054 11 5555 5555', '+1 415 555 0100', '+1 415 5550'])(
    '«%s» es de otro país',
    (input) => {
      expect(parsePhoneNumber(input)).toEqual({ ok: false, problem: 'foreign' })
    },
  )

  it.each([
    '12345',
    '099 123 45',
    '099 123 4567',
    '090 123 456',
    '089 123 456',
    'mi número',
    '099-abc-456',
    '+54 11',
    '+1 415 555',
    '++59899123456',
    '1 099 123 456',
    '12345678901',
    '2900 12345',
    '1 2900 1234',
    '+54 11 5555 555x',
    '099 123 456x',
  ])('«%s» no tiene forma de celular', (input) => {
    expect(parsePhoneNumber(input)).toEqual({ ok: false, problem: 'format' })
  })

  // Un nacional de nueve dígitos que empieza con 598 no es el código de país: le faltan dígitos.
  it('un 598 corto no se toma por código de país', () => {
    expect(parsePhoneNumber('5989912345')).toEqual({ ok: false, problem: 'format' })
  })
})

describe('cómo se muestra', () => {
  it('con el cero y de a tres', () => {
    expect(formatPhoneNumber('+59899123456')).toBe('099 123 456')
    expect(formatPhoneNumber('+59891000000')).toBe('091 000 000')
  })
})
