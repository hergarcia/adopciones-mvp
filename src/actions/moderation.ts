'use server'

import { revalidatePath } from 'next/cache'
import { trackAll } from '@/lib/analytics/track'
import { personReportedEvent, reportClosedEvent } from '@/lib/analytics/moderation-events'
import { REPORTS_PATH } from '@/lib/moderation/paths'
import type { ReportResolution } from '@/lib/moderation/types'
import { closeReportSchema, reportSchema } from '@/lib/schemas/report'
import { closeReport as closeReportRecord, createReport } from '@/lib/supabase/queries/moderation'
import { getSessionUser } from '@/lib/supabase/queries/session'
import type { ActionResult } from './result'

// Reportar y cerrar (contracts/routes.md). Ninguna confía en el cliente: la sesión se vuelve a leer
// —con la puerta de la suspendida— y las reglas las comprueba la base con el estado de ese momento.

const FAILED = 'moderation.errors.failed'
const SESSION = 'moderation.errors.session'

export async function reportPerson(
  input: unknown,
): Promise<ActionResult<{ blockedAlready: boolean }>> {
  const parsed = reportSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? FAILED }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const report = parsed.data
  const created = await createReport({
    reporterId: user.id,
    publicId: report.publicId,
    reason: report.reason,
    details: report.details,
  })
  if (created === null) return { ok: false, error: FAILED }
  if (created.outcome !== 'created') {
    return { ok: false, error: `moderation.errors.${created.outcome}` }
  }
  await trackAll([personReportedEvent(report)])
  return { ok: true, data: { blockedAlready: created.blockedAlready } }
}

export type ClosedDetail = { resolution: ReportResolution; by: string | null }

// Cerrar sin medidas. Cerrar suspendiendo es `suspendAccount` con el reporte: un solo camino.
export async function closeReport(input: unknown): Promise<ActionResult<null, ClosedDetail>> {
  const parsed = closeReportSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: 'moderation.errors.not_admin' }

  try {
    const closed = await closeReportRecord(parsed.data.reportId)
    if (closed.decision === 'closed') {
      return {
        ok: false,
        error: 'moderation.errors.closed',
        detail: { resolution: closed.resolution, by: closed.resolvedBy },
      }
    }
    if (closed.decision !== 'done')
      return { ok: false, error: `moderation.errors.${closed.decision}` }

    // Los momentos de quien administra no llevan la marca de su visita (research R10).
    await trackAll(
      [reportClosedEvent({ createdAt: closed.createdAt, resolution: 'dismissed' }, new Date())],
      { visit: false },
    )
    revalidatePath(REPORTS_PATH)
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: FAILED }
  }
}
