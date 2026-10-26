// Lo que comparten las pruebas de las camadas (historia #205): `publish_litter` llamada con permisos
// de servicio, como la llama la aplicación, sobre las fotos en espera de `pet-support`.
import { expect } from 'vitest'
import { ANSWERS } from './applications-support'
import { db, firstRow, type Functions } from './phone-support'
import { FIELDS, PENDING_TTL, STAGED_TTL, stagedPhotos } from './pet-support'
import { serviceClient } from './roles'

const { sex: _sex, name: _name, ...COMMON } = FIELDS

export const LITTER_FIELDS = {
  ...COMMON,
  name: 'La camada de Luna',
  species: 'cat',
  required_level: 1,
  delivers_from: null as string | null,
}

export type Young = {
  key: string
  name: string
  sex: 'male' | 'female'
  description: string | null
  photo_ids: string[]
}

export function youngList(count: number, overrides: Partial<Young>[] = []): Young[] {
  return Array.from({ length: count }, (_, index) => ({
    key: crypto.randomUUID(),
    name: `Cría ${index + 1}`,
    sex: index % 2 === 0 ? 'female' : 'male',
    description: null,
    photo_ids: [],
    ...overrides[index],
  }))
}

export async function publishLitter(
  ownerId: string,
  photoIds: string[],
  young: Young[],
  options: { attempt?: string; fields?: Partial<typeof LITTER_FIELDS> } = {},
) {
  const { data, error } = await serviceClient().rpc('publish_litter', {
    p_owner: ownerId,
    p_attempt: options.attempt ?? crypto.randomUUID(),
    p_pending_ttl: PENDING_TTL,
    p_staged_ttl: STAGED_TTL,
    p_fields: { ...LITTER_FIELDS, ...options.fields },
    p_photo_ids: photoIds,
    p_young: young,
  })
  return { row: data?.[0], error }
}

/** Una camada de una persona con nivel 1: `count` crías y fotos de la camada, sin fotos propias. */
export async function publishedLitter(ownerId: string, count = 4, photos = 1) {
  const ids = await stagedPhotos(ownerId, photos)
  const young = youngList(count)
  const { row, error } = await publishLitter(ownerId, ids, young)
  expect(error).toBeNull()
  const litter = firstRow(row ? [row] : [], 'publish_litter')
  return { litterId: litter.litter_id, code: litter.code, photoIds: ids, young }
}

export async function littersOf(ownerId: string) {
  const { data } = await db().from('litters').select('*').eq('owner_id', ownerId)
  return data ?? []
}

export async function youngOf(litterId: string) {
  const { data } = await db()
    .from('pets')
    .select('*')
    .eq('litter_id', litterId)
    .order('published_at')
  return data ?? []
}

/**
 * Una camada con la fecha de una ventana del listado (`listing-support`): la camada y sus crías, así
 * una cría con foto propia también cae en la ventana y se ve que no sale suelta.
 */
export async function listLitter(
  ownerId: string,
  publishedAt: string,
  young: Young[],
  fields: Partial<typeof LITTER_FIELDS> = {},
) {
  const ids = await stagedPhotos(ownerId, 1)
  const { row, error } = await publishLitter(ownerId, ids, young, { fields })
  expect(error).toBeNull()
  const litter = firstRow(row ? [row] : [], 'publish_litter')
  const moved = await Promise.all([
    db().from('litters').update({ published_at: publishedAt }).eq('id', litter.litter_id),
    db().from('pets').update({ published_at: publishedAt }).eq('litter_id', litter.litter_id),
  ])
  for (const { error: failed } of moved) expect(failed).toBeNull()
  return { litterId: litter.litter_id, code: litter.code, coverId: ids[0] }
}

/** Una cría al guardar: la que ya existe viene con su `id`; una nueva, solo con su `key`. */
export type SavedYoung = Young & { id?: string }

