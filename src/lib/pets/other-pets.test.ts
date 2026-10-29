// Covers: historia #242, criterios 1, 2 y 3.
import { describe, expect, it } from 'vitest'
import { hasOtherPets } from './other-pets'

describe('hasOtherPets', () => {
  it('sin nada a la vista en el perfil, no invita', () => {
    expect(hasOtherPets([], 'TOBI')).toBe(false)
  })

  it('si lo único a la vista es el animal que se mira, no invita', () => {
    expect(hasOtherPets(['TOBI'], 'TOBI')).toBe(false)
  })

  it('si lo único a la vista es la camada que se mira, no invita', () => {
    expect(hasOtherPets(['CAMADA'], 'CAMADA')).toBe(false)
  })

  it('con otra publicación además de la que se mira, invita', () => {
    expect(hasOtherPets(['TOBI', 'LUNA'], 'TOBI')).toBe(true)
    expect(hasOtherPets(['CAMADA', 'TOBI'], 'CAMADA')).toBe(true)
  })

  it('si la que se mira no salió en la tanda, cualquier otra alcanza', () => {
    expect(hasOtherPets(['LUNA'], 'TOBI')).toBe(true)
  })
})
