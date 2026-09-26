import { createServerSupabase } from '@/lib/supabase/server'
import { isDepartmentCode, type DepartmentCode } from '@/lib/zones/departments'
import { toRejections, type Rejection } from './identity-rows'
import { getSessionUser } from './session'

// La cola de revisión y un pedido, con la sesión de quien administra: la policy deja afuera los
// vencidos y los de cualquier cuenta para quien no administra (FR-013, FR-014).

export type ReviewQueueItem = {
  id: string
  displayName: string
  sentAt: Date
  expiresAt: Date
  isOwn: boolean
}

// La cola, del más viejo al más nuevo (FR-014). La policy ya deja afuera los vencidos; el filtro por
// tiempo acá es el mismo, para que el orden y la cuenta coincidan con lo que se ve.
export async function listReviewQueue(): Promise<ReviewQueueItem[]> {
  const user = await getSessionUser()
  if (user === null) return []

  const supabase = await createServerSupabase()
  const { data: requests, error } = await supabase
    .from('identity_requests')
    .select('id, user_id, sent_at, expires_at')
    .gt('expires_at', new Date().toISOString())
    .order('sent_at', { ascending: true })
  if (error) throw new Error('No se pudo leer la cola de revisión', { cause: error })
  if (requests.length === 0) return []

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in(
      'id',
      requests.map((request) => request.user_id),
    )
  if (profileError) throw new Error('No se pudo leer la cola de revisión', { cause: profileError })
  const names = new Map(profiles.map((profile) => [profile.id, profile.display_name]))

  return requests.map((request) => ({
    id: request.id,
    displayName: names.get(request.user_id) ?? '',
    sentAt: new Date(request.sent_at),
    expiresAt: new Date(request.expires_at),
    isOwn: request.user_id === user.id,
  }))
}

/** Cuántos pedidos esperan a quien mira: los vigentes que no son suyos. */
export async function countPendingReviews(): Promise<number> {
  const queue = await listReviewQueue()
  return queue.filter((item) => !item.isOwn).length
}

export type ReviewRequest = {
  id: string
  displayName: string
  department: DepartmentCode
  locality: string
  memberSince: Date
  sentAt: Date
  expiresAt: Date
  isOwn: boolean
  rejections: Rejection[]
}

// Un pedido con lo que se muestra de la persona (FR-014): el nombre, la zona, desde cuándo tiene
// cuenta y sus rechazos. Ni el correo ni el teléfono, que no están en estas tablas. Nulo si la
// policy no lo deja ver: no existe, venció, o quien mira no administra.
export async function getReviewRequest(id: string): Promise<ReviewRequest | null> {
  const user = await getSessionUser()
  if (user === null) return null

  const supabase = await createServerSupabase()
  const { data: request, error } = await supabase
    .from('identity_requests')
    .select('id, user_id, sent_at, expires_at')
    .eq('id', id)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (error) throw new Error('No se pudo leer el pedido', { cause: error })
  if (request === null) return null

  const [profile, rejections] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, department, locality, created_at')
      .eq('id', request.user_id)
      .maybeSingle(),
    supabase
      .from('identity_rejections')
      .select('rejected_on, reason')
      .eq('user_id', request.user_id)
      .order('rejected_on', { ascending: false }),
  ])
  if (profile.error || rejections.error) {
    throw new Error('No se pudo leer el pedido', { cause: profile.error ?? rejections.error })
  }
  if (profile.data === null || !isDepartmentCode(profile.data.department)) return null

  return {
    id: request.id,
    displayName: profile.data.display_name,
    department: profile.data.department,
    locality: profile.data.locality,
    memberSince: new Date(profile.data.created_at),
    sentAt: new Date(request.sent_at),
    expiresAt: new Date(request.expires_at),
    isOwn: request.user_id === user.id,
    rejections: toRejections(rejections.data),
  }
}
