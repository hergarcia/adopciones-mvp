// Lo que comparten las pruebas de reportes, suspensiones, bloqueos y números retenidos en la base
// (historia #13): personas en el nivel pedido, quien administra, y la suspensión y el bloqueo
// escritos **directo con el servicio**, así las pruebas de una user story no dependen de las
// funciones de otra.
import { expect } from 'vitest'
import type { ReportReason } from '../../src/lib/moderation/types'
import { makeAdmin } from './identity-support'
import { db, firstRow, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'
import { give, people, type Person } from './vouch-support'

export type { Person }
export type CreatedReport = Functions['create_report']['Returns'][number]
export type ClosedReport = Functions['close_report']['Returns'][number]
export type QueueRow = Functions['report_queue']['Returns'][number]
export type OpenCounts = Functions['count_open_reports']['Returns'][number]
type Client = SyntheticUser['client']

export const MODERATION_TABLES = [
  'account_suspensions',
  'reports',
  'blocks',
  'withheld_numbers',
] as const

/** Personas con perfil, en el nivel pedido (3 es nivel 2 con un aval de otra con nivel 2). */
export function moderationPeople(cleanups: SyntheticUser['cleanup'][]) {
  const person = people(cleanups)
  return {
    person: async (level: 0 | 1 | 2 | 3 = 2, name = 'Persona de prueba'): Promise<Person> => {
      if (level !== 3) return person(level, name)
      const subject = await person(2, name)
      const voucher = await person(2, 'Quien avala')
      expect((await give(voucher, subject)).outcome).toBe('given')
      return subject
    },
    admin: async (name = 'Quien administra'): Promise<Person> => {
      const subject = await person(1, name)
      await makeAdmin(subject.id)
      return subject
    },
  }
}

export async function suspend(userId: string, by: string | null = null): Promise<string> {
  const { data, error } = await db()
    .from('account_suspensions')
    .insert({ user_id: userId, reason: 'Motivo de prueba', suspended_by: by })
    .select('id')
    .single()
  expect(error).toBeNull()
  return data?.id ?? ''
}

export async function lift(suspensionId: string) {
  const { error } = await db()
    .from('account_suspensions')
    .update({ lifted_at: new Date().toISOString() })
    .eq('id', suspensionId)
  expect(error).toBeNull()
}

export async function block(blocker: string, blocked: string) {
  const { error } = await db().from('blocks').insert({ blocker_id: blocker, blocked_id: blocked })
  expect(error).toBeNull()
}

export async function report(
  reporter: Person,
  reported: Person,
  reason: ReportReason = 'sells_animals',
  details: string | null = null,
): Promise<CreatedReport> {
  const { data, error } = await db().rpc('create_report', {
    p_reporter: reporter.id,
    p_reported_public_id: reported.publicId,
    p_reason: reason,
    ...(details === null ? {} : { p_details: details }),
  })
  expect(error).toBeNull()
  return firstRow(data, 'create_report')
}

export async function reportsAbout(userId: string) {
  const { data, error } = await db()
    .from('reports')
    .select('*')
    .eq('reported_id', userId)
    .order('created_at')
  expect(error).toBeNull()
  return data ?? []
}

export async function queueOf(client: Client): Promise<QueueRow[]> {
  const { data, error } = await client.rpc('report_queue')
  expect(error).toBeNull()
  const rows: QueueRow[] = data ?? []
  return rows
}

export async function countsOf(client: Client): Promise<OpenCounts> {
  const { data, error } = await client.rpc('count_open_reports')
  expect(error).toBeNull()
  const rows: OpenCounts[] | null = data
  return firstRow(rows, 'count_open_reports')
}

export async function close(client: Client, reportId: string): Promise<ClosedReport> {
  const { data, error } = await client.rpc('close_report', { p_report: reportId })
  expect(error).toBeNull()
  const rows: ClosedReport[] | null = data
  return firstRow(rows, 'close_report')
}

/** Lo que una sesión lee directo de una tabla, con su token. */
export async function readAs(client: Client, table: (typeof MODERATION_TABLES)[number]) {
  const { data, error } = await client.from(table).select('*')
  return { rows: data ?? [], error }
}

export type Suspended = Functions['suspend_account']['Returns'][number]
export type Reactivated = Functions['reactivate_account']['Returns'][number]
export type SuspendedRow = Functions['suspended_accounts']['Returns'][number]

/** Suspender como lo hace la aplicación: con la sesión de quien administra. */
export async function suspendAs(
  client: Client,
  target: Person,
  reason = 'Ofrecía cachorros a la venta',
  reportId: string | null = null,
): Promise<Suspended> {
  const { data, error } = await client.rpc('suspend_account', {
    p_target_public_id: target.publicId,
    p_reason: reason,
    ...(reportId === null ? {} : { p_report: reportId }),
  })
  expect(error).toBeNull()
  const rows: Suspended[] | null = data
  return firstRow(rows, 'suspend_account')
}

export async function reactivateAs(client: Client, suspensionId: string): Promise<Reactivated> {
  const { data, error } = await client.rpc('reactivate_account', { p_suspension: suspensionId })
  expect(error).toBeNull()
  const rows: Reactivated[] | null = data
  return firstRow(rows, 'reactivate_account')
}

export async function suspendedListOf(client: Client): Promise<SuspendedRow[]> {
  const { data, error } = await client.rpc('suspended_accounts')
  expect(error).toBeNull()
  const rows: SuspendedRow[] = data ?? []
  return rows
}

/** La suspensión vigente de una cuenta, leída con el servicio. */
export async function openSuspensionOf(userId: string) {
  const { data, error } = await db()
    .from('account_suspensions')
    .select('*')
    .eq('user_id', userId)
    .is('lifted_at', null)
    .maybeSingle()
  expect(error).toBeNull()
  return data
}
