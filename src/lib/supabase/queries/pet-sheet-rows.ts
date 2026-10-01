import { ageOn, uruguayDay } from '@/lib/pets/age'
import { GOOD_WITH, SEXES, SIZES, SPECIES, VACCINES } from '@/lib/pets/options'
import { isPublisherLevel } from '@/lib/pets/publisher-level'
import { SIGNED_URL_TTL_SECONDS } from '@/lib/pets/rules'
import type { Pet, Publisher } from '@/lib/pets/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { AVATARS_BUCKET } from './avatars'
import { signPetPhotos } from './pet-photos'
import { isPhotoJson, oneOf, storedAgeOf, zoneOf } from './pet-rows'

// Lo que comparten la ficha (`pet_by_code`) y la lista de quien administra (`pet_review_queue`): el
// animal entero, sus fotos y quien lo publica, firmadas con la sesión de quien mira para que las
// policies de Storage decidan qué se firma.

/** Un solo archivo, firmado con la sesión de quien pide: null si la policy no lo deja. */
export async function signFile(bucket: string, path: string | null): Promise<string | null> {
  if (path === null) return null
  const supabase = await createServerSupabase()
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  return data?.signedUrl ?? null
}

type SheetRow = {
  name: string
  species: string
  sex: string
  age_value: number
  age_unit: string
  age_as_of: string
  size: string
  is_neutered: boolean
  vaccines: string
  has_chip: boolean
  good_with_kids: string
  good_with_dogs: string
  good_with_cats: string
  description: string | null
  department: string
  locality: string
  is_urgent: boolean
  owner_folder: string
  photos: unknown
  publisher_name: string | null
  publisher_avatar_path: string | null
  publisher_is_rescuer: boolean
  publisher_level: number | null
}

export type PetSheetParts = Omit<Pet, 'id' | 'ageBase' | 'publishedOn' | 'state'> & {
  publisher: Publisher
}

export async function petSheetOf(row: SheetRow, now: Date): Promise<PetSheetParts> {
  const photos = [row.photos].flat().filter(isPhotoJson)
  const [signed, avatar] = await Promise.all([
    signPetPhotos(photos.map((photo) => ({ ...photo, ownerId: row.owner_folder }))),
    signFile(AVATARS_BUCKET, row.publisher_avatar_path),
  ])
  return {
    name: row.name,
    species: oneOf(SPECIES, row.species, 'especie'),
    sex: oneOf(SEXES, row.sex, 'sexo'),
    age: ageOn(storedAgeOf(row), uruguayDay(now)),
    size: oneOf(SIZES, row.size, 'tamaño'),
    isNeutered: row.is_neutered,
    vaccines: oneOf(VACCINES, row.vaccines, 'vacunas'),
    hasChip: row.has_chip,
    goodWithKids: oneOf(GOOD_WITH, row.good_with_kids, 'convive'),
    goodWithDogs: oneOf(GOOD_WITH, row.good_with_dogs, 'convive'),
    goodWithCats: oneOf(GOOD_WITH, row.good_with_cats, 'convive'),
    description: row.description,
    zone: zoneOf(row),
    isUrgent: row.is_urgent,
    photos: photos.flatMap((photo) => {
      const found = signed.get(photo.id)
      return found === undefined ? [] : [found]
    }),
    publisher: {
      name: row.publisher_name ?? '',
      avatar,
      isRescuer: row.publisher_is_rescuer,
      level: isPublisherLevel(row.publisher_level) ? row.publisher_level : null,
    },
  }
}