export async function saveLitter(
  ownerId: string,
  litterId: string,
  photoIds: string[],
  young: SavedYoung[],
  fields: Partial<typeof LITTER_FIELDS> = {},
) {
  const { data, error } = await serviceClient().rpc('save_litter', {
    p_owner: ownerId,
    p_litter: litterId,
    p_pending_ttl: PENDING_TTL,
    p_staged_ttl: STAGED_TTL,
    p_fields: { ...LITTER_FIELDS, ...fields },
    p_photo_ids: photoIds,
    p_young: young,
  })
  return { row: data?.[0], error }
}

/** Las crías guardadas como las manda el formulario de editar: con su `id` y su intento como `key`. */
export async function savedYoungOf(litterId: string): Promise<SavedYoung[]> {
  return (await youngOf(litterId)).map((pet) => ({
    id: pet.id,
    key: pet.attempt_id,
    name: pet.name,
    sex: pet.sex === 'male' ? 'male' : 'female',
    description: pet.description,
    photo_ids: [],
  }))
}

// La vida de una camada (historia #206) ---------------------------------------------------------

/** Una solicitud por una cría, escrita directo con el servicio como `insertApplication`. */
export async function applyForYoung(
  applicant: { id: string },
  young: { id: string; name: string },
  publisher: { id: string },
): Promise<string> {
  const { data, error } = await db()
    .from('applications')
    .insert({
      applicant_id: applicant.id,
      pet_id: young.id,
      publisher_id: publisher.id,
      attempt_id: crypto.randomUUID(),
      answers: ANSWERS,
      pet_name: young.name,
      status: 'sent',
    })
    .select('id')
    .single()
  expect(error).toBeNull()
  return data?.id ?? ''
}

/**
 * Una camada de una publicadora con nivel 1 y sus crías con id, nombre y código, en el orden de la
 * camada. `count` crías, sin fotos propias.
 */
export async function litterWithYoung(ownerId: string, count = 4) {
  const litter = await publishedLitter(ownerId, count)
  const young = await youngOf(litter.litterId)
  return { ...litter, young: young.map(({ id, name, code }) => ({ id, name, code })) }
}

export type YoungChange = Functions['change_young_status']['Returns'][number]

/** Marcar una cría como lo hace la aplicación: con el servicio y el id de quien publicó. */
export async function changeYoung(
  ownerId: string,
  petId: string,
  action: 'mark_in_process' | 'mark_available',
): Promise<YoungChange> {
  const { data, error } = await serviceClient().rpc('change_young_status', {
    p_owner: ownerId,
    p_pet: petId,
    p_action: action,
  })
  expect(error).toBeNull()
  return firstRow(data, 'change_young_status')
}

/** Una cría en proceso o adoptada, escrita directo como la dejaría su acción (sin adopción). */
export async function setYoungState(petId: string, state: 'in_process' | 'adopted') {
  const { data: pet } = await db().from('pets').select('litter_id').eq('id', petId).single()
  const { data: litter } = await db()
    .from('litters')
    .select('expires_at')
    .eq('id', pet?.litter_id ?? '')
    .single()
  const { error } = await db()
    .from('pets')
    .update({
      status: state,
      status_changed_at: new Date().toISOString(),
      expires_at: state === 'adopted' ? null : (litter?.expires_at ?? null),
    })
    .eq('id', petId)
  expect(error).toBeNull()
}

/** La camada pausada como la dejaría pausarla: cada cría que vence guarda a dónde vuelve (R2). */
export async function pauseLitter(litterId: string) {
  const { error } = await db()
    .from('litters')
    .update({ paused_at: new Date().toISOString() })
    .eq('id', litterId)
  expect(error).toBeNull()
  const running = (await youngOf(litterId)).filter(
    (young) => young.status === 'available' || young.status === 'in_process',
  )
  const paused = await Promise.all(
    running.map((young) =>
      db()
        .from('pets')
        .update({ status: 'paused', resume_status: young.status, expires_at: null })
        .eq('id', young.id),
    ),
  )
  for (const { error: failed } of paused) expect(failed).toBeNull()
}

/** La camada vencida: el vencimiento pasa a sus crías por el trigger (R3). */
export async function expireLitter(litterId: string) {
  const { error } = await db()
    .from('litters')
    .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
    .eq('id', litterId)
  expect(error).toBeNull()
}
