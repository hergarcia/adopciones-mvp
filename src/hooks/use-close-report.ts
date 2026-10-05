'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { closeReport } from '@/actions/moderation'
import { raceDeadline } from '@/lib/forms/action-deadline'
import type { ReportStanding } from '@/lib/moderation/report-actions'
import { SAVE_DEADLINE_MS } from '@/lib/profile/save-failure'
import { failureOf } from './use-pet-status'

export type CloseFailure = 'offline' | 'no_response'

const SETTLED: Record<string, ReportStanding> = {
  'moderation.errors.own': { kind: 'own' },
  'moderation.errors.gone': { kind: 'gone' },
}

// Cerrar un reporte sin medidas desde la lista (FR-030): sin conexión y sin respuesta son dos
// mensajes distintos y nada cambia; si otra persona ya lo cerró o la cuenta se borró, el ítem lo
// dice y se queda sin acciones (FR-011, FR-032); quien dejó de administrar ve, al recargar, que la
// página no existe.
export function useCloseReport(options: {
  reportId: string
  reportedSuspended: boolean
  onDone: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{ kind: CloseFailure; attempt: number } | null>(null)
  const [standing, setStanding] = useState<ReportStanding>({
    kind: 'open',
    reportedSuspended: options.reportedSuspended,
  })

  function fail(kind: CloseFailure) {
    setFailure((previous) => ({ kind, attempt: (previous?.attempt ?? 0) + 1 }))
  }

  async function close(): Promise<boolean> {
    if (busy) return false
    setBusy(true)
    const attempt = navigator.onLine
      ? await raceDeadline(closeReport({ reportId: options.reportId }), SAVE_DEADLINE_MS)
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
    const settled = SETTLED[result.error]
    if (result.error === 'moderation.errors.closed' && result.detail !== undefined) {
      setStanding({ kind: 'closed', ...result.detail })
    } else if (settled !== undefined) {
      setStanding(settled)
    } else if (result.error === 'moderation.errors.not_admin') {
      router.refresh()
    } else {
      fail('no_response')
    }
    return settled !== undefined || result.error === 'moderation.errors.closed'
  }

  return { busy, failure, standing, close }
}
