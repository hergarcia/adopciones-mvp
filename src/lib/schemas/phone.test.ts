import { describe, expect, it } from 'vitest'
import { phoneCodeSchema, phoneNumberSchema } from './phone'

function numberError(input: string) {
  const result = phoneNumberSchema.safeParse({ number: input })
  return result.success ? null : result.error.issues[0]?.message
}

function codeError(input: string) {
  const result = phoneCodeSchema.safeParse({ code: input })
  return result.success ? null : result.error.issues[0]?.message
}

// Covers: FR-001, FR-002, US1-AS8
describe('el número', () => {
  it('llega a la acción en E.164, escrito como sea', () => {
    expect(phoneNumberSchema.parse({ number: '099 123 456' })).toEqual({ number: '+59899123456' })
    expect(phoneNumberSchema.parse({ number: '+598 99 123 456' })).toEqual({
      number: '+59899123456',
    })
  })

  it('cada rechazo dice cuál es', () => {
    expect(numberError('')).toBe('verification.errors.number_empty')
    expect(numberError('12345')).toBe('verification.errors.number_format')
    expect(numberError('2900 1234')).toBe('verification.errors.number_landline')
    expect(numberError('+54 11 5555 5555')).toBe('verification.errors.number_foreign')
  })

  it('con un rechazo hay un solo error', () => {
    const result = phoneNumberSchema.safeParse({ number: '2900 1234' })
    expect(result.success ? [] : result.error.issues).toHaveLength(1)
  })
})

// Covers: FR-007b
describe('el código', () => {
  it('seis dígitos pasan tal cual', () => {
    expect(phoneCodeSchema.parse({ code: '482017' })).toEqual({ code: '482017' })
  })

  it('con espacios o guiones, pegado o sugerido por el teléfono, también', () => {
    expect(phoneCodeSchema.parse({ code: '482 017' })).toEqual({ code: '482017' })
    expect(phoneCodeSchema.parse({ code: ' 482-017 ' })).toEqual({ code: '482017' })
    expect(phoneCodeSchema.parse({ code: '4 8 2 0 1 7' })).toEqual({ code: '482017' })
  })

  it('cinco o siete dígitos no', () => {
    expect(codeError('48201')).toBe('verification.errors.code_format')
    expect(codeError('4820171')).toBe('verification.errors.code_format')
  })

  it('letras, un texto entero pegado o nada, tampoco', () => {
    expect(codeError('48201a')).toBe('verification.errors.code_format')
    expect(codeError('Tu codigo es 482017')).toBe('verification.errors.code_format')
    expect(codeError('')).toBe('verification.errors.code_format')
  })
})
