// Lo que comparten las pruebas del seguimiento en la base (historia #69): una publicadora con un
// animal, la persona que lo adoptó por el sitio —marcada con el servicio, como la aplicación, y con
// el día de la adopción movido a mano—, otra solicitante del mismo animal, otra persona y quien
// administra; la vuelta horaria; y las lecturas como cada sesión.
import { expect } from 'vitest'
import { adoptionPeople, adoptionsOf, markAdopted, type HandoverScene } from './adoptions-support'
import type { PetOptions, Person } from './applications-support'
import { db, type Functions } from './phone-support'
import type { SyntheticUser } from './roles'

type Client = SyntheticUser['client']

export type FollowUpOfRow = Functions['follow_up_of']['Returns'][number]
export type PetFollowUpRow = Functions['my_pet_follow_ups']['Returns'][number]

export type AdoptedScene = HandoverScene & { adoptionId: string }

// Uruguay no tiene horario de verano desde 2015: el día de allá empieza a las 3:00 UTC.
const URUGUAY_OFFSET_MS = 3 * 3_600_000

/** Un instante a la hora y minuto de Uruguay, `daysAgo` días de calendario de Uruguay atrás. */
export function uruguayMoment(daysAgo: number, hour: number, minute: number): string {
  const here = new Date(Date.now() - URUGUAY_OFFSET_MS)
  const at = Date.UTC(
    here.getUTCFullYear(),
    here.getUTCMonth(),
    here.getUTCDate() - daysAgo,
    hour,
    minute,
  )
  return new Date(at + URUGUAY_OFFSET_MS).toISOString()
}

export function followUpPeople(cleanups: SyntheticUser['cleanup'][]) {
  const people = adoptionPeople(cleanups)
  return {
    ...people,
    /** Una adopción por el sitio a la elegida (Ana), marcada el instante pedido. */
    adoptedScene: async (markedAt: string, options: PetOptions = {}): Promise<AdoptedScene> => {
      const scene = await people.handoverScene(options)
      await markAdopted(scene.publisher, scene.pet.petId, scene.chosenId)
      return { ...scene, adoptionId: await backdate(scene.pet.petId, markedAt) }
    },
  }
}

// `adoptions_forward_only` no deja mover `marked_at`: la fila se vuelve a escribir igual, con otro
// día. Antes del seguimiento nada apunta a ella.
export async function backdate(petId: string, markedAt: string): Promise<string> {
  const rows = await adoptionsOf(petId)
  const row = rows.at(-1)
  if (row === undefined) throw new Error('el animal no tiene adopción')
  const removed = await db().from('adoptions').delete().eq('id', row.id)
  expect(removed.error).toBeNull()
  const inserted = await db()
    .from('adoptions')
    .insert({ ...row, marked_at: markedAt })
  expect(inserted.error).toBeNull()
  return row.id
}

/** La vuelta horaria, sin esperar al minuto 10. */
export async function tick() {
  const { error } = await db().rpc('run_follow_up_tick')
  expect(error).toBeNull()
}

/** La fila del seguimiento de una adopción, leída con el servicio; null si no hay. */
export async function followUpRow(adoptionId: string) {
  const { data, error } = await db()
    .from('follow_ups')
    .select('*')
    .eq('adoption_id', adoptionId)
    .maybeSingle()
  expect(error).toBeNull()
  return data
}

export async function unblock(blocker: string, blocked: string) {
  const { error } = await db()
    .from('blocks')
    .delete()
    .eq('blocker_id', blocker)
    .eq('blocked_id', blocked)
  expect(error).toBeNull()
}

export async function followUpOfAs(client: Client, applicationId: string) {
  const { data, error } = await client.rpc('follow_up_of', { p_application: applicationId })
  const rows: FollowUpOfRow[] = data ?? []
  return { rows, error }
}

export async function myPetFollowUpsAs(client: Client) {
  const { data, error } = await client.rpc('my_pet_follow_ups')
  const rows: PetFollowUpRow[] = data ?? []
  return { rows, error }
}

export async function myOpenFollowUpsAs(client: Client) {
  const { data, error } = await client.rpc('my_open_follow_ups')
  const rows: Functions['my_open_follow_ups']['Returns'] = data ?? []
  return { ids: rows.map((row) => row.application_id), error }
}

export type { Person }
