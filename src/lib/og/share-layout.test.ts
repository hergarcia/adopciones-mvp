// Covers: FR-011 (plan §Vista previa: el nombre entero en su columna)
import { describe, expect, it } from 'vitest'
import { shareNameSize } from './share-layout'

describe('shareNameSize', () => {
  it('un nombre corto va al máximo', () => {
    expect(shareNameSize('Tobi')).toBe(128)
  })

  it('lo decide la palabra más larga, no el largo total', () => {
    expect(shareNameSize('Canela')).toBe(88)
    expect(shareNameSize('Manchita del Parque Rodó')).toBe(66)
    expect(shareNameSize('Rodó del Manchita Parque')).toBe(66)
  })

  it('cuenta lo que la persona ve como una letra', () => {
    expect(shareNameSize('Ñandú🇺🇾')).toBe(88)
  })

  it('una palabra muy larga no baja de 40', () => {
    expect(shareNameSize('Maximilianoooo')).toBe(40)
    expect(shareNameSize('Maximilianoo')).toBe(44)
  })
})
