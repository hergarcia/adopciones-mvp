import { cache } from 'react'
import {
  REPORT_REASONS,
  REPORT_RESOLUTIONS,
  type AccountStanding,
  type MyBlock,
  type ReportHistoryEntry,
  type ReportQueue,
  type ReportReason,
  type ReportResolution,
  type SuspendedAccount,
} from '@/lib/moderation/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { oneOf } from './pet-rows'

// Reportes, suspensiones y bloqueos (historia #13). Lo de quien administra se lee y se cierra con
// su sesión: la base vuelve a preguntar `is_admin()` en cada llamada. Lo que hace una persona sobre
// otra va con permisos de servicio y su id como parámetro, que sale de la sesión en el servidor.

/** En caché por pedido: la puerta la pregunta en la página, en el menú y en cada query. */
export const getAccountStanding = cache(async (): Promise<AccountStanding> => {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('my_account_standing')
  if (error) return { kind: 'unknown' }
  const row = data[0]
  return row === undefined
    ? { kind: 'active' }
    : { kind: 'suspended', reason: row.reason, since: row.since }
})

export type CreateReportOutcome = 'created' | 'duplicate' | 'self' | 'not_found'
const CREATE_OUTCOMES: readonly CreateReportOutcome[] = [
  'created',
  'duplicate',
  'self',
  'not_found',
]

/** Nulo si la base no respondió: la cadena termina en una acción, que no lanza. */
export async function createReport(input: {
  reporterId: string
  publicId: string
  reason: ReportReason
  details: string | null
}): Promise<{ outcome: CreateReportOutcome; blockedAlready: boolean } | null> {
  const { data, error } = await createServiceSupabase().rpc('create_report', {
    p_reporter: input.reporterId,
    p_reported_public_id: input.publicId,
    p_reason: input.reason,
    ...(input.details === null ? {} : { p_details: input.details }),
  })
  const row = error ? undefined : data[0]
  const outcome = CREATE_OUTCOMES.find((candidate) => candidate === row?.outcome)
  if (row === undefined || outcome === undefined) return null
  return { outcome, blockedAlready: row.blocked_already }
}

function text(item: object, key: string): string | null {
  const value: unknown = Reflect.get(item, key)
  return typeof value === 'string' ? value : null
}

function toHistory(value: unknown): ReportHistoryEntry[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item: unknown): ReportHistoryEntry[] => {
    if (typeof item !== 'object' || item === null) return []
    const reason = text(item, 'reason') ?? ''
    if (text(item, 'kind') === 'suspension') {
      return [
        {
          kind: 'suspension',
          reason,
          suspendedAt: text(item, 'suspended_at') ?? '',
          liftedAt: text(item, 'lifted_at'),
          suspendedBy: text(item, 'suspended_by'),
        },
      ]
    }
    return [
      {
        kind: 'report',
        reason: oneOf(REPORT_REASONS, reason, 'motivo'),
        details: text(item, 'details'),
        createdAt: text(item, 'created_at') ?? '',
        resolution: oneOf(REPORT_RESOLUTIONS, text(item, 'resolution') ?? '', 'resolución'),
        resolvedAt: text(item, 'resolved_at') ?? '',
      },
    ]
  })
}

/** Los sin resolver, del más viejo al más nuevo; vacía para quien no administra. */
export async function listReportQueue(): Promise<ReportQueue> {
  const supabase = await createServerSupabase()
  const [queue, counts] = await Promise.all([
    supabase.rpc('report_queue'),
    supabase.rpc('count_open_reports'),
  ])
  if (queue.error || counts.error) {
    throw new Error('No se pudo traer la lista de reportes', { cause: queue.error ?? counts.error })
  }
  return {
    items: queue.data.map((row) => ({
      id: row.report_id,
      reason: oneOf(REPORT_REASONS, row.reason, 'motivo'),
      // Los tipos generados no saben que una columna de una función puede ser nula.
      details: row.details ?? null,
      createdAt: row.created_at,
      reporter:
        row.reporter_public_id === null
          ? null
          : {
              name: row.reporter_name,
              publicId: row.reporter_public_id,
              isSuspended: row.reporter_suspended,
            },
      reported: {
        name: row.reported_name,
        publicId: row.reported_public_id,
        isSuspended: row.reported_suspended,
      },
      history: toHistory(row.history),
    })),
    ownCount: counts.data[0]?.own ?? 0,
  }
}

export type CloseReportDecision =
  | { decision: 'done'; createdAt: Date }
  | { decision: 'closed'; resolution: ReportResolution; resolvedBy: string | null }
  | { decision: 'own' | 'gone' | 'not_admin' }

const CLOSE_REFUSALS = ['own', 'gone', 'not_admin'] as const

export async function closeReport(reportId: string): Promise<CloseReportDecision> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('close_report', { p_report: reportId })
  const row = data?.[0]
  if (error || row === undefined) throw new Error('No se pudo cerrar el reporte', { cause: error })

  const refusal = CLOSE_REFUSALS.find((decision) => decision === row.decision)
  if (refusal !== undefined) return { decision: refusal }
  if (row.decision === 'closed') {
    return {
      decision: 'closed',
      resolution: oneOf(REPORT_RESOLUTIONS, row.resolution, 'resolución'),
      resolvedBy: row.resolved_by_name ?? null,
    }
  }
  return { decision: 'done', createdAt: new Date(row.created_at) }
}

