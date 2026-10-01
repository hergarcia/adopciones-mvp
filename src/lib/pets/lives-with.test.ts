// Covers: FR-006
import { describe, expect, it } from 'vitest'
import { livesWith } from './lives-with'

describe('livesWith', () => {
  it('junta por respuesta, en el orden sí, no, no se sabe', () => {
    expect(livesWith({ goodWithKids: 'unknown', goodWithDogs: 'no', goodWithCats: 'yes' })).toEqual(
      [
        { answer: 'yes', who: ['cats'] },
        { answer: 'no', who: ['dogs'] },
        { answer: 'unknown', who: ['kids'] },
      ],
    )
  })

  it('dentro de cada respuesta, niños, perros y gatos; sin grupos vacíos', () => {
    expect(
      livesWith({ goodWithKids: 'yes', goodWithDogs: 'unknown', goodWithCats: 'yes' }),
    ).toEqual([
      { answer: 'yes', who: ['kids', 'cats'] },
      { answer: 'unknown', who: ['dogs'] },
    ])
    expect(livesWith({ goodWithKids: 'no', goodWithDogs: 'no', goodWithCats: 'no' })).toEqual([
      { answer: 'no', who: ['kids', 'dogs', 'cats'] },
    ])
  })
})
