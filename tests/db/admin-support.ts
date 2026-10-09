// Lo que comparten las pruebas de Administrar en la base (historia #73): las colas como las lee quien
// administra, pendientes con la espera que haga falta, las cuentas de Opiniones y Encuestas, y lo
// que reclama el resumen de la mañana.
import { expect } from 'vitest'
import { openRequest } from './identity-support'
import { listPet, sql } from './listing-support'
import { report, type Person } from './moderation-support'
import { db, firstRow, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'

type Client = SyntheticUser['client']
export type QueueKey = 'identity' | 'pets' | 'reports'
export type QueueCountRow = Functions['admin_queue_count']['Returns'][number]

export async function queueCountAs(client: Client, queue: QueueKey): Promise<QueueCountRow> {
  const { data, error } = await client.rpc('admin_queue_count', { p_queue: queue })
  expect(error).toBeNull()
  const rows: QueueCountRow[] | null = data
  return firstRow(rows, 'admin_queue_count')
}

export async function othersAs(client: Client): Promise<Record<QueueKey, number>> {
  const [identity, pets, reports] = await Promise.all([
    queueCountAs(client, 'identity'),
    queueCountAs(client, 'pets'),
    queueCountAs(client, 'reports'),
  ])
  return { identity: identity.others, pets: pets.others, reports: reports.others }
}

// Una espera propia de cada prueba, en el año 1000: el pendiente queda más viejo que cualquier otro.
export function ancientWindow() {
  const start = Date.UTC(1000, 0, 1) + Math.floor(Math.random() * 5 * 365 * 24 * 60) * 60_000
  return (minute: number) => new Date(start + minute * 60_000).toISOString()
}

/** Un pedido de identidad en revisión de esa persona, que entró en `since` si se pide. */
export async function pendingIdentity(person: Person, since?: string): Promise<string> {
  const id = await openRequest(person.id)
  if (since !== undefined) {
    const { error } = await db().from('identity_requests').update({ sent_at: since }).eq('id', id)
    expect(error).toBeNull()
  }
  return id
}

/** Una publicación por revisar de esa persona, con su nombre y desde cuándo. */
export async function pendingPet(person: Person, name = 'Tobi', since?: string): Promise<string> {
  const pet = await listPet(person.id, { fields: { name } })
  if (since !== undefined) {
    const { error } = await db()
      .from('pet_reviews')
      .update({ pending_since: since })
      .eq('pet_id', pet.petId)
    expect(error).toBeNull()
  }
  return pet.petId
}

/** Un reporte sin resolver de `reporter` sobre `reported`, hecho en `since` si se pide. */
export async function pendingReport(
  reporter: Person,
  reported: Person,
  since?: string,
): Promise<string> {
  const created = await report(reporter, reported, 'sells_animals', 'Publicó cachorros con precio')
  const { data, error } = await db()
    .from('reports')
    .select('id')
    .eq('reporter_id', reporter.id)
    .eq('reported_id', reported.id)
    .is('resolved_at', null)
    .single()
  expect(created.outcome).toBe('created')
  expect(error).toBeNull()
  const id = data?.id ?? ''
  if (since !== undefined) {
    const updated = await db().from('reports').update({ created_at: since }).eq('id', id)
    expect(updated.error).toBeNull()
  }
  return id
}

export async function pendingTotalAs(client: Client): Promise<number | null> {
  const { data, error } = await client.rpc('admin_pending_total')
  expect(error).toBeNull()
  const total: number | null = data
  return total
}

export type RecentCountsRow = Functions['admin_recent_counts']['Returns'][number]

export async function recentCountsAs(client: Client): Promise<RecentCountsRow> {
  const { data, error } = await client.rpc('admin_recent_counts')
  expect(error).toBeNull()
  const rows: RecentCountsRow[] | null = data
  return firstRow(rows, 'admin_recent_counts')
}

export type PersonRecordRow = Functions['admin_person_record']['Returns'][number]

/** La ficha como la lee esa sesión; nula si no devolvió ninguna fila. */
export async function recordAs(client: Client, publicId: string): Promise<PersonRecordRow | null> {
  const { data, error } = await client.rpc('admin_person_record', { p_public_id: publicId })
  expect(error).toBeNull()
  const rows: PersonRecordRow[] | null = data
  return rows?.[0] ?? null
}

export type DigestClaimRow = Functions['claim_admin_digests']['Returns'][number]

/** Lo que reclama la tarea de la mañana, como la corre la aplicación (con el servicio). */
export async function claimDigests(): Promise<DigestClaimRow[]> {
  const { data, error } = await db().rpc('claim_admin_digests')
  expect(error).toBeNull()
  return data ?? []
}

/**
 * A quién reclamaría la tarea si en las colas quedara solo lo de `adminId`: todo lo demás se cierra
 * en una transacción que se deshace, así que la base queda como estaba.
 */
export async function claimedWithOnlyOwnOf(adminId: string): Promise<string[]> {
  const rows = await sql<{ user_id: string }>(`
    begin;
    update public.identity_requests set expires_at = now()
     where expires_at > now() and user_id <> '${adminId}';
    update public.pet_reviews v set pending_since = null, pending_kind = null
      from public.pets p
     where p.id = v.pet_id and v.pending_since is not null and p.owner_id <> '${adminId}';
    update public.reports set resolved_at = now(), resolution = 'dismissed'
     where resolved_at is null and reported_id <> '${adminId}';
    select c.user_id from public.claim_admin_digests() c;
    rollback;
  `)
  return rows.map((row) => row.user_id)
}

/** Los días de resumen registrados de esa persona antes de hoy. */
export async function digestDaysBeforeToday(userId: string, today: string): Promise<string[]> {
  const { data, error } = await db()
    .from('admin_digest_sends')
    .select('day')
    .eq('user_id', userId)
    .lt('day', today)
    .order('day')
  expect(error).toBeNull()
  return (data ?? []).map((row) => row.day)
}

/** Deja los resúmenes de hoy como estaban: la prueba reclama también a quienes administran en la semilla. */
export async function forgetDigestsClaimedSince(today: string, before: readonly string[]) {
  const query = db().from('admin_digest_sends').delete().eq('day', today)
  const { error } =
    before.length === 0 ? await query : await query.not('user_id', 'in', `(${before.join(',')})`)
  expect(error).toBeNull()
}

export async function digestsClaimedOn(day: string): Promise<string[]> {
  const { data, error } = await db().from('admin_digest_sends').select('user_id').eq('day', day)
  expect(error).toBeNull()
  return (data ?? []).map((row) => row.user_id)
}