export type SuspendDecision =
  | {
      decision: 'done'
      userId: string
      name: string
      withdrewRequest: boolean
      closedReports: { createdAt: Date }[]
    }
  | { decision: 'already'; by: string | null; since: string }
  | { decision: 'closed'; resolution: ReportResolution; resolvedBy: string | null }
  | { decision: 'self' | 'gone' | 'not_admin' }

const SUSPEND_REFUSALS = ['self', 'gone', 'not_admin'] as const

function closedDates(value: unknown): { createdAt: Date }[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item: unknown) =>
    typeof item === 'string' ? [{ createdAt: new Date(item) }] : [],
  )
}

/** Con la sesión de quien administra: la base vuelve a preguntar `is_admin()` (FR-032). */
export async function suspendAccount(input: {
  publicId: string
  reason: string
  reportId: string | null
}): Promise<SuspendDecision> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('suspend_account', {
    p_target_public_id: input.publicId,
    p_reason: input.reason,
    ...(input.reportId === null ? {} : { p_report: input.reportId }),
  })
  const row = data?.[0]
  if (error || row === undefined) throw new Error('No se pudo suspender', { cause: error })

  const refusal = SUSPEND_REFUSALS.find((decision) => decision === row.outcome)
  if (refusal !== undefined) return { decision: refusal }
  if (row.outcome === 'already') {
    return { decision: 'already', by: row.suspended_by_name ?? null, since: row.suspended_at }
  }
  if (row.outcome === 'closed') {
    return {
      decision: 'closed',
      resolution: oneOf(REPORT_RESOLUTIONS, row.resolution, 'resolución'),
      resolvedBy: row.suspended_by_name ?? null,
    }
  }
  return {
    decision: 'done',
    userId: row.user_id,
    name: row.display_name,
    withdrewRequest: row.withdrew_request,
    closedReports: closedDates(row.closed_reports),
  }
}

export type ReactivateDecision =
  | { decision: 'done'; userId: string; name: string }
  | { decision: 'already'; by: string | null; since: string }
  | { decision: 'gone' | 'not_admin' }

export async function reactivateAccount(suspensionId: string): Promise<ReactivateDecision> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('reactivate_account', { p_suspension: suspensionId })
  const row = data?.[0]
  if (error || row === undefined) throw new Error('No se pudo reactivar', { cause: error })

  if (row.outcome === 'gone' || row.outcome === 'not_admin') return { decision: row.outcome }
  if (row.outcome === 'already') {
    return { decision: 'already', by: row.lifted_by_name ?? null, since: row.lifted_at }
  }
  return { decision: 'done', userId: row.user_id, name: row.display_name }
}

/** Las vigentes, de la más reciente a la más vieja; vacía para quien no administra. */
export async function listSuspendedAccounts(): Promise<SuspendedAccount[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('suspended_accounts')
  if (error) throw new Error('No se pudo traer la lista de suspendidas', { cause: error })
  return data.map((row) => ({
    suspensionId: row.suspension_id,
    name: row.display_name,
    publicId: row.public_id,
    reason: row.reason,
    suspendedAt: row.suspended_at,
    suspendedBy: row.suspended_by_name ?? null,
  }))
}

export type BlockOutcome = 'blocked' | 'already' | 'self' | 'not_found'
const BLOCK_OUTCOMES: readonly BlockOutcome[] = ['blocked', 'already', 'self', 'not_found']

/** Nulo si la base no respondió: la cadena termina en una acción, que no lanza. */
export async function blockPerson(
  blockerId: string,
  publicId: string,
): Promise<BlockOutcome | null> {
  const { data, error } = await createServiceSupabase().rpc('block_person', {
    p_blocker: blockerId,
    p_public_id: publicId,
  })
  if (error) return null
  return BLOCK_OUTCOMES.find((candidate) => candidate === data) ?? null
}

export async function unblockPerson(
  blockerId: string,
  publicId: string,
): Promise<'unblocked' | 'absent' | null> {
  const { data, error } = await createServiceSupabase().rpc('unblock_person', {
    p_blocker: blockerId,
    p_public_id: publicId,
  })
  if (error) return null
  return data === 'unblocked' || data === 'absent' ? data : null
}

/** «Mis bloqueos», del más reciente al más viejo. */
export async function listMyBlocks(userId: string): Promise<MyBlock[]> {
  const { data, error } = await createServiceSupabase().rpc('my_blocks', { p_user: userId })
  if (error) throw new Error('No se pudieron traer los bloqueos', { cause: error })
  return data.map((row) => ({
    name: row.display_name,
    publicId: row.public_id,
    hasPhoto: row.has_photo,
    since: row.since,
  }))
}

/** El nombre de una persona que quien mira bloqueó; nulo sin bloqueo. */
export async function getBlockedProfile(
  viewerId: string,
  publicId: string,
): Promise<{ name: string; isSuspended: boolean } | null> {
  const { data, error } = await createServiceSupabase().rpc('blocked_profile', {
    p_viewer: viewerId,
    p_public_id: publicId,
  })
  if (error) throw new Error('No se pudo leer el perfil bloqueado', { cause: error })
  const row = data[0]
  return row === undefined ? null : { name: row.display_name, isSuspended: row.is_suspended }
}
