// Covers: US3-AS1, US3-AS2 (FR-019, FR-020); #289 US2-AS1, FR-033, FR-035.
import { describe, expect, it } from 'vitest'
import { applyAfterIdentityPath } from '@/lib/applications/paths'
import { approvedSecondary } from './identity-approved-link'
import type { HeldMailLine } from './held-mail'

const t = (key: string, values?: { name: string }) =>
  values === undefined ? key : `${key}:${values.name}`
const TOBI = { code: 'tobi-abc123', name: 'Tobi' }
const NONE: HeldMailLine[] = []
const MY_APPLICATIONS = { label: 'my_applications_button', path: '/mis-solicitudes' }

describe('approvedSecondary', () => {
  it('con un animal de «Quiero adoptar», lleva al animal aunque el pedido venga de la invitación', () => {
    const expected = { label: 'pet_button:Tobi', path: applyAfterIdentityPath(TOBI.code) }
    expect(approvedSecondary({ returnPet: TOBI, toMyPets: true, held: NONE }, t)).toEqual(expected)
    expect(approvedSecondary({ returnPet: TOBI, toMyPets: false, held: NONE }, t)).toEqual(expected)
  })

  it('sin animal y desde la invitación, lleva a «Mis animales»', () => {
    expect(approvedSecondary({ returnPet: null, toMyPets: true, held: NONE }, t)).toEqual({
      label: 'my_pets_button',
      path: '/mis-animales',
    })
  })

  it('sin animal y desde otro lado, no suma enlace', () => {
    expect(approvedSecondary({ returnPet: null, toMyPets: false, held: NONE }, t)).toBeNull()
  })

  it.each(['released', 'waiting'] as const)(
    'con alguna que esperaba (%s), «Ver mis solicitudes» gana sobre el animal y sobre «Mis animales»',
    (outcome) => {
      const held: HeldMailLine[] = [{ name: 'Pipo', outcome, until: null }]
      expect(approvedSecondary({ returnPet: TOBI, toMyPets: true, held }, t)).toEqual(
        MY_APPLICATIONS,
      )
      expect(approvedSecondary({ returnPet: null, toMyPets: false, held }, t)).toEqual(
        MY_APPLICATIONS,
      )
    },
  )

  it('una que justo venció no cuenta: el enlace es el de siempre', () => {
    const held: HeldMailLine[] = [{ name: 'Pipo', outcome: 'lapsed', until: null }]
    expect(approvedSecondary({ returnPet: null, toMyPets: false, held }, t)).toBeNull()
  })
})
