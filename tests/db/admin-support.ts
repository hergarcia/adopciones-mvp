// Lo que comparten las pruebas de Administrar en la base (historia #73): las colas como las lee quien
// administra, pendientes con la espera que haga falta, y las cuentas de Opiniones y Encuestas.
import { expect } from 'vitest'
import { openRequest } from './identity-support'
import { listPet } from './listing-support'
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
