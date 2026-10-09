// Covers: US4-AS5, FR-051 (al menos 3 letras sin contar los espacios), research R6 (recorte y largo)
import { describe, expect, it } from 'vitest'
import { adminSearchSchema } from './admin-search'

function errorsOf(input: unknown) {
  const parsed = adminSearchSchema.safeParse(input)
  return parsed.success ? [] : parsed.error.issues.map((issue) => [issue.path, issue.message])
}

const TOO_SHORT = [[['query'], 'admin.search.errors.too_short']]
const TOO_LONG = [[['query'], 'admin.search.errors.too_long']]

describe('adminSearchSchema', () => {
  it('con 2 letras pide 3; con 3 busca', () => {
    expect(errorsOf({ query: 'an' })).toEqual(TOO_SHORT)
    expect(adminSearchSchema.parse({ query: 'ana' })).toEqual({ query: 'ana' })
  })

  it('los espacios, en los bordes o en el medio, no cuentan como letras', () => {
    expect(errorsOf({ query: '   an   ' })).toEqual(TOO_SHORT)
    expect(errorsOf({ query: 'a b' })).toEqual(TOO_SHORT)
    expect(errorsOf({ query: 'a\t\tb' })).toEqual(TOO_SHORT)
    expect(errorsOf({ query: '      ' })).toEqual(TOO_SHORT)
    expect(adminSearchSchema.parse({ query: 'a b c' })).toEqual({ query: 'a b c' })
  })

  it('busca sin los bordes y con un solo espacio entre palabras', () => {
    expect(adminSearchSchema.parse({ query: '  marta \t  suárez  ' })).toEqual({
      query: 'marta suárez',
    })
    expect(adminSearchSchema.parse({ query: 'ana\nperez' })).toEqual({ query: 'ana perez' })
  })

  it('hasta 60 caracteres, contados sin los bordes y como puntos de código', () => {
    expect(adminSearchSchema.parse({ query: 'a'.repeat(60) })).toEqual({ query: 'a'.repeat(60) })
    expect(errorsOf({ query: 'a'.repeat(61) })).toEqual(TOO_LONG)
    expect(adminSearchSchema.parse({ query: `  ${'ñ'.repeat(60)}  ` })).toEqual({
      query: 'ñ'.repeat(60),
    })
    expect(adminSearchSchema.parse({ query: '🐶'.repeat(60) })).toEqual({ query: '🐶'.repeat(60) })
    expect(errorsOf({ query: `${'a'.repeat(30)} ${'b'.repeat(30)}` })).toEqual(TOO_LONG)
  })

  it('cuenta las letras como puntos de código, no como unidades', () => {
    expect(errorsOf({ query: '🐶🐶' })).toEqual(TOO_SHORT)
    expect(adminSearchSchema.parse({ query: '🐶🐶🐶' })).toEqual({ query: '🐶🐶🐶' })
  })

  it('sin texto, o con algo más que el texto, no busca', () => {
    expect(errorsOf({})).toEqual(TOO_SHORT)
    expect(errorsOf({ query: 123 })).toEqual(TOO_SHORT)
    expect(adminSearchSchema.safeParse({ query: 'ana', limit: 50 }).success).toBe(false)
  })
})
