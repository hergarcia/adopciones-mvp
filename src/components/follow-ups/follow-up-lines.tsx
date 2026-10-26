import type { PetFollowUp } from '@/lib/follow-ups/types'
import { FollowUpLine } from './follow-up-line'
import { followUpLineTexts } from './follow-up-line-texts'

// En «Mis animales», el seguimiento solo de la adopción en curso de un adoptado (plan §Mis animales
// de la #69).
export async function followUpLines(
  pets: { id: string; state: string }[],
  followUps: ReadonlyMap<string, PetFollowUp>,
): Promise<Map<string, React.ReactNode>> {
  const lines = await Promise.all(
    pets.map(async (pet) => {
      const followUp = followUps.get(pet.id)
      const current = pet.state === 'adopted' && followUp?.adoptionCurrent === true
      const texts = current ? await followUpLineTexts(followUp) : null
      return [pet.id, texts === null ? null : <FollowUpLine key={pet.id} texts={texts} />] as const
    }),
  )
  return new Map(lines)
}
