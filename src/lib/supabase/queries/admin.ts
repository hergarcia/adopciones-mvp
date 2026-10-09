import type { DigestClaim, OwnPending, PersonRecord, QueueCount, QueueKey } from '@/lib/admin/types'
import { isDepartmentCode, type DepartmentCode } from '@/lib/zones/departments'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { toPersonRecord } from './admin-record-rows'
import { isAdmin } from './review'

// Lo que lee Administrar (historia #73). Todo con la sesión: cada función de la base vuelve a
// preguntar si quien mira administra y no devuelve nada a nadie más (research R1). Solo el resumen
// se reclama con permisos de servicio, desde la tarea.

function toOwn(value: unknown): OwnPending[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item: unknown): OwnPending[] => {
    if (typeof item !== 'object' || item === null) return []
    const since: unknown = Reflect.get(item, 'since')
    const petName: unknown = Reflect.get(item, 'pet_name')
    if (typeof since !== 'string') return []
    return [{ since: new Date(since), petName: typeof petName === 'string' ? petName : null }]
  })
}

/** Una cola para quien mira. Lanza si la base no respondió: Administrar dice solo esa (FR-016). */
export async function adminQueueCount(queue: QueueKey): Promise<QueueCount> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('admin_queue_count', { p_queue: queue })
  if (error) throw new Error(`No se pudo contar la cola ${queue}`, { cause: error })
  const row = data[0]
  // Los tipos generados no saben que una columna de una función puede ser nula.
  const oldest = row?.oldest ?? null
  return {
    others: row?.others ?? 0,
    oldest: oldest === null ? null : new Date(oldest),
    own: toOwn(row?.own),
  }
}

export type AdminTotal = { isAdmin: false } | { isAdmin: true; count: number | null }

/**
 * El número de «Administrar» en el menú y en Mi perfil (FR-020): una sola llamada, que para quien
 * no administra corta en la base. Si falla, se pregunta aparte si administra, para mostrar la
 * entrada sin número.
 */
export async function adminPendingTotal(): Promise<AdminTotal> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('admin_pending_total')
  if (!error) {
    const count: number | null = data
    return count === null ? { isAdmin: false } : { isAdmin: true, count }
  }
  const admin = await isAdmin().catch(() => false)
  return admin ? { isAdmin: true, count: null } : { isAdmin: false }
}

/** Opiniones y respuestas de encuesta de hoy y los 6 días anteriores (FR-014). */
export async function adminRecentCounts(): Promise<{ feedback: number; surveyAnswers: number }> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('admin_recent_counts')
  if (error) throw new Error('No se pudieron contar las opiniones y encuestas', { cause: error })
  return { feedback: data[0]?.feedback ?? 0, surveyAnswers: data[0]?.survey_answers ?? 0 }
}

/** La ficha de una persona; nulo si quien mira no administra o la cuenta no existe. */
export async function personRecord(publicId: string): Promise<PersonRecord | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('admin_person_record', { p_public_id: publicId })
  if (error) throw new Error('No se pudo traer la ficha', { cause: error })
  const row = data[0]
  return row === undefined ? null : toPersonRecord(row)
}

export type PersonRow = {
  publicId: string
  name: string
  avatarPath: string | null
  department: DepartmentCode | null
  locality: string
  isSuspended: boolean
}

/** Hasta `limit + 1` personas por nombre: la de más dice que hay más (research R6). */
export async function searchPeopleRows(query: string, limit: number): Promise<PersonRow[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('admin_search_people', {
    p_query: query,
    p_limit: limit,
  })
  if (error) throw new Error('No se pudo buscar', { cause: error })
  return data.map((row) => ({
    publicId: row.public_id,
    name: row.display_name,
    avatarPath: row.avatar_path ?? null,
    department: isDepartmentCode(row.department) ? row.department : null,
    locality: row.locality,
    isSuspended: row.is_suspended,
  }))
}

const at = (value: string | null) => (value === null ? null : new Date(value))

/** Reclama los resúmenes de hoy (research R8). Lanza si la base no respondió: ese día no sale. */
export async function claimAdminDigests(): Promise<DigestClaim[]> {
  const { data, error } = await createServiceSupabase().rpc('claim_admin_digests')
  if (error) throw new Error('No se pudieron reclamar los resúmenes', { cause: error })
  return data.map((row) => ({
    userId: row.user_id,
    identity: { count: row.identity_count, oldest: at(row.identity_oldest ?? null) },
    pets: { count: row.pets_count, oldest: at(row.pets_oldest ?? null) },
    reports: { count: row.reports_count, oldest: at(row.reports_oldest ?? null) },
  }))
}
