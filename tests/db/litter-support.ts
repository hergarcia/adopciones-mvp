// Lo que comparten las pruebas de las camadas (historia #205): `publish_litter` llamada con permisos
// de servicio, como la llama la aplicación, sobre las fotos en espera de `pet-support`.
import { expect } from 'vitest'
import { db, firstRow } from './phone-support'
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
