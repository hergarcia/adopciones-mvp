// Covers: #244 (el texto debajo del título de la vista previa: la zona y el nivel, o como antes)
import { describe, expect, it } from 'vitest'
import { shareDescription } from './share-description'

const texts = {
  listing: 'Animales en adopción',
  withLevel: (zone: string, level: string) => `${zone} · ${level}`,
}

describe('shareDescription', () => {
  it('a la vista dice la zona y el nivel de quien publicó', () => {
    expect(
      shareDescription(
        { zone: 'Montevideo', adopted: false, level: 'Identidad verificada' },
        texts,
      ),
    ).toBe('Montevideo · Identidad verificada')
  })

  it('a la vista y sin poder saber el nivel, solo la zona, como antes', () => {
    expect(shareDescription({ zone: 'Montevideo', adopted: false, level: null }, texts)).toBe(
      'Montevideo',
    )
  })

  it('adoptado sigue diciendo el nivel, sin la zona', () => {
    expect(
      shareDescription({ zone: 'Montevideo', adopted: true, level: 'Teléfono verificado' }, texts),
    ).toBe('Teléfono verificado')
  })

  it('adoptado y sin nivel, «Animales en adopción», como antes', () => {
    expect(shareDescription({ zone: 'Montevideo', adopted: true, level: null }, texts)).toBe(
      'Animales en adopción',
    )
  })
})
