import { cache } from 'react'
import { z } from 'zod'
import type { LitterInput } from '@/lib/schemas/litter'
import type { LitterForEdit, MyLitter, PublicLitterResult, PublicYoung } from '@/lib/litters/types'
import { ageOn, uruguayDay, type StoredAge } from '@/lib/pets/age'
import { SEXES, SPECIES } from '@/lib/pets/options'
import { PET_CODE_PATTERN, PET_DB_RULES } from '@/lib/pets/rules'
import type { PetPhotoData } from '@/lib/pets/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { DB_RULES } from '@/lib/verification/rules'
import { PET_PHOTOS_BUCKET, objectPath, signPetPhotos } from './pet-photos'
import { dbErrorKey } from './pet-errors'
import { isPhotoJson, oneOf, storedAgeOf, zoneOf } from './pet-rows'
import { signFile, traitsSheetOf } from './pet-sheet-rows'
import { isUuid, takedownOf } from './pets'

const LITTER_ERRORS = new Set(['young_count', 'young_name_taken', 'delivery_date_past'])

// Las de la camada tienen su texto; las demás son las de un animal (las fotos, el nivel 1).
function litterErrorKey(error: { code?: string; message: string }): string {
  return error.code === 'P0001' && LITTER_ERRORS.has(error.message)
    ? `litters.errors.${error.message}`
    : dbErrorKey(error)
}

export type YoungRecord = LitterInput['young'][number] & { photoIds: string[] }

function fieldsOf(input: LitterInput, ageAsOf: string) {
  return {
    name: input.name,
    species: input.species,
    age_value: input.age.value,
    age_unit: input.age.unit,
    age_as_of: ageAsOf,
    size: input.size,
    is_neutered: input.isNeutered,
    vaccines: input.vaccines,
    has_chip: input.hasChip,
    good_with_kids: input.goodWithKids,
    good_with_dogs: input.goodWithDogs,
    good_with_cats: input.goodWithCats,
    description: input.description,
    department: input.department,
    locality: input.locality,
    is_urgent: input.isUrgent,
    required_level: input.requiredLevel,
    delivers_from: input.deliversFrom,
  }
}

// Con permisos de servicio y la dueña como parámetro, como un animal: la función comprueba adentro
// el nivel 1, las fotos en espera y el intento, con el candado de la cuenta (research R6).
export async function publishLitterRecord(input: {
  ownerId: string
  attemptId: string
  litter: LitterInput
  ageAsOf: string
  photoIds: string[]
  young: YoungRecord[]
}): Promise<{ ok: true; code: string; already: boolean } | { ok: false; error: string }> {
  const { data, error } = await createServiceSupabase().rpc('publish_litter', {
    p_owner: input.ownerId,
    p_attempt: input.attemptId,
    p_pending_ttl: DB_RULES.p_pending_ttl,
    p_staged_ttl: PET_DB_RULES.p_staged_ttl,
    p_fields: fieldsOf(input.litter, input.ageAsOf),
    p_photo_ids: input.photoIds,
    p_young: input.young.map((young) => ({
      key: young.key,
      name: young.name,
      sex: young.sex,
      description: young.description,
      photo_ids: young.photoIds,
    })),
  })
  const row = error ? undefined : data[0]
  if (row === undefined) {
    return { ok: false, error: error ? litterErrorKey(error) : 'pets.errors.save_failed' }
  }
  return { ok: true, code: row.code, already: row.already }
}

const MY_LITTER =
  'id, code, name, species, department, locality, is_urgent, published_at, pet_photos!pet_photos_litter_id_fkey (id, owner_id, width, height, thumbhash, position), pets!pets_litter_id_fkey (id, code, name, sex, published_at)'

