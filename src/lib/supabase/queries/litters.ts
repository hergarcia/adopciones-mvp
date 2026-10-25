import type { LitterInput } from '@/lib/schemas/litter'
import type { MyLitter } from '@/lib/litters/types'
import { SEXES, SPECIES } from '@/lib/pets/options'
import { PET_DB_RULES } from '@/lib/pets/rules'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { DB_RULES } from '@/lib/verification/rules'
import { signPetPhotos } from './pet-photos'
import { dbErrorKey } from './pet-errors'
import { oneOf, zoneOf } from './pet-rows'
import { isUuid } from './pets'

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
