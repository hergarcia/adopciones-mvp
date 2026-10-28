// Covers: US1-AS1, US1-AS8, US1-AS9, US1-AS10 (la opción de su nivel, «Otra cosa» vacía, el
// teléfono o el correo, los 300 caracteres), FR-009, FR-011, FR-012, R7
import { describe, expect, it } from 'vitest'
import { toFieldError } from './field-error'
import { verificationExitAnswerSchema, verificationExitSkipSchema } from './verification-exit'

const base = { level: 'identity', option: 'no_id_photos', body: '' } as const
const other = { ...base, option: 'other' } as const

function errorsOf(input: unknown) {
  const result = verificationExitAnswerSchema.safeParse(input)
  return (result.error?.issues ?? []).map((issue) => ({
    path: issue.path.join('.'),
    ...toFieldError(issue),
  }))
}

describe('verificationExitAnswerSchema acepta', () => {
  it('una opción de su nivel, sin texto', () => {
    expect(verificationExitAnswerSchema.parse(base)).toEqual({ ...base, body: null })
    expect(
      verificationExitAnswerSchema.parse({ level: 'phone', option: 'no_code', body: '' }),
    ).toEqual({ level: 'phone', option: 'no_code', body: null })
  })

  it('«Otra cosa» vacía o con solo espacios se manda sin texto', () => {
    expect(verificationExitAnswerSchema.parse(other).body).toBeNull()
    expect(verificationExitAnswerSchema.parse({ ...other, body: '   ' }).body).toBeNull()
  })

  it('«Otra cosa» con texto, sin los bordes', () => {
    expect(
      verificationExitAnswerSchema.parse({
        ...other,
        body: '  no tengo la cédula, tengo pasaporte ',
      }).body,
    ).toBe('no tengo la cédula, tengo pasaporte')
  })

  it('300 caracteres, contados como puntos de código', () => {
    const body = `${'🐾'.repeat(10)}${'a'.repeat(290)}`
    expect(verificationExitAnswerSchema.parse({ ...other, body }).body).toBe(body)
  })

  it('un número que no es un teléfono, un enlace y un usuario de redes', () => {
    const body = 'Vi la cédula 2023 en instagram.com/luna y en @refugio'
    expect(verificationExitAnswerSchema.parse({ ...other, body }).body).toBe(body)
  })

  it('solo espacios con una opción que no es «Otra cosa» es sin texto', () => {
    expect(verificationExitAnswerSchema.parse({ ...base, body: '  ' }).body).toBeNull()
  })
})

describe('verificationExitAnswerSchema frena', () => {
  it('una opción del otro nivel', () => {
    expect(errorsOf({ ...base, option: 'no_code' })).toEqual([
      { path: 'option', key: 'verification.exit.errors.option' },
    ])
    expect(errorsOf({ level: 'phone', option: 'too_much', body: 'algo' })).toEqual([
      { path: 'option', key: 'verification.exit.errors.option' },
    ])
  })

  it('un texto con una opción que no es «Otra cosa»', () => {
    expect(errorsOf({ ...base, body: 'algo' })).toEqual([
      { path: 'body', key: 'verification.exit.errors.option' },
    ])
  })

  it('301 caracteres', () => {
    expect(errorsOf({ ...other, body: 'a'.repeat(301) })).toEqual([
      { path: 'body', key: 'verification.exit.errors.too_long' },
    ])
    expect(errorsOf({ ...other, body: `${'🐾'.repeat(11)}${'a'.repeat(290)}` })).toEqual([
      { path: 'body', key: 'verification.exit.errors.too_long' },
    ])
  })

  it('un teléfono y un correo, citados', () => {
    expect(errorsOf({ ...other, body: 'llamame al 099 123 456' })).toEqual([
      {
        path: 'body',
        key: 'verification.exit.errors.contact',
        values: { fragment: '099 123 456' },
      },
    ])
    expect(errorsOf({ ...other, body: 'ana@gmail.com' })).toEqual([
      {
        path: 'body',
        key: 'verification.exit.errors.contact',
        values: { fragment: 'ana@gmail.com' },
      },
    ])
  })

  it('un nivel, una opción o un texto que no son', () => {
    expect(errorsOf({ ...base, level: 'vouch' })).toEqual([
      { path: 'level', key: 'verification.exit.errors.option' },
    ])
    expect(errorsOf({ ...base, option: 'nope' })).toEqual([
      { path: 'option', key: 'verification.exit.errors.option' },
    ])
    expect(errorsOf({ ...base, body: 3 })).toEqual([
      { path: 'body', key: 'verification.exit.errors.failed' },
    ])
    expect(errorsOf({ ...base, extra: 1 })).toHaveLength(1)
  })
})

describe('verificationExitSkipSchema', () => {
  it('el nivel y nada más', () => {
    expect(verificationExitSkipSchema.parse({ level: 'phone' })).toEqual({ level: 'phone' })
    expect(verificationExitSkipSchema.safeParse({ level: 'x' }).error?.issues[0]?.message).toBe(
      'verification.exit.errors.option',
    )
  })
})
