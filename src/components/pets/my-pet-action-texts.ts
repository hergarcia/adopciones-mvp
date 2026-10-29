import { endAdoptionTexts, handoverLineTexts } from '@/components/adoptions/handover-line-texts'
import type { PetAdoptionSummary } from '@/lib/adoptions/types'
import type { PetSummary } from '@/lib/pets/types'
import { expiryLine } from './expiry-texts'
import type { GroupPostTexts } from './group-post-button'
import { shareTexts } from './share-texts'
import { petStatusTexts } from './status-texts'
import { takedownText } from './takedown-texts'

/** Los textos de las acciones debajo de la card de un animal en «Mis animales». */
export async function myPetActionTexts(
  pet: PetSummary,
  context: {
    adoption: PetAdoptionSummary | undefined
    groupPost: GroupPostTexts | null
    seePet: string
    now: Date
  },
) {
  const { adoption, groupPost, seePet, now } = context
  const adopted = pet.state === 'adopted'
  const [share, actions, takedown, expiry, handover, endAdoption] = await Promise.all([
    shareTexts(pet.name),
    petStatusTexts(pet),
    takedownText(pet),
    expiryLine(pet, now),
    adopted ? handoverLineTexts(adoption, pet.sex) : null,
    adopted ? endAdoptionTexts(pet, adoption) : null,
  ])
  return {
    seePet,
    share,
    groupPost,
    status: { ...actions, endAdoption },
    takedown,
    expiry,
    handover,
  }
}
