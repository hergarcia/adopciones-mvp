'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { reactivateAccount, type AlreadyDetail } from '@/actions/moderation'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { failureOf } from './use-pet-status'

export type ReactivateFailure = 'offline' | 'no_response'

/** Por qué ya no hay nada que reactivar: otra persona lo hizo, o la cuenta se borró. */
export type ReactivateSettled = { kind: 'already'; detail: AlreadyDetail | null } | { kind: 'gone' }

// Reactivar desde la lista (FR-030): sin conexión y sin respuesta son dos mensajes distintos y nada
// cambia; si otra persona ya la reactivó o la cuenta se borró, la fila lo dice (Edge Cases, FR-032);
// quien dejó de administrar ve, al recargar, que la página no existe.
export function useReactivate(options: { suspensionId: string; onDone: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{ kind: ReactivateFailure; attempt: number } | null>(null)
  const [settled, setSettled] = useState<ReactivateSettled | null>(null)

  function fail(kind: ReactivateFailure) {
    setFailure((previous) => ({ kind, attempt: (previous?.attempt ?? 0) + 1 }))
  }

  async function reactivate(): Promise<boolean> {
    if (busy) return false
    setBusy(true)
    const attempt = navigator.onLine
      ? await raceDeadline(
          reactivateAccount({ suspensionId: options.suspensionId }),
          SAVE_DEADLINE_MS,
        )
      : ({ kind: 'threw' } as const)
    setBusy(false)

    if (attempt.kind !== 'result') {
      fail(failureOf(attempt.kind))
      return false
    }
    setFailure(null)
    const { result } = attempt
    if (result.ok) {
      options.onDone()
      router.refresh()
      return true
    }
    if (result.error === 'moderation.errors.already') {
      setSettled({ kind: 'already', detail: result.detail ?? null })
      return true
    }
    if (result.error === 'moderation.errors.gone') {
      setSettled({ kind: 'gone' })
      return true
    }
    if (result.error === 'moderation.errors.not_admin') {
      router.refresh()
      return true
    }
    fail('no_response')
    return false
  }

  return { busy, failure, settled, reactivate }
}
