import { cache } from 'react'
import {
  REPORT_REASONS,
  REPORT_RESOLUTIONS,
  type AccountStanding,
  type ReportHistoryEntry,
  type ReportQueue,
  type ReportReason,
  type ReportResolution,
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

/** Cuántos esperan a quien mira, sin los propios (SC-006). */
export async function countOpenReports(): Promise<number> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('count_open_reports')
  if (error) throw new Error('No se pudieron contar los reportes', { cause: error })
  return data[0]?.others ?? 0
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
