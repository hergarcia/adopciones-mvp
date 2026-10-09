// Covers: US3-AS3, US3-AS7 (las barras de cada momento en Encuestas)
import { describe, expect, it } from 'vitest'
import { optionBars } from './option-bars'

describe('optionBars', () => {
  it('cada opción mide su parte de las respuestas y la más elegida va marcada', () => {
    expect(
      optionBars([
        { option: 'yes', chosen: 6 },
        { option: 'maybe', chosen: 3 },
        { option: 'no', chosen: 1 },
      ]),
    ).toEqual([
      { option: 'yes', chosen: 6, share: 0.6, isTop: true },
      { option: 'maybe', chosen: 3, share: 0.3, isTop: false },
      { option: 'no', chosen: 1, share: 0.1, isTop: false },
    ])
  })

  it('la más elegida no tiene que ser la primera', () => {
    expect(
      optionBars([
        { option: 'yes', chosen: 1 },
        { option: 'somewhat', chosen: 0 },
        { option: 'no', chosen: 3 },
      ]).map((bar) => [bar.share, bar.isTop]),
    ).toEqual([
      [0.25, false],
      [0, false],
      [0.75, true],
    ])
  })

  it('en un empate van marcadas todas las que empatan', () => {
    expect(
      optionBars([
        { option: 'yes', chosen: 2 },
        { option: 'maybe', chosen: 2 },
        { option: 'back_to_groups', chosen: 1 },
      ]).map((bar) => bar.isTop),
    ).toEqual([true, true, false])
  })

  it('una sola respuesta llena su barra', () => {
    expect(
      optionBars([
        { option: 'yes', chosen: 0 },
        { option: 'maybe', chosen: 1 },
        { option: 'no', chosen: 0 },
      ]),
    ).toEqual([
      { option: 'yes', chosen: 0, share: 0, isTop: false },
      { option: 'maybe', chosen: 1, share: 1, isTop: true },
      { option: 'no', chosen: 0, share: 0, isTop: false },
    ])
  })

  it('todo en cero: sin barras y ninguna marcada', () => {
    expect(
      optionBars([
        { option: 'yes', chosen: 0 },
        { option: 'maybe', chosen: 0 },
        { option: 'no', chosen: 0 },
      ]),
    ).toEqual([
      { option: 'yes', chosen: 0, share: 0, isTop: false },
      { option: 'maybe', chosen: 0, share: 0, isTop: false },
      { option: 'no', chosen: 0, share: 0, isTop: false },
    ])
  })

  it('sin opciones, nada', () => {
    expect(optionBars([])).toEqual([])
  })
})
