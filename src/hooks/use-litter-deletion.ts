'use client'

import { useRouter } from 'next/navigation'
import { deleteLitter } from '@/actions/litters'
import { signInWithNext } from '@/lib/auth/next-destination'
import type { DeletionAnswer } from '@/lib/pets/deletion-reason'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { withPetNotice } from '@/lib/pets/notice'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { failureOf, type PetStatusFailure } from './use-pet-status'

// Borrar la camada entera desde «Mis animales» o su panel (US3), como borrar un animal: lleva a «Mis
// animales» con el aviso, una que ya no existe terminó igual, y devuelve por qué no llegó. `reason`
// va solo cuando la confirmación mostró «¿Por qué la borrás?» (historia #263).
export function useLitterDeletion(litterId: string, returnPath: string) {
  const router = useRouter()

  return async function remove(reason?: DeletionAnswer): Promise<PetStatusFailure | null> {
    const outcome = navigator.onLine
      ? await raceDeadline(deleteLitter(litterId, reason), SAVE_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    if (outcome.kind !== 'result') return failureOf(outcome.kind)
    const { result } = outcome
    if (result.ok) {
      router.replace(withPetNotice('deleted'))
      return null
    }
    if (result.error === 'pets.errors.session') {
      router.push(signInWithNext(returnPath))
      return null
    }
    return 'no_response'
  }
}
