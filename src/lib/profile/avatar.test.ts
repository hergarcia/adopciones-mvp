import { describe, expect, it } from 'vitest'
import { ACCEPTED_TYPES, MAX_UPLOAD_BYTES, rejectionFor, squareCrop } from './avatar'

// Covers: US2-AS7, FR-025, KL-007
describe('qué foto se acepta', () => {
  it.each(ACCEPTED_TYPES)('acepta %s', (type) => {
    expect(rejectionFor({ type, size: 1000 })).toBeNull()
  })

  it('rechaza HEIC, que el navegador no sabe abrir fuera de Safari', () => {
    expect(rejectionFor({ type: 'image/heic', size: 1000 })).toBe('profile.errors.photo_type')
  })

  it.each([
    ['un PDF', 'application/pdf'],
    ['un GIF', 'image/gif'],
    ['nada', ''],
  ])('rechaza %s', (_caso, type) => {
    expect(rejectionFor({ type, size: 1000 })).toBe('profile.errors.photo_type')
  })

  it('acepta una imagen de exactamente el límite', () => {
    expect(rejectionFor({ type: 'image/jpeg', size: MAX_UPLOAD_BYTES })).toBeNull()
  })

  it('rechaza un byte más que el límite', () => {
    expect(rejectionFor({ type: 'image/jpeg', size: MAX_UPLOAD_BYTES + 1 })).toBe(
      'profile.errors.photo_too_big',
    )
  })

  it('el tipo se mira antes que el tamaño: decir "pesa mucho" de un PDF confunde', () => {
    expect(rejectionFor({ type: 'application/pdf', size: MAX_UPLOAD_BYTES + 1 })).toBe(
      'profile.errors.photo_type',
    )
  })
})

describe('el recorte al cuadrado', () => {
  it('de una foto apaisada recorta los costados', () => {
    expect(squareCrop(400, 300)).toEqual({ x: 50, y: 0, side: 300 })
  })

  it('de una foto vertical recorta arriba y abajo', () => {
    expect(squareCrop(300, 400)).toEqual({ x: 0, y: 50, side: 300 })
  })

  it('de una ya cuadrada no recorta nada', () => {
    expect(squareCrop(300, 300)).toEqual({ x: 0, y: 0, side: 300 })
  })

  it('con una diferencia impar reparte sin dejar un píxel afuera', () => {
    expect(squareCrop(301, 300)).toEqual({ x: 1, y: 0, side: 300 })
  })

  it('con un lado de un píxel sigue dando un cuadrado válido', () => {
    expect(squareCrop(1, 500)).toEqual({ x: 0, y: 250, side: 1 })
  })
})
