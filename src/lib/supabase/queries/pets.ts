import { ageOn, uruguayDay, type StoredAge } from '@/lib/pets/age'
import { GOOD_WITH, SEXES, SIZES, SPECIES, VACCINES, isOneOf } from '@/lib/pets/options'
import type { SameSpeciesPet } from '@/lib/pets/publish-steps'
import type { Pet, PetSummary, Zone } from '@/lib/pets/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { isDepartmentCode } from '@/lib/zones/departments'
import { signPetPhotos, type StoredPhoto } from './pet-photos'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID.test(value)
}

type PhotoRow = {
  id: string
  owner_id: string
  width: number
  height: number
  thumbhash: string
  position: number | null
}

function storedPhoto(row: PhotoRow): StoredPhoto {
  return {
    id: row.id,
    ownerId: row.owner_id,
    width: row.width,
    height: row.height,
    thumbhash: row.thumbhash,
  }
}

// Los checks de la migración ya garantizan los valores; la guarda convierte esa garantía en algo
// que el compilador ve, sin castear.
function oneOf<T extends string>(options: readonly T[], value: string, what: string): T {
  if (!isOneOf(options, value)) throw new Error(`${what} fuera de la lista: ${value}`)
  return value
}

function zoneOf(row: { department: string; locality: string }): Zone {
  if (!isDepartmentCode(row.department))
    throw new Error(`departamento fuera de la lista: ${row.department}`)
  return { department: row.department, locality: row.locality }
}

const SUMMARY =
  'id, name, species, sex, department, locality, is_urgent, pet_photos (id, owner_id, width, height, thumbhash, position)'

// Las de la sesión, de la más nueva a la más vieja (FR-026). La RLS deja ver solo las propias. Si
// la base no responde, lanza: la falla se ve en el `error.tsx` y no se confunde con no tener
// animales.
export async function listMyPets(): Promise<PetSummary[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('pets')
    .select(SUMMARY)
    .eq('pet_photos.position', 0)
    .order('published_at', { ascending: false })
  if (error) throw new Error('No se pudieron traer los animales', { cause: error })

  const covers = data.flatMap((row) => row.pet_photos.slice(0, 1))
  const signed = await signPetPhotos(covers.map(storedPhoto))
  return data.flatMap((row) => {
    const cover = signed.get(row.pet_photos[0]?.id ?? '')
    if (cover === undefined) return []
    return [
      {
        id: row.id,
        name: row.name,
        species: oneOf(SPECIES, row.species, 'especie'),
        sex: oneOf(SEXES, row.sex, 'sexo'),
        zone: zoneOf(row),
        isUrgent: row.is_urgent,
        status: 'available' as const,
        cover,
      },
    ]
  })
}

const FULL =
  'id, name, species, sex, age_value, age_unit, age_as_of, size, is_neutered, vaccines, has_chip, good_with_kids, good_with_dogs, good_with_cats, description, department, locality, is_urgent, published_at, pet_photos (id, owner_id, width, height, thumbhash, position)'

// Un id mal formado es «no existe», no un error de la base. Uno ajeno también: la RLS no lo deja
// ver, y la pantalla dice lo mismo que si no existiera (FR-005).
export async function getMyPet(id: string, now = new Date()): Promise<Pet | null> {
  if (!isUuid(id)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('pets')
    .select(FULL)
    .eq('id', id)
    .not('pet_photos.position', 'is', null)
    .maybeSingle()
  if (error) throw new Error('No se pudo traer el animal', { cause: error })
  if (data === null) return null

  const photos = [...data.pet_photos].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const signed = await signPetPhotos(photos.map(storedPhoto))
  const ageBase: StoredAge = {
    value: data.age_value,
    unit: data.age_unit === 'years' ? 'years' : 'months',
    asOf: data.age_as_of,
  }
  return {
    id: data.id,
    name: data.name,
    species: oneOf(SPECIES, data.species, 'especie'),
    sex: oneOf(SEXES, data.sex, 'sexo'),
    age: ageOn(ageBase, uruguayDay(now)),
    ageBase,
    size: oneOf(SIZES, data.size, 'tamaño'),
    isNeutered: data.is_neutered,
    vaccines: oneOf(VACCINES, data.vaccines, 'vacunas'),
    hasChip: data.has_chip,
    goodWithKids: oneOf(GOOD_WITH, data.good_with_kids, 'convive'),
    goodWithDogs: oneOf(GOOD_WITH, data.good_with_dogs, 'convive'),
    goodWithCats: oneOf(GOOD_WITH, data.good_with_cats, 'convive'),
    description: data.description,
    zone: zoneOf(data),
    isUrgent: data.is_urgent,
    publishedOn: uruguayDay(new Date(data.published_at)),
    photos: photos.flatMap((photo) => {
      const found = signed.get(photo.id)
      return found === undefined ? [] : [found]
    }),
  }
}

/** Lo guardado de un animal propio, para resolver la edad al guardar. Nulo si no es de la sesión. */
export async function getMyPetAge(
  id: string,
): Promise<{ stored: StoredAge; publishedOn: string } | null> {
  if (!isUuid(id)) return null
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('pets')
    .select('age_value, age_unit, age_as_of, published_at')
    .eq('id', id)
    .maybeSingle()
  if (data === null) return null
  return {
    stored: {
      value: data.age_value,
      unit: data.age_unit === 'years' ? 'years' : 'months',
      asOf: data.age_as_of,
    },
    publishedOn: uruguayDay(new Date(data.published_at)),
  }
}

export async function listMyPetNames(species: string): Promise<SameSpeciesPet[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('pets')
    .select('name, sex, attempt_id')
    .eq('species', species)
  if (error) throw new Error('No se pudieron traer los nombres', { cause: error })
  return data.map((row) => ({
    name: row.name,
    sex: oneOf(SEXES, row.sex, 'sexo'),
    attemptId: row.attempt_id,
  }))
}

export async function isAttemptPublished(attemptId: string): Promise<boolean> {
  if (!isUuid(attemptId)) return false
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('pets')
    .select('id')
    .eq('attempt_id', attemptId)
    .maybeSingle()
  if (error) throw new Error('No se pudo leer el intento', { cause: error })
  return data !== null
}

export async function countMyPets(): Promise<number> {
  const supabase = await createServerSupabase()
  const { count } = await supabase.from('pets').select('id', { count: 'exact', head: true })
  return count ?? 0
}
