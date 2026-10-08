'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { acceptCommitment } from '@/actions/adoptions'
import { committedPath } from '@/lib/adoptions/paths'
import { myApplicationPath } from '@/lib/applications/paths'
import { signInWithNext } from '@/lib/auth/next-destination'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { failureOf, type PetStatusFailure } from './use-pet-status'

/** Por qué no se aceptó: la conexión, el sitio, o la adopción que ya no está pendiente. */
export type CommitmentFailure = PetStatusFailure | 'closed' | 'not_found'

const REFUSALS: Record<string, CommitmentFailure> = {
  'adoptions.commitment.errors.closed': 'closed',
  'adoptions.commitment.errors.not_found': 'not_found',
}

// «Acepto el compromiso» (plan §Mi solicitud). Lo que no llegó deja el compromiso pendiente y se
// dice nombrando el botón; un reintento después de un corte que sí había llegado no cambia nada
// (FR-055). Al salir bien, Mi solicitud con el aviso; si la adopción cambió mientras tanto, la
// pantalla vuelve a cargar con el estado de ahora.
export function useAcceptCommitment(applicationId: string) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{ kind: CommitmentFailure; attempt: number } | null>(null)

  function fail(kind: CommitmentFailure) {
    setFailure((previous) => ({ kind, attempt: (previous?.attempt ?? 0) + 1 }))
  }

  async function accept() {
    if (busy) return
    setBusy(true)
    const outcome = navigator.onLine
      ? await raceDeadline(acceptCommitment({ applicationId }), SAVE_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    setBusy(false)

    if (outcome.kind !== 'result') {
      fail(failureOf(outcome.kind))
      return
    }
    const { result } = outcome
    if (result.ok) {
      setFailure(null)
      router.replace(committedPath(applicationId))
      return
    }
    if (result.error === 'adoptions.commitment.errors.session') {
      router.push(signInWithNext(myApplicationPath(applicationId)))
      return
    }
    const refused = REFUSALS[result.error]
    fail(refused ?? 'no_response')
    if (refused !== undefined) router.refresh()
  }

  return { busy, failure, accept }
}
