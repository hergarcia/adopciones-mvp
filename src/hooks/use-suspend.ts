'use client'

import { useState } from 'react'
import { suspendAccount, type AlreadyDetail, type ClosedDetail } from '@/actions/moderation'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { failureOf } from './use-pet-status'

export type SuspendFailure = 'offline' | 'no_response'

/** Cómo terminó una suspensión que llegó a la acción. */
export type SuspendOutcome =
  | { kind: 'done'; name: string }
  | { kind: 'field'; key: string }
  | { kind: 'already'; detail: AlreadyDetail | null }
  | { kind: 'closed'; detail: ClosedDetail }
  | { kind: 'refused'; key: string }

const FIELD_ERRORS = new Set([
  'moderation.errors.reason_required',
  'moderation.errors.reason_too_long',
])

// Suspender desde la hoja (FR-030): sin conexión y sin respuesta son dos mensajes distintos y lo
// escrito queda; un segundo toque mientras corre no hace nada; lo que la base rechaza vuelve con su
// clave, y la hoja decide dónde decirlo.
export function useSuspend(input: { publicId: string; reportId: string | null }) {
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{ kind: SuspendFailure; attempt: number } | null>(null)

  function fail(kind: SuspendFailure) {
    setFailure((previous) => ({ kind, attempt: (previous?.attempt ?? 0) + 1 }))
  }

  async function send(reason: string): Promise<SuspendOutcome | null> {
    if (busy) return null
    setBusy(true)
    const attempt = navigator.onLine
      ? await raceDeadline(
          suspendAccount({
            publicId: input.publicId,
            reason,
            ...(input.reportId === null ? {} : { reportId: input.reportId }),
          }),
          SAVE_DEADLINE_MS,
        )
      : ({ kind: 'threw' } as const)
    setBusy(false)

    if (attempt.kind !== 'result') {
      fail(failureOf(attempt.kind))
      return null
    }
    setFailure(null)
    const { result } = attempt
    if (result.ok) return { kind: 'done', name: result.data.name }
    if (FIELD_ERRORS.has(result.error)) return { kind: 'field', key: result.error }
    const { detail } = result
    if (result.error === 'moderation.errors.already') {
      return { kind: 'already', detail: detail !== undefined && 'since' in detail ? detail : null }
    }
    // Desde un reporte que otra persona ya cerró: no se suspendió (FR-011).
    if (
      result.error === 'moderation.errors.closed' &&
      detail !== undefined &&
      'resolution' in detail
    ) {
      return { kind: 'closed', detail }
    }
    if (result.error === 'moderation.errors.failed') {
      fail('no_response')
      return null
    }
    return { kind: 'refused', key: result.error }
  }

  return { busy, failure, send }
}
