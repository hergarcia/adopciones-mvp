// Lo que comparten las pruebas del seguimiento en la base (historia #69): una publicadora con un
// animal, la persona que lo adoptó por el sitio —marcada con el servicio, como la aplicación, y con
// el día de la adopción movido a mano—, otra solicitante del mismo animal, otra persona y quien
// administra; la vuelta horaria; y las lecturas como cada sesión.
import { expect } from 'vitest'
import { adoptionPeople, adoptionsOf, markAdopted, type HandoverScene } from './adoptions-support'
import type { PetOptions, Person } from './applications-support'
import { db, type Functions } from './phone-support'
import { anonClient, type SyntheticUser } from './roles'

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

export type Staged = Functions['stage_follow_up_photo']['Returns'][number]
export type Answered = Functions['answer_follow_up']['Returns'][number]

const THUMBHASH = 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw'

/** Una foto en espera, como la anota la aplicación: con el servicio y el id de quien adoptó. */
export async function stagePhoto(
  adopter: { id: string },
  applicationId: string,
  photoId: string = crypto.randomUUID(),
): Promise<Staged & { photoId: string }> {
  const { data, error } = await db().rpc('stage_follow_up_photo', {
    p_adopter: adopter.id,
    p_application: applicationId,
    p_photo: photoId,
    p_width: 1200,
    p_height: 1500,
    p_thumbhash: THUMBHASH,
  })
  expect(error).toBeNull()
  const row = data?.[0]
  if (row === undefined) throw new Error('stage_follow_up_photo no devolvió nada')
  return { ...row, photoId }
}

/** «Mandar» como lo hace la aplicación. */
export async function answer(
  adopter: { id: string },
  applicationId: string,
  photos: string[],
  text: string | null = null,
): Promise<Answered> {
  const { data, error } = await db().rpc('answer_follow_up', {
    p_adopter: adopter.id,
    p_application: applicationId,
    p_photos: photos,
    p_text: text ?? '',
  })
  expect(error).toBeNull()
  const row = data?.[0]
  if (row === undefined) throw new Error('answer_follow_up no devolvió nada')
  return row
}

/** Pedido hecho y n fotos en espera, listas para mandar. */
export async function stagedPhotos(adopter: { id: string }, applicationId: string, n: number) {
  const ids: string[] = []
  for (let index = 0; index < n; index += 1) {
    // oxlint-disable-next-line no-await-in-loop -- en orden, como las sube la pantalla
    ids.push((await stagePhoto(adopter, applicationId)).photoId)
  }
  return ids
}

export async function photoRows(followUpId: string) {
  const { data, error } = await db()
    .from('follow_up_photos')
    .select('id, position')
    .eq('follow_up_id', followUpId)
    .order('position')
  expect(error).toBeNull()
  return data ?? []
}

export async function purgeQueue(followUpId: string) {
  const { data, error } = await db()
    .from('follow_up_photo_purges')
    .select('photo_id')
    .eq('follow_up_id', followUpId)
  expect(error).toBeNull()
  return (data ?? []).map((row) => row.photo_id)
}

export type HistoryRow = Functions['follow_up_history']['Returns'][number]

export async function publicIdOf(userId: string): Promise<string> {
  const { data, error } = await db().from('profiles').select('public_id').eq('id', userId).single()
  expect(error).toBeNull()
  return data?.public_id ?? ''
}

/** El historial de una persona, leído por su id público con la sesión dada. */
export async function historyAs(client: Client, publicId: string) {
  const { data, error } = await client.rpc('follow_up_history', { p_public_id: publicId })
  expect(error).toBeNull()
  const rows: HistoryRow[] = data ?? []
  return rows
}

/** El historial de quien publicó ese animal, como lo pide la ficha. */
export async function petHistoryAs(client: Client, code: string) {
  const { data, error } = await client.rpc('pet_follow_up_history', { p_code: code })
  expect(error).toBeNull()
  const rows: Functions['pet_follow_up_history']['Returns'] = data ?? []
  return rows
}

/** Los ids públicos de las dos personas, leídos antes de que algo se borre. */
export async function scenePublicIds(scene: { publisher: { id: string }; chosen: { id: string } }) {
  const [publisher, adopter] = await Promise.all([
    publicIdOf(scene.publisher.id),
    publicIdOf(scene.chosen.id),
  ])
  return { publisher, adopter }
}

/** Los dos números de cada una, como los ve un visitante. */
export async function historiesOf(ids: { publisher: string; adopter: string }) {
  const anon = anonClient()
  const [publisher, adopter] = await Promise.all([
    historyAs(anon, ids.publisher),
    historyAs(anon, ids.adopter),
  ])
  return { publisher, adopter }
}
