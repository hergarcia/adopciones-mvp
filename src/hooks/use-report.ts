'use client'

import { useState } from 'react'
import { reportPerson } from '@/actions/moderation'
import { raceDeadline } from '@/lib/forms/action-deadline'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import type { ReportReason } from '@/lib/moderation/types'
import { failureOf } from './use-pet-status'

export type ReportFailure = 'offline' | 'no_response'

/** Cómo terminó un envío que llegó a la acción y no se guardó. */
export type ReportRefusal =
  | { kind: 'field'; field: 'reason' | 'details'; key: string }
  | { kind: 'gone' }
  | { kind: 'session' }

const FIELD_ERRORS: Record<string, 'reason' | 'details'> = {
  'moderation.errors.duplicate': 'reason',
  'moderation.errors.reason_required': 'reason',
  'moderation.errors.self': 'reason',
  'moderation.errors.details_required': 'details',
  'moderation.errors.details_too_long': 'details',
}

// Enviar un reporte desde la hoja (FR-030): sin conexión y sin respuesta son dos mensajes distintos
// y lo elegido queda; un segundo toque mientras corre no hace nada; un rechazo de la base se dice
// en su campo, y un perfil que ya no existe cierra la hoja.
export function useReport(publicId: string) {
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{ kind: ReportFailure; attempt: number } | null>(null)
  const [sent, setSent] = useState<{ blockedAlready: boolean } | null>(null)

  async function send(report: {
    reason: ReportReason
    details: string
  }): Promise<ReportRefusal | null> {
    if (busy) return null
    setBusy(true)
    const attempt = navigator.onLine
      ? await raceDeadline(reportPerson({ publicId, ...report }), SAVE_DEADLINE_MS)
      : ({ kind: 'threw' } as const)
    setBusy(false)

    if (attempt.kind !== 'result') {
      const kind = failureOf(attempt.kind)
      setFailure((previous) => ({ kind, attempt: (previous?.attempt ?? 0) + 1 }))
      return null
    }
    setFailure(null)
    const { result } = attempt
    if (result.ok) {
      setSent(result.data)
      return null
    }
    const field = FIELD_ERRORS[result.error]
    if (field !== undefined) return { kind: 'field', field, key: result.error }
    if (result.error === 'moderation.errors.not_found') return { kind: 'gone' }
    if (result.error === 'moderation.errors.session') return { kind: 'session' }
    setFailure((previous) => ({ kind: 'no_response', attempt: (previous?.attempt ?? 0) + 1 }))
    return null
  }

  return { busy, failure, sent, send }
}
