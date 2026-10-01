import { ageOn, uruguayDay, type StoredAge } from '@/lib/pets/age'
import { GOOD_WITH, SEXES, SIZES, SPECIES, VACCINES } from '@/lib/pets/options'
import type { SameSpeciesPet } from '@/lib/pets/publish-steps'
import { lifecycleOf } from '@/lib/pets/lifecycle'
import {
  PET_STATUSES,
  TAKEDOWN_REASONS,
  type Pet,
  type PetState,
  type PetSummary,
  type Takedown,
} from '@/lib/pets/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { signPetPhotos, type StoredPhoto } from './pet-photos'
import { oneOf, storedAgeOf, zoneOf } from './pet-rows'

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

const SUMMARY =
  'id, code, name, species, sex, department, locality, is_urgent, status, expires_at, taken_down_at, takedown_reason, takedown_note, pet_photos (id, owner_id, width, height, thumbhash, position)'

type LifecycleRow = {
  status: string
  expires_at: string | null
  taken_down_at: string | null
}

const dateOrNull = (value: string | null) => (value === null ? null : new Date(value))

export function stateOf(row: LifecycleRow, now: Date): PetState {
  return lifecycleOf(
    {
      status: oneOf(PET_STATUSES, row.status, 'estado'),
      expiresAt: dateOrNull(row.expires_at),
      takenDownAt: dateOrNull(row.taken_down_at),
    },
    now,
  )
}

export function takedownOf(row: {
  takedown_reason: string | null
  takedown_note: string | null
}): Takedown | null {
  if (row.takedown_reason === null) return null
  return { reason: oneOf(TAKEDOWN_REASONS, row.takedown_reason, 'motivo'), note: row.takedown_note }
}

type SummaryRow = LifecycleRow & {
  id: string
  code: string
  name: string
  species: string
  sex: string
  department: string
  locality: string
  is_urgent: boolean
  takedown_reason: string | null
  takedown_note: string | null
  pet_photos: PhotoRow[]
}

async function summariesOf(rows: SummaryRow[], now: Date): Promise<PetSummary[]> {
  const covers = rows.flatMap((row) => row.pet_photos.slice(0, 1))
  const signed = await signPetPhotos(covers.map(storedPhoto))
  return rows.flatMap((row) => {
    const cover = signed.get(row.pet_photos[0]?.id ?? '')
    if (cover === undefined) return []
    return [
      {
        id: row.id,
        code: row.code,
        name: row.name,
        species: oneOf(SPECIES, row.species, 'especie'),
        sex: oneOf(SEXES, row.sex, 'sexo'),
        zone: zoneOf(row),
        isUrgent: row.is_urgent,
        state: stateOf(row, now),
        expiresAt: dateOrNull(row.expires_at),
        takedown: takedownOf(row),
        cover,
      },
    ]
  })
}

// Las de la sesión, de la más nueva a la más vieja (FR-026), en cualquier estado: una vencida queda
// en su lugar de siempre (spec #59). La RLS deja ver solo las propias. Si la base no responde, lanza:
// la falla se ve en el `error.tsx` y no se confunde con no tener animales.
export async function listMyPets(now = new Date()): Promise<PetSummary[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('pets')
    .select(SUMMARY)
    .eq('pet_photos.position', 0)
    .order('published_at', { ascending: false })
  if (error) throw new Error('No se pudieron traer los animales', { cause: error })
  return summariesOf(data, now)
}

/** Un animal propio como en la lista, para su pantalla en «Mis animales». Nulo si no es suyo. */
export async function getMyPetSummary(id: string, now = new Date()): Promise<PetSummary | null> {
  if (!isUuid(id)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('pets')
    .select(SUMMARY)
    .eq('id', id)
    .eq('pet_photos.position', 0)
    .maybeSingle()
  if (error) throw new Error('No se pudo traer el animal', { cause: error })
  if (data === null) return null
  return (await summariesOf([data], now))[0] ?? null
}

const FULL =
  'id, name, species, sex, age_value, age_unit, age_as_of, size, is_neutered, vaccines, has_chip, good_with_kids, good_with_dogs, good_with_cats, description, department, locality, is_urgent, published_at, status, expires_at, taken_down_at, pet_photos (id, owner_id, width, height, thumbhash, position)'

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
  const ageBase = storedAgeOf(data)
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
    state: stateOf(data, now),
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
  const { data, error } = await supabase
    .from('pets')
    .select('age_value, age_unit, age_as_of, published_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('No se pudo traer la edad del animal', { cause: error })
  if (data === null) return null
  return {
    stored: storedAgeOf(data),
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
