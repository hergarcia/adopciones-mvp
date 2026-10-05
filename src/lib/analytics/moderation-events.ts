import { reportHours } from '@/lib/moderation/report-age'
import type { ReportReason, ReportResolution } from '@/lib/moderation/types'
import type { SuspensionOrigin, TrackedEvent } from './events'

// Los eventos de la historia #13 (research R10). Cada uno se arma eligiendo campo por campo: lo
// que llegue de más —un id, un nombre, el texto del reporte— no sale, que es lo que promete FR-050.

export function personReportedEvent(report: { reason: ReportReason }): TrackedEvent {
  return { name: 'person_reported', props: { reason: report.reason } }
}

export function reportClosedEvent(
  report: { createdAt: Date; resolution: ReportResolution },
  now: Date,
): TrackedEvent {
  return {
    name: 'report_closed',
    props: { resolution: report.resolution, hours: reportHours(report.createdAt, now) },
  }
}

// Suspender cierra todos los reportes sin resolver de la cuenta: uno por cada uno, así la mediana
// de SC-006 no ve solo los cerrados sin medidas (FR-012).
export function accountSuspendedEvents(
  suspension: { from: SuspensionOrigin; closedReports: { createdAt: Date }[] },
  now: Date,
): TrackedEvent[] {
  return [
    { name: 'account_suspended', props: { from: suspension.from } },
    ...suspension.closedReports.map((closed) =>
      reportClosedEvent({ createdAt: closed.createdAt, resolution: 'suspended' }, now),
    ),
  ]
}
