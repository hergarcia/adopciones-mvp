// Lo que comparten las pruebas de los avisos (historia #265): personas, animales sueltos y camadas
// en cada estado sobre los soportes del listado, del ciclo de vida y de moderación; la marca de
// primera aparición y lo cubierto movidos en el tiempo; y la corrida de las 8 con el servicio.
import { expect } from 'vitest'
import type { AlertFilters } from '../../src/lib/alerts/types'
import { NO_FILTERS } from '../../src/lib/pets/listing-query'
import { db, type Functions } from './phone-support'
import { sql } from './listing-support'
import { serviceClient, type SyntheticUser } from './roles'

type Client = SyntheticUser['client']
export type MailRow = Functions['claim_pet_alert_mail']['Returns'][number]

/** Los argumentos de `create_pet_alert` a partir de los filtros del dominio, como la query. */
export function alertArgs(filters: Partial<AlertFilters> = {}) {
  const all = { ...NO_FILTERS, ...filters }
  return {
    p_species: all.species,
    p_sexes: all.sex,
    p_sizes: all.size,
    p_age_bands: all.age,
    p_departments: all.department,
    p_neutered_only: all.neutered.length > 0,
  }
}

export async function createAlert(client: Client, filters: Partial<AlertFilters> = {}) {
  return client.rpc('create_pet_alert', alertArgs(filters))
}

/** Crea y espera `created`: la base de una prueba que mira otra cosa. */
export async function alertFor(client: Client, filters: Partial<AlertFilters> = {}) {
  const { data, error } = await createAlert(client, filters)
  expect(error).toBeNull()
  expect(data).toBe('created')
}

/** Los avisos de una persona, leídos con el servicio. */
export async function alertsOf(userId: string) {
  const { data, error } = await db()
    .from('pet_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  expect(error).toBeNull()
  return data ?? []
}

export async function firstListedOf(table: 'pets' | 'litters', id: string): Promise<string | null> {
  const { data, error } = await db().from(table).select('first_listed_at').eq('id', id).single()
  expect(error).toBeNull()
  return data?.first_listed_at ?? null
}

export async function setFirstListed(table: 'pets' | 'litters', id: string, at: string | null) {
  const { error } = await db().from(table).update({ first_listed_at: at }).eq('id', id)
  expect(error).toBeNull()
}

/** Mueve lo cubierto (y la creación, que no puede quedar después) de los avisos de una persona. */
export async function setCovered(userId: string, at: string) {
  const { error } = await db()
    .from('pet_alerts')
    .update({ created_at: at, covered_until: at })
    .eq('user_id', userId)
  expect(error).toBeNull()
}

export async function stampFirstListed() {
  await sql('select private.stamp_first_listed()')
}

/** La corrida de las 8, como la llama la ruta: con el servicio. */
export async function claimMail(): Promise<MailRow[]> {
  const { data, error } = await serviceClient().rpc('claim_pet_alert_mail')
  expect(error).toBeNull()
  return data ?? []
}

/** Lo que la corrida devolvió para una persona: las de otras pruebas se mezclan. */
export function mailOf(rows: MailRow[], userId: string): MailRow[] {
  return rows.filter((row) => row.user_id === userId)
}

/** Que la persona ya tuvo su correo de hoy, para que otra corrida de otra prueba no la cuente. */
export async function sendsOf(userId: string) {
  const { data, error } = await db().from('pet_alert_sends').select('*').eq('user_id', userId)
  expect(error).toBeNull()
  return data ?? []
}
