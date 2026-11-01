// Covers: historia #275, criterio 2: el nombre de 30 caracteres entra entero, sin cortarse ni taparse
// con otro dato; y la dirección entra en un renglón para poder tipearla.
import { describe, expect, it } from 'vitest'
import { POSTER_LAYOUT, posterAddressSize, posterNameSize } from './poster-layout'

describe('posterNameSize', () => {
  it('un nombre corto va al máximo', () => {
    expect(posterNameSize('Luna')).toBe(144)
  })

  it('una palabra de 30 caracteres entra entera en un renglón', () => {
    expect(posterNameSize('Maximilianoooooooooooooooooooo')).toBe(76)
  })

  it('30 caracteres con espacios ocupan hasta dos renglones', () => {
    expect(posterNameSize('Manchita del Parque Rodó y Sol')).toBe(136)
  })

  it('baja hasta que dos palabras comparten un renglón, en vez de partir en tres', () => {
    expect(posterNameSize('Aaaaaaaaa Bbbbbbbbb Ccccccccc')).toBe(120)
    expect(posterNameSize('Aaaaaaaaa Bbbbbbbbb')).toBe(144)
  })

  it('una palabra que llena el renglón justo entra en el primero', () => {
    expect(posterNameSize('Aaaaaaaaaaaaaaaaaaa Bo')).toBe(120)
  })

  it('una palabra larga después de una corta tampoco se parte', () => {
    expect(posterNameSize('Sol Maximilianooooooooooooooooo')).toBe(84)
  })

  it('cuenta lo que la persona ve como una letra', () => {
    expect(posterNameSize('🇺🇾'.repeat(30))).toBe(76)
  })

  it('nunca baja de 64', () => {
    expect(posterNameSize('a'.repeat(40))).toBe(64)
  })
})

describe('POSTER_LAYOUT', () => {
  // Criterio 1: la portada no se deforma; se recorta a 4:5, la proporción de la ficha.
  it('la foto va en 4:5', () => {
    expect(POSTER_LAYOUT.photo.width / POSTER_LAYOUT.photo.height).toBe(0.8)
  })
})

describe('posterAddressSize', () => {
  it('una dirección corta va a 64', () => {
    expect(posterAddressSize('localhost:3000/animales/k3x9p2qa7m')).toBe(64)
  })

  it('una larga baja para entrar en un renglón', () => {
    expect(posterAddressSize('a'.repeat(40))).toBe(58)
  })

  it('nunca baja de 32', () => {
    expect(posterAddressSize('a'.repeat(80))).toBe(32)
  })
})