// Las de la sesión, de la más nueva a la más vieja, con sus crías en el orden en que se cargaron. La
// RLS deja ver solo las propias. Si la base no responde, lanza, como `listMyPets`.
export async function listMyLitters(): Promise<MyLitter[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('litters')
    .select(MY_LITTER)
    .eq('pet_photos.position', 0)
    .order('published_at', { ascending: false })
  if (error) throw new Error('No se pudieron traer las camadas', { cause: error })

  const covers = data.flatMap((row) =>
    row.pet_photos.slice(0, 1).map((photo) => ({ ...photo, ownerId: photo.owner_id })),
  )
  const signed = await signPetPhotos(covers)
  return data.flatMap((row) => {
    const cover = signed.get(row.pet_photos[0]?.id ?? '')
    if (cover === undefined) return []
    const young = [...row.pets].sort((a, b) => a.published_at.localeCompare(b.published_at))
    return [
      {
        id: row.id,
        code: row.code,
        name: row.name,
        species: oneOf(SPECIES, row.species, 'especie'),
        zone: zoneOf(row),
        isUrgent: row.is_urgent,
        publishedAt: new Date(row.published_at),
        cover,
        young: young.map((pet) => ({
          id: pet.id,
          code: pet.code,
          name: pet.name,
          sex: oneOf(SEXES, pet.sex, 'sexo'),
        })),
      },
    ]
  })
}

/** Los nombres de las camadas propias de una especie, para el aviso de nombre repetido (FR-015). */
export async function listMyLitterNames(species: string): Promise<string[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.from('litters').select('name').eq('species', species)
  if (error) throw new Error('No se pudieron traer los nombres', { cause: error })
  return data.map((row) => row.name)
}

export async function isLitterAttemptPublished(attemptId: string): Promise<boolean> {
  if (!isUuid(attemptId)) return false
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('litters')
    .select('id')
    .eq('attempt_id', attemptId)
    .maybeSingle()
  if (error) throw new Error('No se pudo leer el intento', { cause: error })
  return data !== null
}

const YOUNG_JSON = z.array(
  z.object({
    code: z.string(),
    name: z.string(),
    sex: z.enum(SEXES),
    description: z.string().nullable(),
    photos: z.array(z.unknown()),
    my_active_id: z.string().nullable(),
    my_rejected: z.boolean(),
  }),
)

// Las crías con sus fotos firmadas; la que no tiene propias muestra las de la camada (FR-028).
async function youngOf(
  value: unknown,
  ownerFolder: string,
  litterPhotos: PetPhotoData[],
): Promise<PublicYoung[]> {
  const young = YOUNG_JSON.parse(value)
  const own = young.map((one) => one.photos.filter(isPhotoJson))
  const signed = await signPetPhotos(
    own.flat().map((photo) => ({ ...photo, ownerId: ownerFolder })),
  )
  return young.map((one, index) => {
    const photos = (own[index] ?? []).flatMap((photo) => signed.get(photo.id) ?? [])
    return {
      code: one.code,
      name: one.name,
      sex: one.sex,
      description: one.description,
      photos: photos.length > 0 ? photos : litterPhotos,
      myActiveId: one.my_active_id,
      myRejected: one.my_rejected,
    }
  })
}

// Envuelta en `cache`: `generateMetadata` y la página la piden en el mismo pedido. Como la de un
// animal: un código que no cumple el formato es «no existe» sin ir a la base, y una falla lanza.
export const getLitterByCode = cache(
  async (code: string, now = new Date()): Promise<PublicLitterResult | null> => {
    if (!PET_CODE_PATTERN.test(code)) return null
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.rpc('litter_by_code', { p_code: code })
    if (error) throw new Error('No se pudo traer la camada', { cause: error })
    const row = data[0]
    if (row === undefined) return null
    if (row.visibility === 'blocked' && !row.is_owner)
      return { visibility: 'blocked', isOwner: false, publisherPublicId: row.publisher_public_id }
    const visibility = row.visibility === 'listed' ? 'listed' : 'hidden'
    if (!row.is_owner && visibility === 'hidden') return { visibility, isOwner: false }

    const sheet = await traitsSheetOf(row, now)
    return {
      ...sheet,
      visibility,
      isOwner: row.is_owner,
      takedown: takedownOf(row),
      editId: row.is_owner ? row.litter_id : null,
      code: row.code,
      requiredLevel: row.required_level === 2 ? 2 : 1,
      deliversFrom: row.delivers_from,
      young: await youngOf(row.young, row.owner_folder, sheet.photos),
      availableCount: row.available_count,
      publishedOn: uruguayDay(new Date(row.published_at)),
      version: row.version,
      signedAt: now.toISOString(),
    }
  },
)

