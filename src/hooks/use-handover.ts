'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { markPetAdopted } from '@/actions/adoptions'
import { signInWithNext } from '@/lib/auth/next-destination'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { myPetPath } from '@/lib/pets/paths'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { failureOf, type PetStatusFailure } from './use-pet-status'

/** «Se lo di a alguien que no vino por el sitio». */
export const OUTSIDE = 'outside'

/** Por qué la elegida ya no se puede elegir: la clave de su texto, ya armado por persona. */
export type HandoverRefusal = 'gone' | 'you_blocked' | 'revoked'

const REFUSALS: Record<string, HandoverRefusal> = {
  'adoptions.handover.errors.gone': 'gone',
  'adoptions.handover.errors.you_blocked': 'you_blocked',
  'adoptions.handover.errors.revoked': 'revoked',
}

type Options = { petId: string; back: string; self: string }

// Marcar adoptado desde «¿A quién se lo diste?» (plan §Marcar adoptado). Un intento por apertura:
// un doble toque o un reintento después de un corte que sí llegó no marca dos veces (FR-055). Lo que
// no llegó se dice nombrando el botón y deja lo elegido; la elegida que dejó de estar aceptada vuelve
// a «sin elegir» con las aceptadas de ahora (FR-004); el animal que cambió, a ver cómo quedó.
export function useHandover({ petId, back, self }: Options) {
  const router = useRouter()
  const [attemptId] = useState(() => crypto.randomUUID())
  const [choice, setChoice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{ kind: PetStatusFailure; attempt: number } | null>(null)
  const [refusal, setRefusal] = useState<{ kind: HandoverRefusal; candidate: string } | null>(null)

  function choose(value: string) {
    setChoice(value)
    setFailure(null)
  }

  async function confirm() {
    if (busy || choice === null) return
    setBusy(true)
    setRefusal(null)
    const applicationId = choice === OUTSIDE ? null : choice
    const outcome = navigator.onLine
      ? await raceDeadline(
          markPetAdopted({ petId, applicationId, attemptId }, back),
          SAVE_DEADLINE_MS,
        )
      : ({ kind: 'threw' } as const)
    setBusy(false)

    if (outcome.kind !== 'result') {
      const kind = failureOf(outcome.kind)
      setFailure((previous) => ({ kind, attempt: (previous?.attempt ?? 0) + 1 }))
      return
    }
    const { result } = outcome
    setFailure(null)
    if (result.ok) {
      router.replace(result.data.returnTo)
      return
    }
    if (result.error === 'adoptions.handover.errors.session') {
      router.push(signInWithNext(self))
      return
    }
    const refused = REFUSALS[result.error]
    if (refused !== undefined && choice !== OUTSIDE) {
      setRefusal({ kind: refused, candidate: choice })
      setChoice(null)
      router.refresh()
      return
    }
    if (result.detail?.then === 'show_state') {
      router.replace(myPetPath(petId))
      return
    }
    setFailure((previous) => ({ kind: 'no_response', attempt: (previous?.attempt ?? 0) + 1 }))
  }

  return { choice, choose, busy, failure, refusal, confirm }
}
