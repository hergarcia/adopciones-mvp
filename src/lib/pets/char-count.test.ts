// Covers: el Edge Case «Nombre de más de 30 caracteres o descripción de más de 2000».
import { describe, expect, it } from 'vitest'
import { countCharacters } from './char-count'

describe('countCharacters', () => {
  it('cuenta letras y espacios', () => {
    expect(countCharacters('')).toBe(0)
    expect(countCharacters('Luna')).toBe(4)
    expect(countCharacters('Luna gris')).toBe(9)
    expect(countCharacters('Ñandú')).toBe(5)
  })

  it('una bandera y una familia con ZWJ cuentan uno cada una', () => {
    expect(countCharacters('🇺🇾')).toBe(1)
    expect(countCharacters('👨‍👩‍👧')).toBe(1)
    expect(countCharacters('Luna 🐶')).toBe(6)
  })

  it('una tilde combinante va con su letra', () => {
    expect(countCharacters('é')).toBe(1)
  })
})
