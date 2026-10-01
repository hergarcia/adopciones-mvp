import { thumbHashDataUrl } from '@/lib/images/thumbhash-data-url'
import { PET_DB_RULES, SIGNED_URL_TTL_SECONDS } from '@/lib/pets/rules'
import type { PetPhotoData } from '@/lib/pets/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { DB_RULES } from '@/lib/verification/rules'
import { dbErrorKey } from './pet-errors'

export const PET_PHOTOS_BUCKET = 'pet-photos'
export const PHOTO_SIZES = ['thumb', 'card', 'full'] as const
export type PhotoSize = (typeof PHOTO_SIZES)[number]

/** Una foto tal como está en la base, antes de firmar sus URLs. */
export type StoredPhoto = {
  id: string
  ownerId: string
  width: number
  height: number
  thumbhash: string
}

// El Storage rechaza entero un pedido de borrado de más de 1000 objetos, y lista de a páginas: sin
// partir, una cuenta con más de 333 fotos no se podría borrar nunca y la purga no se vaciaría.
const STORAGE_BATCH = 1000

function inBatches<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  )
}

async function removeObjects(paths: string[]): Promise<boolean> {
  const bucket = createServiceSupabase().storage.from(PET_PHOTOS_BUCKET)
  for (const batch of inBatches(paths, STORAGE_BATCH)) {
    // De a un pedido: el límite es por pedido, y en paralelo serían muchos a la vez.
    // oxlint-disable-next-line no-await-in-loop
    const removed = await bucket.remove(batch)
    if (removed.error) return false
  }
  return true
}

async function listAll(prefix: string): Promise<string[] | null> {
  const bucket = createServiceSupabase().storage.from(PET_PHOTOS_BUCKET)
  const names: string[] = []
  for (let offset = 0; ; offset += STORAGE_BATCH) {
    // Cada página depende de que la anterior haya llegado llena.
    // oxlint-disable-next-line no-await-in-loop
    const page = await bucket.list(prefix, { limit: STORAGE_BATCH, offset })
    if (page.error) return null
    names.push(...page.data.map((entry) => entry.name))
    if (page.data.length < STORAGE_BATCH) return names
  }
}

export function objectPath(ownerId: string, photoId: string, size: PhotoSize): string {
  return `${ownerId}/${photoId}/${size}.webp`
}

function objectPaths(photo: { id: string; ownerId: string }): string[] {
  return PHOTO_SIZES.map((size) => objectPath(photo.ownerId, photo.id, size))
}

