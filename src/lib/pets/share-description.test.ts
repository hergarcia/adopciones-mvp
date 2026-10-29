// Covers: #244 (el texto debajo del título de la vista previa: la zona y el nivel de quien publicó)
import { describe, expect, it } from 'vitest'
import { shareDescription } from './share-description'

const PUBLISHER = 'Quien publica tiene la identidad verificada.'
const texts = {
  listing: 'Animales en adopción',
  withPublisher: (zone: string, publisher: string) => `${zone}. ${publisher}`,
}

describe('shareDescription', () => {
  it('a la vista dice la zona y el nivel de quien publicó', () => {
    expect(
      shareDescription({ zone: 'Montevideo', adopted: false, publisher: PUBLISHER }, texts),
    ).toBe(`Montevideo. ${PUBLISHER}`)
  })

  it('a la vista y sin poder saber el nivel, solo la zona', () => {
    expect(shareDescription({ zone: 'Montevideo', adopted: false, publisher: null }, texts)).toBe(
      'Montevideo',
    )
  })

  it('adoptado sigue diciendo el nivel, sin la zona', () => {
    expect(
      shareDescription({ zone: 'Montevideo', adopted: true, publisher: PUBLISHER }, texts),
    ).toBe(PUBLISHER)
  })

  it('adoptado y sin nivel, «Animales en adopción»', () => {
    expect(shareDescription({ zone: 'Montevideo', adopted: true, publisher: null }, texts)).toBe(
      'Animales en adopción',
    )
  })
})
