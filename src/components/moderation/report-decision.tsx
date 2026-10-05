'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAnnounce } from '@/components/forms/announce-notices'
import { Button } from '@/components/ui/button'
import { useCloseReport, type CloseFailure } from '@/hooks/use-close-report'
import { reportActions, type ReportLine } from '@/lib/moderation/report-actions'
import type { ReportResolution } from '@/lib/moderation/types'
import { CloseReportDialog, type CloseReportTexts } from './close-report-dialog'
import type { SuspendSheetTexts } from './suspend-sheet'

// La hoja llega al tocar «Suspender»: la mayoría de los reportes se cierran sin medidas.
const SuspendSheet = dynamic(() => import('./suspend-sheet').then((module) => module.SuspendSheet))

export type ReportDecisionTexts = {
  close: CloseReportTexts
  /** Ya con el nombre: «Cerraste sin medidas el reporte sobre Ana». */
  done: string
  failures: Record<CloseFailure, string>
  own: string
  gone: string
  /** Con `{name}` adentro, que se reemplaza por quién lo cerró. */
  closedBy: Record<ReportResolution, string>
  closedByDeleted: Record<ReportResolution, string>
  suspend: string
  suspendSheet: SuspendSheetTexts
  /** Ya con el nombre: «Suspendiste a Ana». */
  suspendDone: string
}

type Props = {
  reportId: string
  /** La persona reportada, a quien se suspende. */
  publicId: string
  reportedSuspended: boolean
  texts: ReportDecisionTexts
}

function lineText(line: ReportLine, texts: ReportDecisionTexts): string {
  if (line.kind === 'own') return texts.own
  if (line.kind === 'gone') return texts.gone
  return line.by === null
    ? texts.closedByDeleted[line.resolution]
    : texts.closedBy[line.resolution].replace('{name}', line.by)
}

// Las acciones de un reporte de la lista, decididas por `reportActions`: este componente solo las
// pinta. Al cerrar, el reporte sale de la lista con su aviso; si ya no se puede, la línea dice por
// qué y no quedan acciones.
export function ReportDecision({ reportId, publicId, reportedSuspended, texts }: Props) {
  const router = useRouter()
  const announce = useAnnounce()
  const [suspending, setSuspending] = useState(false)
  const flow = useCloseReport({
    reportId,
    reportedSuspended,
    onDone: () => announce(texts.done),
  })
  const { actions, line } = reportActions(flow.standing)

  if (line !== null) return <p className="text-base text-ink-muted">{lineText(line, texts)}</p>
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      {actions.includes('close') ? (
        <CloseReportDialog
          texts={texts.close}
          busy={flow.busy}
          disabled={flow.busy}
          failure={flow.failure === null ? null : texts.failures[flow.failure.kind]}
          onConfirm={flow.close}
        />
      ) : null}
      {actions.includes('suspend') ? (
        <Button variant="ghost" disabled={flow.busy} onClick={() => setSuspending(true)}>
          {texts.suspend}
        </Button>
      ) : null}
      {suspending ? (
        <SuspendSheet
          publicId={publicId}
          reportId={reportId}
          open
          onOpenChange={setSuspending}
          onDone={() => {
            setSuspending(false)
            announce(texts.suspendDone)
            router.refresh()
          }}
          onRefused={(key) => {
            setSuspending(false)
            if (key === 'moderation.errors.gone') flow.settle({ kind: 'gone' })
            else router.refresh()
          }}
          texts={texts.suspendSheet}
        />
      ) : null}
    </div>
  )
}
