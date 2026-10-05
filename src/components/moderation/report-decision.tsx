'use client'

import { useAnnounce } from '@/components/forms/announce-notices'
import { useCloseReport, type CloseFailure } from '@/hooks/use-close-report'
import { reportActions, type ReportLine } from '@/lib/moderation/report-actions'
import type { ReportResolution } from '@/lib/moderation/types'
import { CloseReportDialog, type CloseReportTexts } from './close-report-dialog'

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
}

type Props = {
  reportId: string
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
export function ReportDecision({ reportId, reportedSuspended, texts }: Props) {
  const announce = useAnnounce()
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
    </div>
  )
}
