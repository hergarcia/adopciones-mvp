import type { MyLitter } from '@/lib/litters/types'
import type { PetSummary } from '@/lib/pets/types'
import { canRequest, type IdentityStatus } from './identity-status'
import { isLevelOne, type PhoneStatus } from './phone-status'

// La invitación de «Mis animales» (historia #281): a quien publicó algo, tiene el teléfono, puede
// pedir la identidad hoy y nunca tocó «Ahora no» (FR-001, FR-005).
export function identityInviteShown(input: {
  publications: number
  phone: PhoneStatus
  identity: IdentityStatus
  dismissed: boolean
}): boolean {
  return (
    input.publications > 0 &&
    isLevelOne(input.phone) &&
    canRequest(input.identity) &&
    !input.dismissed
  )
}

const LISTED_PET_STATES: readonly PetSummary['state'][] = ['available', 'in_process']

// El nombre de la única publicación, si se ve en el listado: nombrar a una adoptada o pausada diría
// que algo cambia donde no aparece (FR-007, R3).
export function inviteSubject(
  pets: readonly Pick<PetSummary, 'name' | 'state'>[],
  litters: readonly Pick<MyLitter, 'name' | 'state'>[],
): string | null {
  if (pets.length + litters.length !== 1) return null
  const listed = [
    ...pets.filter((pet) => LISTED_PET_STATES.includes(pet.state)),
    ...litters.filter((litter) => litter.state === 'available'),
  ]
  return listed[0]?.name ?? null
}
