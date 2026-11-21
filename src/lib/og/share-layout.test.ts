// Covers: FR-011 (plan §Vista previa: el nombre entero en su columna)
import { describe, expect, it } from 'vitest'
import { profileLevelSize, shareNameSize } from './share-layout'

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

// Covers: FR-003, SC-003 (#280: el nivel entero dentro del cuadrado del centro)
describe('profileLevelSize', () => {
  it('los dos niveles cortos entran en dos renglones al máximo', () => {
    expect(profileLevelSize('Teléfono verificado')).toBe(96)
    expect(profileLevelSize('Identidad verificada')).toBe(96)
  })

  it('el más largo lo decide su mejor corte en dos renglones', () => {
    // «Identidad verificada» arriba y «y avalada» abajo: 20 letras en 630 px.
    expect(profileLevelSize('Identidad verificada y avalada')).toBe(78)
    expect(profileLevelSize('y avalada Identidad verificada')).toBe(82)
  })

  it('una sola palabra va en un renglón', () => {
    expect(profileLevelSize('Verificadísimamente')).toBe(82)
  })

  it('un texto que entra en un renglón no se parte', () => {
    expect(profileLevelSize('Sí')).toBe(96)
  })

  it('nunca baja de 56', () => {
    expect(profileLevelSize('Identidad verificada y avalada por muchas personas del barrio')).toBe(
      56,
    )
    expect(profileLevelSize('Identidad verificada y avalada por dos personas')).toBe(65)
  })
})
