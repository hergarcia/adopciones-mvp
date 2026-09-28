// Covers: US3-AS4, FR-017 y el Edge Case «Aviso de nombre repetido».
import { describe, expect, it } from 'vitest'
import { normalizePetName } from './duplicate-name'

describe('normalizePetName', () => {
  it('ignora mayúsculas, tildes y los espacios de los bordes', () => {
    expect(normalizePetName('Luna')).toBe('luna')
    expect(normalizePetName('  LUNA ')).toBe('luna')
    expect(normalizePetName('Lúna')).toBe('luna')
    expect(normalizePetName('Chloé')).toBe('chloe')
    expect(normalizePetName('Güera')).toBe('guera')
  })

  it('conserva los espacios de adentro', () => {
    expect(normalizePetName('Luna  Gris')).toBe('luna  gris')
    expect(normalizePetName('Luna Gris')).not.toBe(normalizePetName('LunaGris'))
  })

  it('la ñ no se confunde con la n, escrita de cualquier forma', () => {
    expect(normalizePetName('Peña')).toBe('peña')
    expect(normalizePetName('PEÑA')).toBe('peña')
    expect(normalizePetName('Peña')).toBe('peña')
    expect(normalizePetName('Peña')).not.toBe(normalizePetName('Pena'))
  })
})
