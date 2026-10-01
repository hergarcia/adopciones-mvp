'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { resolvePetReview } from '@/actions/pet-review'
import { raceDeadline } from '@/lib/forms/action-deadline'
import type { TakedownReason } from '@/lib/pets/types'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { failureOf, type PetStatusFailure } from './use-pet-status'

export type PetReviewOutcome = 'reviewed' | 'taken_down'

export type PetReviewChoice =
  { outcome: 'reviewed' } | { outcome: 'taken_down'; reason: TakedownReason; note: string }

/** Lo que la deja sin acciones: otra persona la resolvió, o se borró (FR-026). */
export type PetReviewSettled = 'closed' | 'gone'

const SETTLED: Record<string, PetReviewSettled> = {
  'pet_review.errors.closed': 'closed',
  'pet_review.errors.gone': 'gone',
}

// Los rechazos que se dicen junto a las acciones, que siguen ahí.
const REFUSALS = new Set([
  'pet_review.errors.own',
  'pet_review.errors.note_required',
  'pet_review.errors.note_too_long',
])

type Options = {
  petId: string
  /** La espera que vio la pantalla, tal como la devolvió la base. */
  knownSince: string
  /** Se aplicó: la lista se vuelve a dibujar sin ella y el aviso lo dice. */
  onDone: (outcome: PetReviewOutcome) => void
}

// Marcar revisada o dar de baja una publicación de la lista (contracts §Server Actions). Sin
// conexión y sin respuesta son dos mensajes distintos y nada cambia; reintentar repite lo mismo, y
// la base no lo aplica dos veces (US4-AS11). Quien dejó de administrar ve, al recargar, que la
// página no existe (FR-023).
export function usePetReview({ petId, knownSince, onDone }: Options) {
  const router = useRouter()
  const [busy, setBusy] = useState<PetReviewOutcome | null>(null)
  const [failure, setFailure] = useState<{ kind: PetStatusFailure; attempt: number } | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)
  const [settled, setSettled] = useState<PetReviewSettled | null>(null)
  const [last, setLast] = useState<PetReviewChoice | null>(null)

  async function run(choice: PetReviewChoice): Promise<boolean> {
    if (busy !== null) return false
    setBusy(choice.outcome)
    setLast(choice)
    setRefusal(null)
    const attempt = navigator.onLine
      ? await raceDeadline(resolvePetReview({ petId, knownSince, ...choice }), SAVE_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    setBusy(null)

    if (attempt.kind !== 'result') {
      const kind = failureOf(attempt.kind)
      setFailure((previous) => ({ kind, attempt: (previous?.attempt ?? 0) + 1 }))
      return false
    }
    setFailure(null)
    const { result } = attempt
    if (result.ok) {
      onDone(choice.outcome)
      router.refresh()
      return true
    }
    const settledAs = SETTLED[result.error]
    if (settledAs !== undefined) {
      setSettled(settledAs)
    } else if (REFUSALS.has(result.error)) {
      setRefusal(result.error)
    } else if (result.error === 'pet_review.errors.not_admin') {
      router.refresh()
    } else {
      setFailure((previous) => ({ kind: 'no_response', attempt: (previous?.attempt ?? 0) + 1 }))
    }
    return false
  }

  return {
    busy,
    failure,
    refusal,
    settled,
    run,
    retry: () => (last === null ? Promise.resolve(false) : run(last)),
  }
}

export type PetReviewFlow = ReturnType<typeof usePetReview>
