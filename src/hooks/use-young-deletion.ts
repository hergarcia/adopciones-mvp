'use client'

import { useRouter } from 'next/navigation'
import { deleteYoung } from '@/actions/litter-status'
import { signInWithNext } from '@/lib/auth/next-destination'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { withPetNotice } from '@/lib/pets/notice'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { failureOf, type PetStatusFailure } from './use-pet-status'

const TAKEN_DOWN = 'litters.status.errors.taken_down'

// Quitar una cría desde su fila (US4). La pantalla se vuelve a dibujar sin ella; si era la última, la
// camada ya no existe y se va a «Mis animales» con el aviso de borrado. Devuelve por qué no llegó,
// para el diálogo; `taken_down` si la camada se dio de baja mientras tanto.
export function useYoungDeletion(petId: string, returnPath: string) {
  const router = useRouter()

  return async function remove(close: () => void): Promise<PetStatusFailure | 'taken_down' | null> {
    const outcome = navigator.onLine
      ? await raceDeadline(deleteYoung({ petId }), SAVE_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    if (outcome.kind !== 'result') return failureOf(outcome.kind)
    const { result } = outcome
    if (result.ok) {
      if (result.data.litterDeleted) router.replace(withPetNotice('deleted'))
      else close()
      return null
    }
    if (result.error === 'litters.status.errors.session') {
      router.push(signInWithNext(returnPath))
      return null
    }
    return result.error === TAKEN_DOWN ? 'taken_down' : 'no_response'
  }
}
