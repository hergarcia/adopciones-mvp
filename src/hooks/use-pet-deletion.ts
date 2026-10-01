'use client'

import { useRouter } from 'next/navigation'
import { deletePet } from '@/actions/pet-status'
import { signInWithNext } from '@/lib/auth/next-destination'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { withPetNotice } from '@/lib/pets/notice'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { failureOf, type PetStatusFailure } from './use-pet-status'

// Borrar lleva a «Mis animales» con el aviso: la card o la pantalla del animal ya no existen para
// mostrarlo. Uno que ya no existe terminó igual. Devuelve por qué no llegó, para el diálogo.
export function usePetDeletion(petId: string, returnPath: string) {
  const router = useRouter()

  return async function remove(): Promise<PetStatusFailure | null> {
    const outcome = navigator.onLine
      ? await raceDeadline(deletePet({ petId }), SAVE_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    if (outcome.kind !== 'result') return failureOf(outcome.kind)
    const { result } = outcome
    if (result.ok || result.error === 'pets.status.errors.not_found') {
      router.replace(withPetNotice('deleted'))
      return null
    }
    if (result.error === 'pets.status.errors.session') {
      router.push(signInWithNext(returnPath))
      return null
    }
    return 'no_response'
  }
}