export type LitterShareCard = {
  name: string
  zone: ReturnType<typeof zoneOf>
  /** La portada `full`, firmada: la ruta de la imagen la baja en el servidor. */
  coverUrl: string
}

/** Lo de la vista previa, o null si la camada no está a la vista o no existe (FR-036). */
export async function getLitterShareCard(code: string): Promise<LitterShareCard | null> {
  if (!PET_CODE_PATTERN.test(code)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('litter_share_card', { p_code: code })
  if (error) throw new Error('No se pudo traer la vista previa', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  const coverUrl = await signFile(
    PET_PHOTOS_BUCKET,
    objectPath(row.cover_owner, row.cover_id, 'full'),
  )
  return coverUrl === null ? null : { name: row.name, zone: zoneOf(row), coverUrl }
}

export type SavedYoungRecord = YoungRecord & { id?: string }

// Como publicar: la dueña como parámetro y la función, con el candado, mira el nivel 1, las fotos y
// cada cría (research R6). Devuelve las fotos que quedaron sueltas, para borrarlas enseguida.
export async function saveLitterRecord(input: {
  ownerId: string
  litterId: string
  litter: LitterInput
  ageAsOf: string
  photoIds: string[]
  young: SavedYoungRecord[]
}): Promise<{ ok: true; code: string; released: string[] } | { ok: false; error: string }> {
  const { data, error } = await createServiceSupabase().rpc('save_litter', {
    p_owner: input.ownerId,
    p_litter: input.litterId,
    p_pending_ttl: DB_RULES.p_pending_ttl,
    p_staged_ttl: PET_DB_RULES.p_staged_ttl,
    p_fields: fieldsOf(input.litter, input.ageAsOf),
    p_photo_ids: input.photoIds,
    p_young: input.young.map((young) => ({
      ...(young.id === undefined ? {} : { id: young.id }),
      key: young.key,
      name: young.name,
      sex: young.sex,
      description: young.description,
      photo_ids: young.photoIds,
    })),
  })
  const row = error ? undefined : data[0]
  if (row === undefined) {
    return { ok: false, error: error ? litterErrorKey(error) : 'pets.errors.save_failed' }
  }
  return { ok: true, code: row.code, released: row.released }
}

/** Cuántas solicitudes abiertas se cierran si se quitan esas crías (FR-019). Lanza si falla. */
export async function countRemovalApplications(
  litterId: string,
  youngIds: string[],
): Promise<number> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('preview_litter_removal', {
    p_litter: litterId,
    p_ids: youngIds,
  })
  if (error) throw new Error('No se pudieron contar las solicitudes', { cause: error })
  return data
}

export type DeleteLitterRecord =
  { outcome: 'not_found' } | { outcome: 'done'; code: string; released: string[] }

export async function deleteLitterRecord(
  ownerId: string,
  litterId: string,
): Promise<DeleteLitterRecord> {
  const { data, error } = await createServiceSupabase().rpc('delete_litter', {
    p_owner: ownerId,
    p_litter: litterId,
  })
  const row = error ? undefined : data[0]
  if (row === undefined) throw new Error('No se pudo borrar la camada', { cause: error })
  if (row.outcome !== 'done' || row.code === null) return { outcome: 'not_found' }
  return { outcome: 'done', code: row.code, released: row.released }
}

const PHOTO = 'id, owner_id, width, height, thumbhash, position'
const FOR_EDIT = `id, code, name, species, age_value, age_unit, age_as_of, size, is_neutered, vaccines, has_chip, good_with_kids, good_with_dogs, good_with_cats, description, department, locality, is_urgent, required_level, delivers_from, taken_down_at, published_at, pet_photos!pet_photos_litter_id_fkey (${PHOTO}), pets!pets_litter_id_fkey (id, attempt_id, name, sex, description, published_at, pet_photos (${PHOTO}))`

type PhotoRow = { id: string; owner_id: string; width: number; height: number; thumbhash: string }

const byPosition = <T extends { position: number | null }>(rows: T[]) =>
  [...rows].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

const storedOf = (row: PhotoRow) => ({
  id: row.id,
  ownerId: row.owner_id,
  width: row.width,
  height: row.height,
  thumbhash: row.thumbhash,
})

// Una camada propia para el formulario de editar, con lo guardado como lo escribe el formulario: la
// edad de hoy, los sí o no como claves y cada cría con su `id` y su intento como `key`. Un id mal
// formado o ajeno es «no existe»: la RLS no deja ver la de otra persona. Si la base no responde,
// lanza.
export async function getLitterForEdit(
  id: string,
  now = new Date(),
): Promise<LitterForEdit | null> {
  if (!isUuid(id)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.from('litters').select(FOR_EDIT).eq('id', id).maybeSingle()
  if (error) throw new Error('No se pudo traer la camada', { cause: error })
  if (data === null) return null

  const young = [...data.pets].sort((a, b) => a.published_at.localeCompare(b.published_at))
  const litterPhotos = byPosition(data.pet_photos)
  const youngPhotos = young.map((one) => byPosition(one.pet_photos))
  const signed = await signPetPhotos([...litterPhotos, ...youngPhotos.flat()].map(storedOf))
  const signedOf = (rows: PhotoRow[]) => rows.flatMap((row) => signed.get(row.id) ?? [])
  const ageBase = storedAgeOf(data)
  const age = ageOn(ageBase, uruguayDay(now))
  const yesNo = (value: boolean) => (value ? 'yes' : 'no')

  return {
    id: data.id,
    code: data.code,
    name: data.name,
    values: {
      name: data.name,
      species: data.species,
      ageValue: String(age.value),
      ageUnit: age.unit,
      size: data.size,
      isNeutered: yesNo(data.is_neutered),
      vaccines: data.vaccines,
      hasChip: yesNo(data.has_chip),
      goodWithKids: data.good_with_kids,
      goodWithDogs: data.good_with_dogs,
      goodWithCats: data.good_with_cats,
      description: data.description ?? '',
      department: data.department,
      locality: data.locality,
      isUrgent: data.is_urgent,
      requiredLevel: String(data.required_level),
      deliversFrom: data.delivers_from ?? '',
      young: young.map((one) => ({
        key: one.attempt_id,
        id: one.id,
        name: one.name,
        sex: one.sex,
        description: one.description ?? '',
      })),
    },
    photos: {
      litter: signedOf(litterPhotos),
      young: Object.fromEntries(
        young.map((one, index) => [one.attempt_id, signedOf(youngPhotos[index] ?? [])]),
      ),
    },
    ageBase,
    age,
    deliversFrom: data.delivers_from,
    isTakenDown: data.taken_down_at !== null,
  }
}

/** Lo guardado de una camada propia que el guardado necesita: la edad y la fecha. Nulo si no es suya. */
export async function getMyLitterStored(
  id: string,
): Promise<{ stored: StoredAge; publishedOn: string; deliversFrom: string | null } | null> {
  if (!isUuid(id)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('litters')
    .select('age_value, age_unit, age_as_of, published_at, delivers_from')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('No se pudo traer la camada', { cause: error })
  if (data === null) return null
  return {
    stored: storedAgeOf(data),
    publishedOn: uruguayDay(new Date(data.published_at)),
    deliversFrom: data.delivers_from,
  }
}
