// Lo que comparten las pruebas de los animales en la base (historia #53): las funciones llamadas
// con permisos de servicio, como las llama la aplicación, y fotos en espera de mentira.
import { expect } from 'vitest'
import { db, firstRow, hoursAgo, randomNumber, reserve, settle, verify } from './phone-support'
import { serviceClient } from './roles'

export const PENDING_TTL = '7 days'
export const STAGED_TTL = '24 hours'
export const BUCKET = 'pet-photos'

export const FIELDS = {
  name: 'Luna',
  species: 'dog',
  sex: 'female',
  age_value: 2,
  age_unit: 'months',
  age_as_of: '2026-09-26',
  size: 'medium',
  is_neutered: true,
  vaccines: 'up_to_date',
  has_chip: false,
  good_with_kids: 'unknown',
  good_with_dogs: 'yes',
  good_with_cats: 'no',
  description: null as string | null,
  department: 'UY-MO',
  locality: 'Pocitos',
  is_urgent: false,
}

/** Una persona con nivel 1: teléfono verificado y nada a medias. */
export async function levelOne(userId: string) {
  const facts = await verify(userId, randomNumber())
  expect(facts.verified).toBe(true)
}

/** Empieza un cambio de número: la cuenta queda con un número a medias. */
export async function startChange(userId: string) {
  const reserved = await reserve(userId, randomNumber())
  await settle(reserved.code_id)
}

export async function stage(ownerId: string, photoId = crypto.randomUUID()) {
  const { data, error } = await serviceClient().rpc('stage_pet_photo', {
    p_owner: ownerId,
    p_photo_id: photoId,
    p_width: 1600,
    p_height: 1200,
    p_thumbhash: 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw',
    p_pending_ttl: PENDING_TTL,
  })
  return { photoId, data, error }
}

export async function stagedPhotos(ownerId: string, count: number): Promise<string[]> {
  const ids: string[] = []
  for (let index = 0; index < count; index += 1) {
    // oxlint-disable-next-line no-await-in-loop -- de a una, como las sube el formulario
    const { photoId, error } = await stage(ownerId)
    expect(error).toBeNull()
    ids.push(photoId)
  }
  return ids
}

export async function publish(
  ownerId: string,
  photoIds: string[],
  options: { attempt?: string; fields?: Partial<typeof FIELDS> } = {},
) {
  const { data, error } = await serviceClient().rpc('publish_pet', {
    p_owner: ownerId,
    p_attempt: options.attempt ?? crypto.randomUUID(),
    p_pending_ttl: PENDING_TTL,
    p_staged_ttl: STAGED_TTL,
    p_fields: { ...FIELDS, ...options.fields },
    p_photo_ids: photoIds,
  })
  return { row: data?.[0], error }
}

export async function published(ownerId: string, photos = 1) {
  const ids = await stagedPhotos(ownerId, photos)
  const { row, error } = await publish(ownerId, ids)
  expect(error).toBeNull()
  return { petId: firstRow(row ? [row] : [], 'publish_pet').pet_id, photoIds: ids }
}

export async function save(
  ownerId: string,
  petId: string,
  photoIds: string[],
  fields: Partial<typeof FIELDS> = {},
) {
  return serviceClient().rpc('save_pet', {
    p_owner: ownerId,
    p_pet: petId,
    p_pending_ttl: PENDING_TTL,
    p_staged_ttl: STAGED_TTL,
    p_fields: { ...FIELDS, ...fields },
    p_photo_ids: photoIds,
  })
}

export async function hasLevelOne(userId: string): Promise<boolean> {
  const { data, error } = await serviceClient().rpc('has_level_one', {
    p_user: userId,
    p_pending_ttl: PENDING_TTL,
  })
  expect(error).toBeNull()
  return data === true
}

export async function ageStaged(photoId: string, hours: number) {
  await db()
    .from('pet_photos')
    .update({ staged_at: hoursAgo(hours) })
    .eq('id', photoId)
}

export async function photosOf(ownerId: string) {
  const { data } = await db()
    .from('pet_photos')
    .select('id, pet_id, position, released_at')
    .eq('owner_id', ownerId)
    .order('position')
  return data ?? []
}

export async function petsOf(ownerId: string) {
  const { data } = await db().from('pets').select('*').eq('owner_id', ownerId)
  return data ?? []
}

export function webp() {
  return new Blob([new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80])], {
    type: 'image/webp',
  })
}

/** Sube los tres objetos de una foto con permisos de servicio, como `uploadPetPhotoFiles`. */
export async function uploadObjects(ownerId: string, photoId: string) {
  const bucket = serviceClient().storage.from(BUCKET)
  for (const size of ['thumb', 'card', 'full']) {
    // oxlint-disable-next-line no-await-in-loop -- tres archivos chicos, en orden
    const { error } = await bucket.upload(`${ownerId}/${photoId}/${size}.webp`, webp(), {
      contentType: 'image/webp',
      upsert: true,
    })
    expect(error).toBeNull()
  }
}

export async function objectsOf(ownerId: string): Promise<string[]> {
  const bucket = serviceClient().storage.from(BUCKET)
  const { data: folders } = await bucket.list(ownerId)
  const names: string[] = []
  for (const folder of folders ?? []) {
    // oxlint-disable-next-line no-await-in-loop -- pocas carpetas de prueba
    const { data: files } = await bucket.list(`${ownerId}/${folder.name}`)
    for (const file of files ?? []) names.push(`${folder.name}/${file.name}`)
  }
  return names
}
