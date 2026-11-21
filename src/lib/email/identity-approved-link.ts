import { applyAfterIdentityPath, MY_APPLICATIONS_PATH } from '@/lib/applications/paths'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import type { IdentityResult } from './send-identity-result'

type Approved = Pick<
  Extract<IdentityResult, { kind: 'approved' }>,
  'returnPet' | 'toMyPets' | 'held'
>

type ApprovedTexts = (
  key: 'pet_button' | 'my_pets_button' | 'my_applications_button',
  values?: { name: string },
) => string

// El segundo enlace del correo de identidad aprobada. Las solicitudes que esperaban (#289) ganan:
// el correo cuenta qué pasó con ellas y «Mis solicitudes» es donde se ve. Después, el animal de
// «Quiero adoptar» (#63) gana sobre «Mis animales»: si la persona estaba por adoptar, eso es lo que
// quiere retomar (#281, research R8).
export function approvedSecondary(
  result: Approved,
  t: ApprovedTexts,
): { label: string; path: string } | null {
  if (result.held.some((line) => line.outcome !== 'lapsed')) {
    return { label: t('my_applications_button'), path: MY_APPLICATIONS_PATH }
  }
  if (result.returnPet !== null) {
    return {
      label: t('pet_button', { name: result.returnPet.name }),
      path: applyAfterIdentityPath(result.returnPet.code),
    }
  }
  return result.toMyPets ? { label: t('my_pets_button'), path: MY_PETS_PATH } : null
}
