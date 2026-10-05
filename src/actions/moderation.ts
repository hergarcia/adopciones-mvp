'use server'

import { revalidatePath } from 'next/cache'
import { getLocale } from 'next-intl/server'
import { trackAll } from '@/lib/analytics/track'
import {
  accountSuspendedEvents,
  personReportedEvent,
  reportClosedEvent,
} from '@/lib/analytics/moderation-events'
import { sendSuspensionNotice } from '@/lib/email/send-suspension-notice'
import { MY_BLOCKS_PATH, REPORTS_PATH, SUSPENDED_LIST_PATH } from '@/lib/moderation/paths'
import type { ReportResolution } from '@/lib/moderation/types'
import { LISTING_PATH } from '@/lib/pets/paths'
import { isPublicId, publicProfilePath } from '@/lib/profile/public-paths'
import { closeReportSchema, reportSchema } from '@/lib/schemas/report'
import { reactivateSchema, suspensionSchema } from '@/lib/schemas/suspension'
import {
  blockPerson as blockRecord,
  closeReport as closeReportRecord,
  createReport,
  unblockPerson as unblockRecord,
  reactivateAccount as reactivateRecord,
  suspendAccount as suspendRecord,
} from '@/lib/supabase/queries/moderation'
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

/** Quién y cuándo, cuando otra persona que administra ya lo hizo (Edge Cases). */
export type AlreadyDetail = { by: string | null; since: string }

// Lo que muestra a una cuenta (o deja de mostrarla) en el listado, la portada y su perfil.
function revalidateAccount(publicId: string) {
  revalidatePath(LISTING_PATH)
  revalidatePath('/')
  revalidatePath(publicProfilePath(publicId))
  revalidatePath(REPORTS_PATH)
  revalidatePath(SUSPENDED_LIST_PATH)
}

// Suspender, desde el perfil o desde un reporte (FR-018). La decisión la toma la base en una
// transacción; el correo sale después y su resultado no cambia el de la acción (FR-031).
export async function suspendAccount(
  input: unknown,
): Promise<ActionResult<{ name: string }, AlreadyDetail | ClosedDetail>> {
  const parsed = suspensionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? FAILED }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: 'moderation.errors.not_admin' }

  const { publicId, reason, reportId } = parsed.data
  try {
    const suspended = await suspendRecord({ publicId, reason, reportId: reportId ?? null })
    if (suspended.decision === 'already') {
      return {
        ok: false,
        error: 'moderation.errors.already',
        detail: { by: suspended.by, since: suspended.since },
      }
    }
    if (suspended.decision === 'closed') {
      return {
        ok: false,
        error: 'moderation.errors.closed',
        detail: { resolution: suspended.resolution, by: suspended.resolvedBy },
      }
    }
    if (suspended.decision !== 'done') {
      return { ok: false, error: `moderation.errors.${suspended.decision}` }
    }

    await sendSuspensionNotice(
      { kind: 'suspended', userId: suspended.userId, reason },
      await getLocale(),
    )
    await trackAll(
      accountSuspendedEvents(
        {
          from: reportId === undefined ? 'profile' : 'report',
          closedReports: suspended.closedReports,
        },
        new Date(),
      ),
      { visit: false },
    )
    revalidateAccount(publicId)
    return { ok: true, data: { name: suspended.name } }
  } catch {
    return { ok: false, error: FAILED }
  }
}

// Reactivar, desde la lista de suspendidas (FR-022): todo vuelve como estaba, y le avisamos.
export async function reactivateAccount(
  input: unknown,
): Promise<ActionResult<null, AlreadyDetail>> {
  const parsed = reactivateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: 'moderation.errors.not_admin' }

  try {
    const reactivated = await reactivateRecord(parsed.data.suspensionId)
    if (reactivated.decision === 'already') {
      return {
        ok: false,
        error: 'moderation.errors.already',
        detail: { by: reactivated.by, since: reactivated.since },
      }
    }
    if (reactivated.decision !== 'done') {
      return { ok: false, error: `moderation.errors.${reactivated.decision}` }
    }

    await sendSuspensionNotice(
      { kind: 'reactivated', userId: reactivated.userId },
      await getLocale(),
    )
    await trackAll([{ name: 'account_reactivated' }], { visit: false })
    revalidatePath(LISTING_PATH)
    revalidatePath('/')
    revalidatePath(SUSPENDED_LIST_PATH)
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: FAILED }
  }
}

// Lo que cambia para quien bloquea o desbloquea: el perfil, sus animales en el listado y la
// portada, y «Mis bloqueos». La otra persona no ve nada distinto (FR-017).
function revalidateBlock(publicId: string) {
  revalidatePath(LISTING_PATH)
  revalidatePath('/')
  revalidatePath(publicProfilePath(publicId))
  revalidatePath(MY_BLOCKS_PATH)
}

// Bloquear desde el perfil (FR-014). Los avales entre las dos se borran en la misma transacción
// (FR-016); la pantalla vuelve al perfil, que ya es el perfil bloqueado.
export async function blockPerson(publicId: unknown): Promise<ActionResult<null>> {
  if (typeof publicId !== 'string' || !isPublicId(publicId)) {
    return { ok: false, error: 'moderation.errors.not_found' }
  }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const outcome = await blockRecord(user.id, publicId)
  if (outcome === null) return { ok: false, error: FAILED }
  if (outcome === 'self' || outcome === 'not_found') {
    return { ok: false, error: `moderation.errors.${outcome}` }
  }
  if (outcome === 'blocked') await trackAll([{ name: 'person_blocked' }])
  revalidateBlock(publicId)
  return { ok: true, data: null }
}

// Desbloquear lo que ya no estaba no es un error: la pantalla dice «Ya estaba desbloqueada».
export async function unblockPerson(
  publicId: unknown,
): Promise<ActionResult<{ already: boolean }>> {
  if (typeof publicId !== 'string' || !isPublicId(publicId)) {
    return { ok: true, data: { already: true } }
  }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const outcome = await unblockRecord(user.id, publicId)
  if (outcome === null) return { ok: false, error: FAILED }
  if (outcome === 'unblocked') await trackAll([{ name: 'person_unblocked' }])
  revalidateBlock(publicId)
  return { ok: true, data: { already: outcome === 'absent' } }
}
