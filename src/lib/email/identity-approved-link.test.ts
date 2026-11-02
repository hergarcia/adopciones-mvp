// Covers: US3-AS1, US3-AS2 (FR-019, FR-020).
import { describe, expect, it } from 'vitest'
import { applyAfterIdentityPath } from '@/lib/applications/paths'
import { approvedSecondary } from './identity-approved-link'

const t = (key: string, values?: { name: string }) =>
  values === undefined ? key : `${key}:${values.name}`
const TOBI = { code: 'tobi-abc123', name: 'Tobi' }

describe('approvedSecondary', () => {
  it('con un animal de «Quiero adoptar», lleva al animal aunque el pedido venga de la invitación', () => {
    const expected = { label: 'pet_button:Tobi', path: applyAfterIdentityPath(TOBI.code) }
    expect(approvedSecondary({ returnPet: TOBI, toMyPets: true }, t)).toEqual(expected)
    expect(approvedSecondary({ returnPet: TOBI, toMyPets: false }, t)).toEqual(expected)
  })

  it('sin animal y desde la invitación, lleva a «Mis animales»', () => {
    expect(approvedSecondary({ returnPet: null, toMyPets: true }, t)).toEqual({
      label: 'my_pets_button',
      path: '/mis-animales',
    })
  })

  it('sin animal y desde otro lado, no suma enlace', () => {
    expect(approvedSecondary({ returnPet: null, toMyPets: false }, t)).toBeNull()
  })
})