// Con permisos de servicio y la dueña como parámetro: la función de la base comprueba el nivel 1
// con el candado de la cuenta, así que un cambio de número a mitad de camino la frena.
export async function stagePetPhoto(input: {
  ownerId: string
  photoId: string
  width: number
  height: number
  thumbhash: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await createServiceSupabase().rpc('stage_pet_photo', {
    p_owner: input.ownerId,
    p_photo_id: input.photoId,
    p_width: input.width,
    p_height: input.height,
    p_thumbhash: input.thumbhash,
    p_pending_ttl: DB_RULES.p_pending_ttl,
  })
  return error === null ? { ok: true } : { ok: false, error: dbErrorKey(error) }
}

// Sube el servicio y no la sesión: el bucket no tiene policy de escritura, así no hay objetos sin
// fila ni subidas que se salteen el nivel 1 (research R1). `upsert` hace idempotente el reintento.
export async function uploadPetPhotoFiles(
  ownerId: string,
  photoId: string,
  files: Record<PhotoSize, File>,
): Promise<{ ok: boolean }> {
  const bucket = createServiceSupabase().storage.from(PET_PHOTOS_BUCKET)
  const results = await Promise.all(
    PHOTO_SIZES.map((size) =>
      bucket.upload(objectPath(ownerId, photoId, size), files[size], {
        contentType: 'image/webp',
        upsert: true,
      }),
    ),
  )
  return { ok: results.every((result) => result.error === null) }
}

export async function petPhotoRowExists(photoId: string): Promise<boolean> {
  const { data } = await createServiceSupabase()
    .from('pet_photos')
    .select('id')
    .eq('id', photoId)
    .maybeSingle()
  return data !== null
}

// Una sola llamada por pantalla, con la sesión de la dueña: la policy de lectura le deja firmar
// solo su carpeta. Una hora cubre una sesión de trabajo (research R4).
export async function signPetPhotos(photos: StoredPhoto[]): Promise<Map<string, PetPhotoData>> {
  if (photos.length === 0) return new Map()
  const supabase = await createServerSupabase()
  const paths = photos.flatMap(objectPaths)
  const { data, error } = await supabase.storage
    .from(PET_PHOTOS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)
  if (error) throw new Error('No se pudieron firmar las fotos', { cause: error })

  const byPath = new Map(data.map((entry) => [entry.path, entry.signedUrl ?? '']))
  return new Map(
    photos.map((photo) => {
      const url = (size: PhotoSize) => byPath.get(objectPath(photo.ownerId, photo.id, size)) ?? ''
      return [
        photo.id,
        {
          id: photo.id,
          width: photo.width,
          height: photo.height,
          placeholder: thumbHashDataUrl(photo.thumbhash),
          urls: { thumb: url('thumb'), card: url('card'), full: url('full') },
        },
      ]
    }),
  )
}

/** Solo los objetos: las filas de una publicación que se borra caen con ella (historia #59). */
export async function deletePetPhotoObjects(
  photos: { id: string; ownerId: string }[],
): Promise<{ ok: boolean }> {
  return { ok: await removeObjects(photos.flatMap(objectPaths)) }
}

// Primero los objetos y después las filas: si borrar los objetos falla, la fila sigue y la próxima
// purga lo reintenta. Solo borra filas que siguen sin publicación.
export async function deletePetPhotos(
  photos: { id: string; ownerId: string }[],
): Promise<{ ok: boolean }> {
  if (photos.length === 0) return { ok: true }
  if (!(await deletePetPhotoObjects(photos)).ok) return { ok: false }
  const { error } = await createServiceSupabase().rpc('delete_pet_photo_rows', {
    p_ids: photos.map((photo) => photo.id),
  })
  return { ok: error === null }
}

async function listOwnerObjects(ownerId: string): Promise<string[] | null> {
  const folders = await listAll(ownerId)
  if (folders === null) return null
  const files = await Promise.all(folders.map((folder) => listAll(`${ownerId}/${folder}`)))
  if (files.some((listed) => listed === null)) return null
  return files.flatMap((listed, index) =>
    (listed ?? []).map((file) => `${ownerId}/${folders[index]}/${file}`),
  )
}

// Dentro del borrado de la cuenta, con permisos de servicio. Lista la carpeta entera y no las
// filas, así encuentra también un objeto que haya quedado sin fila, y vuelve a listar para
// comprobar que no quedó nada: borrada la persona, nadie puede volver a alcanzar esa carpeta
// (FR-027, SC-007).
export async function deletePetPhotosAsService(ownerId: string): Promise<{ ok: boolean }> {
  const paths = await listOwnerObjects(ownerId)
  if (paths === null) return { ok: false }
  if (!(await removeObjects(paths))) return { ok: false }
  const left = await listOwnerObjects(ownerId)
  return { ok: left !== null && left.length === 0 }
}

// Sin Cron hasta la beta: corre dentro de las acciones (research R13, KL de la purga).
export async function purgePetPhotos(): Promise<void> {
  const { data, error } = await createServiceSupabase().rpc('purge_pet_photos', {
    p_staged_ttl: PET_DB_RULES.p_staged_ttl,
  })
  if (error || data.length === 0) return
  await deletePetPhotos(data.map((row) => ({ id: row.id, ownerId: row.owner_id })))
}
