import { describe, expect, it } from 'vitest'
import { badgeParts } from './badge-parts'

// Covers: FR-024. Tres chapitas distintas: si dos se dibujan igual, el nivel lo dice solo el texto.
describe('lo que dibuja cada chapita', () => {
  it('nivel 1: papel con el número, sin tilde ni anillo', () => {
    expect(badgeParts(1)).toEqual({
      fill: 'paper',
      check: false,
      ring: false,
      label: 'badge_level_1',
    })
  })

  it('nivel 2: yerba con el tilde', () => {
    expect(badgeParts(2)).toEqual({
      fill: 'primary',
      check: true,
      ring: false,
      label: 'badge_level_2',
    })
  })

  it('nivel 3: yerba con el tilde y el anillo grabado', () => {
    expect(badgeParts(3)).toEqual({
      fill: 'primary',
      check: true,
      ring: true,
      label: 'badge_level_3',
    })
  })
})
