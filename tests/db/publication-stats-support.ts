// Lo que comparten las pruebas de «Cómo le va a…» (historia #269): una dueña con un animal en el
// nivel pedido, otra persona, quien administra, las sumas como las llama el servidor y la lectura
// como la pide cada sesión. La fila de las cuentas se lee directo con el servicio.
import { expect } from 'vitest'
import { applicationPeople, petOf, type PetOptions } from './applications-support'
import { db } from './phone-support'
import { serviceClient, type SyntheticUser } from './roles'

type Client = SyntheticUser['client']

export function statsPeople(cleanups: SyntheticUser['cleanup'][]) {
  const people = applicationPeople(cleanups)
  return {
    ...people,
    /** La dueña con nivel 1 y un animal suyo publicado solo. */
    ownerWithPet: async (options: PetOptions = {}) => {
      const owner = await people.person(1, 'Carla')
      return { owner, pet: await petOf(owner, options) }
    },
  }
}

export type StatsRow = {
  opens: number
  taps: number
  phone_stops: number
  identity_stops: number
  counted_since: string
  from_publication: boolean
}

const COLUMNS = 'opens, taps, phone_stops, identity_stops, counted_since, from_publication'

/** La fila de cuentas de un animal, o null si no tiene. */
export async function petStatsRow(petId: string): Promise<StatsRow | null> {
  const { data, error } = await db()
    .from('publication_stats')
    .select(COLUMNS)
    .eq('pet_id', petId)
    .maybeSingle()
  expect(error).toBeNull()
  return data
}

/** Solo los cuatro números de la fila de un animal. */
export async function petCounts(petId: string) {
  const row = await petStatsRow(petId)
  if (row === null) return null
  return {
    opens: row.opens,
    taps: row.taps,
    phone_stops: row.phone_stops,
    identity_stops: row.identity_stops,
  }
}

/** Abrir la ficha de un animal como lo suma el servidor. */
export async function countPetOpen(code: string, viewer: string | null) {
  const { error } = await serviceClient().rpc('count_pet_open', {
    p_code: code,
    ...(viewer === null ? {} : { p_viewer: viewer }),
  })
  return error
}

/** Un toque de «Quiero adoptar» como lo suma el servidor. */
export async function countTap(
  code: string,
  viewer: string | null,
  tap: boolean,
  stop: string | null = null,
) {
  const { error } = await serviceClient().rpc('count_apply_tap', {
    p_code: code,
    p_tap: tap,
    ...(viewer === null ? {} : { p_viewer: viewer }),
    ...(stop === null ? {} : { p_stop: stop }),
  })
  return error
}

/** Lo que la página de «Mis animales» lee de un animal, con esa sesión. */
export async function myPetStatsAs(client: Client, petId: string) {
  const { data, error } = await client.rpc('my_publication_stats', { p_pet: petId })
  return { rows: data ?? [], error }
}

/** Lo que una sesión lee de la tabla, directo con su token. */
export async function statsTableAs(client: Client) {
  const { data, error } = await client.from('publication_stats').select('*')
  return { rows: data ?? [], error }
}
