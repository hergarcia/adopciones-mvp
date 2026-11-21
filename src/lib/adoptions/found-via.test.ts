// Covers: FR-010, FR-013 (las seis opciones y qué se manda de lo elegido)
import { describe, expect, it } from 'vitest'
import { FOUND_VIA_OPTIONS, foundViaOf } from './found-via'

describe('las opciones', () => {
  it('son las seis de la historia, en su orden', () => {
    expect(FOUND_VIA_OPTIONS).toEqual([
      'facebook',
      'instagram',
      'whatsapp',
      'seen_here',
      'someone_known',
      'other',
    ])
  })
})

describe('foundViaOf', () => {
  it.each(FOUND_VIA_OPTIONS)('%s se manda tal cual', (option) => {
    expect(foundViaOf(option)).toBe(option)
  })

  // Covers: US1-AS3, US1-AS6 (nada elegido, o la elegida tocada otra vez)
  it('vacío es que no eligió', () => {
    expect(foundViaOf('')).toBeNull()
  })

  it('algo que no es una opción es que no eligió', () => {
    expect(foundViaOf('tiktok')).toBeNull()
  })
})
