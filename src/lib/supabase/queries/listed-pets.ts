import { cache } from 'react'
import { ageOn, uruguayDay } from '@/lib/pets/age'
import type { ListingCursor } from '@/lib/pets/listing-cursor'
import type { ListingFilters } from '@/lib/pets/listing-query'
import { GOOD_WITH, SEXES, SIZES, SPECIES, VACCINES } from '@/lib/pets/options'
import { AGE_BANDS, PET_CODE_PATTERN, SIGNED_URL_TTL_SECONDS } from '@/lib/pets/rules'
import type { ListedPet, ListingPage, PublicPetResult, Publisher } from '@/lib/pets/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { AVATARS_BUCKET } from './avatars'
import { PET_PHOTOS_BUCKET, objectPath, signPetPhotos } from './pet-photos'
import { isPhotoJson, oneOf, storedAgeOf, zoneOf } from './pet-rows'

// Lo público sale solo por las tres funciones de la base, con la sesión de quien mira o como
// anónimo: nunca con la clave de servicio (research R1). La firma de las fotos pasa por las
// policies de Storage, que dejan firmar solo lo que está a la vista (R2).

// `[desde, hasta)` en meses, como `int4range` de Postgres; el último tramo no tiene techo.
function ageRanges(bands: ListingFilters['age']): string[] {
  return bands.map((band) => `[${AGE_BANDS[band].from},${AGE_BANDS[band].to ?? ''})`)
}

export async function listListedPets(
  filters: ListingFilters,
  cursor: ListingCursor | null,
  limit: number,
  now = new Date(),
): Promise<ListingPage> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('listed_pets', {
    p_species: filters.species,
    p_sexes: filters.sex,
    p_sizes: filters.size,
    p_age_bands: ageRanges(filters.age),
    p_departments: filters.department,
    p_neutered_only: filters.neutered.length > 0,
    p_after_published: cursor?.publishedAt,
    p_after_code: cursor?.code,
    p_limit: limit,
  })
  if (error) throw new Error('No se pudo traer el listado', { cause: error })

  const signed = await signPetPhotos(
    data.map((row) => ({
      id: row.cover_id,
      ownerId: row.cover_owner,
      width: row.cover_width,
      height: row.cover_height,
      thumbhash: row.cover_thumbhash,
    })),
  )
  const today = uruguayDay(now)
  const pets = data.flatMap((row): ListedPet[] => {
    const cover = signed.get(row.cover_id)
    if (cover === undefined) return []
    return [
      {
        code: row.code,
        name: row.name,
        species: oneOf(SPECIES, row.species, 'especie'),
        sex: oneOf(SEXES, row.sex, 'sexo'),
        age: ageOn(storedAgeOf(row), today),
        zone: zoneOf(row),
        isUrgent: row.is_urgent,
        publishedAt: row.published_at,
        cover,
      },
    ]
  })
  return { pets, total: data[0]?.total ?? 0, signedAt: now.toISOString() }
}

// Un solo archivo, firmado con la sesión de quien pide: null si la policy no lo deja.
async function signFile(bucket: string, path: string | null): Promise<string | null> {
  if (path === null) return null
  const supabase = await createServerSupabase()
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  return data?.signedUrl ?? null
}

// Envuelta en `cache`: `generateMetadata` y la página la piden en el mismo pedido. Un código que no
// cumple el formato es «no existe» sin ir a la base; una falla de la base lanza, y la pantalla de
// error nunca la confunde con «no está publicado» (FR-009).
export const getPublicPet = cache(
  async (code: string, now = new Date()): Promise<PublicPetResult | null> => {
    if (!PET_CODE_PATTERN.test(code)) return null
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.rpc('pet_by_code', { p_code: code })
    if (error) throw new Error('No se pudo traer el animal', { cause: error })
    const row = data[0]
    if (row === undefined) return null
    const visibility = row.visibility === 'listed' ? 'listed' : 'hidden'
    if (visibility === 'hidden' && !row.is_owner) return { visibility, isOwner: false }

    const photos = [row.photos].flat().filter(isPhotoJson)
    const [signed, avatar] = await Promise.all([
      signPetPhotos(photos.map((photo) => ({ ...photo, ownerId: row.owner_folder }))),
      signFile(AVATARS_BUCKET, row.publisher_avatar_path),
    ])
    const publisher: Publisher = {
      name: row.publisher_name ?? '',
      avatar,
      isRescuer: row.publisher_is_rescuer,
      level: row.publisher_level === 1 || row.publisher_level === 2 ? row.publisher_level : null,
    }
    return {
      visibility,
      isOwner: row.is_owner,
      editId: row.is_owner ? row.pet_id : null,
      code: row.code,
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
      publishedOn: uruguayDay(new Date(row.published_at)),
      photos: photos.flatMap((photo) => {
        const found = signed.get(photo.id)
        return found === undefined ? [] : [found]
      }),
      publisher,
      version: row.version,
      signedAt: now.toISOString(),
    }
  },
)

export type ShareCard = {
  name: string
  zone: ReturnType<typeof zoneOf>
  /** La portada `full`, firmada: la ruta de la imagen la baja en el servidor. */
  coverUrl: string
}

/** Lo de la vista previa, o null si el animal no está a la vista o no existe. */
export async function getShareCard(code: string): Promise<ShareCard | null> {
  if (!PET_CODE_PATTERN.test(code)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('pet_share_card', { p_code: code })
  if (error) throw new Error('No se pudo traer la vista previa', { cause: error })
  const row = data[0]
  if (row === undefined) return null
  const coverUrl = await signFile(
    PET_PHOTOS_BUCKET,
    objectPath(row.cover_owner, row.cover_id, 'full'),
  )
  return coverUrl === null ? null : { name: row.name, zone: zoneOf(row), coverUrl }
}
