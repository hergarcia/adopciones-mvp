import { applyAfterIdentityPath } from '@/lib/applications/paths'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import type { IdentityResult } from './send-identity-result'

type Approved = Pick<Extract<IdentityResult, { kind: 'approved' }>, 'returnPet' | 'toMyPets'>

type ApprovedTexts = (key: 'pet_button' | 'my_pets_button', values?: { name: string }) => string

// El segundo enlace del correo de identidad aprobada. El animal de «Quiero adoptar» (#63) gana sobre
// «Mis animales»: si la persona estaba por adoptar, eso es lo que quiere retomar (#281, research R8).
export function approvedSecondary(
  result: Approved,
  t: ApprovedTexts,
): { label: string; path: string } | null {
  if (result.returnPet !== null) {
    return {
      label: t('pet_button', { name: result.returnPet.name }),
      path: applyAfterIdentityPath(result.returnPet.code),
    }
  }
  return result.toMyPets ? { label: t('my_pets_button'), path: MY_PETS_PATH } : null
}
