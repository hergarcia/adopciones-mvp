// Animales a la vista propios de la corrida (historia #57): publicados directo con permisos de
// servicio, con fotos de verdad en Storage y fechas en una ventana del año 2999 propia de la
// corrida, así quedan primeros en el listado y no se mezclan con los de otra (research R14).
import { expect } from '@playwright/test'
import sharp from 'sharp'
import { levelOneOwner, service } from './pet-owner'

const THUMBHASH = 'YJqGPQw7sFlslqhFafSE+Q6oJ1h2iHB2Rw'
const SIDES = { thumb: 400, card: 800, full: 1600 } as const

export type RunPet = {
  name: string
  species: 'dog' | 'cat'
  sex?: 'male' | 'female'
  size?: 'small' | 'medium' | 'large'
  ageValue?: number
  ageUnit?: 'months' | 'years'
  department?: string
  locality?: string
  isNeutered?: boolean
}

export type Published = RunPet & { code: string }

/**
 * Una foto vertical 4:5 en los tres tamaños que guarda el sitio: de un color, o con grano, que pesa
 * como la de un teléfono de 12 MP ya procesada (unos 380 KB el `full`, como mide la prueba de
 * rendimiento de publicar).
 */
async function photoFiles(width: number, height: number, hue: number, grain: boolean) {
  const base = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: hue, g: 120, b: 255 - hue },
      ...(grain ? { noise: { type: 'gaussian' as const, mean: 128, sigma: 10 } } : {}),
    },
  }).png()
  const png = await base.toBuffer()
  return Promise.all(
    Object.entries(SIDES).map(async ([size, side]) => {
      const file = await sharp(png)
        .resize({ width: side, height: side, fit: 'inside' })
        .webp({ quality: 80 })
        .toBuffer()
      return [size, file] as const
    }),
  )
}

async function uploadPhoto(ownerId: string, photoId: string, photo: Photo) {
  const bucket = service().storage.from('pet-photos')
  const hue = Math.floor(Math.random() * 255)
  for (const [size, file] of await photoFiles(photo.width, photo.height, hue, photo.grain)) {
    // oxlint-disable-next-line no-await-in-loop -- tres archivos, en orden
    const uploaded = await bucket.upload(`${ownerId}/${photoId}/${size}.webp`, file, {
      contentType: 'image/webp',
      upsert: true,
    })
    expect(uploaded.error).toBeNull()
  }
}

// Publicados del más viejo al más nuevo, un minuto aparte: el último de la lista queda primero.
type Photo = { width: number; height: number; grain: boolean }

export async function publishForRun(
  pets: RunPet[],
  options: { photo?: Partial<Photo> } = {},
): Promise<{ owner: { id: string; email: string }; pets: Published[] }> {
  const owner = await levelOneOwner()
  const db = service()
  const start = Date.UTC(2999, 0, 1) + Math.floor(Math.random() * 5 * 365 * 24 * 60) * 60_000
  const photo: Photo = { width: 1280, height: 1600, grain: false, ...options.photo }
  const { width, height } = photo
  const published: Published[] = []
  for (const [index, pet] of pets.entries()) {
    // oxlint-disable-next-line no-await-in-loop -- en orden: la fecha de cada uno depende del índice
    const { data, error } = await db
      .from('pets')
      .insert({
        owner_id: owner.id,
        attempt_id: crypto.randomUUID(),
        code: '0000000000',
        name: pet.name,
        species: pet.species,
        sex: pet.sex ?? 'female',
        age_value: pet.ageValue ?? 2,
        age_unit: pet.ageUnit ?? 'years',
        age_as_of: new Date().toISOString().slice(0, 10),
        size: pet.size ?? 'medium',
        is_neutered: pet.isNeutered ?? true,
        vaccines: 'up_to_date',
        has_chip: false,
        department: pet.department ?? 'UY-MO',
        locality: pet.locality ?? 'Pocitos',
        published_at: new Date(start + index * 60_000).toISOString(),
      })
      .select('id, code')
      .single()
    expect(error).toBeNull()
    const photoId = crypto.randomUUID()
    // oxlint-disable-next-line no-await-in-loop
    await uploadPhoto(owner.id, photoId, photo)
    // oxlint-disable-next-line no-await-in-loop
    const row = await db.from('pet_photos').insert({
      id: photoId,
      owner_id: owner.id,
      pet_id: data?.id,
      position: 0,
      width,
      height,
      thumbhash: THUMBHASH,
    })
    expect(row.error).toBeNull()
    published.push({ ...pet, code: data?.code ?? '' })
  }
  return { owner, pets: published }
}

// Borra la rescatista de la corrida, y con ella sus animales: los de 2999 quedarían primeros en el
// listado de la base local para siempre. Las fotos se van con la carpeta.
export async function removeRunOwner(ownerId: string) {
  const db = service()
  const bucket = db.storage.from('pet-photos')
  const { data: folders } = await bucket.list(ownerId)
  const files = await Promise.all(
    (folders ?? []).map(async (folder) => {
      const { data } = await bucket.list(`${ownerId}/${folder.name}`)
      return (data ?? []).map((file) => `${ownerId}/${folder.name}/${file.name}`)
    }),
  )
  if (files.flat().length > 0) await bucket.remove(files.flat())
  await db.auth.admin.deleteUser(ownerId)
}
