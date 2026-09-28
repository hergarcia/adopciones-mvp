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

/** Una foto vertical 4:5 de un color, en los tres tamaños que guarda el sitio. */
async function photoFiles(width: number, height: number, hue: number) {
  const base = sharp({
    create: { width, height, channels: 3, background: { r: hue, g: 120, b: 255 - hue } },
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

async function uploadPhoto(ownerId: string, photoId: string, width: number, height: number) {
  const bucket = service().storage.from('pet-photos')
  for (const [size, file] of await photoFiles(width, height, Math.floor(Math.random() * 255))) {
    // oxlint-disable-next-line no-await-in-loop -- tres archivos, en orden
    const uploaded = await bucket.upload(`${ownerId}/${photoId}/${size}.webp`, file, {
      contentType: 'image/webp',
      upsert: true,
    })
    expect(uploaded.error).toBeNull()
  }
}

// Publicados del más viejo al más nuevo, un minuto aparte: el último de la lista queda primero.
export async function publishForRun(
  pets: RunPet[],
  options: { photo?: { width: number; height: number } } = {},
): Promise<{ owner: { id: string; email: string }; pets: Published[] }> {
  const owner = await levelOneOwner()
  const db = service()
  const start = Date.UTC(2999, 0, 1) + Math.floor(Math.random() * 300) * 86_400_000
  const { width, height } = options.photo ?? { width: 1280, height: 1600 }
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
    await uploadPhoto(owner.id, photoId, width, height)
    // oxlint-disable-next-line no-await-in-loop
    const photo = await db.from('pet_photos').insert({
      id: photoId,
      owner_id: owner.id,
      pet_id: data?.id,
      position: 0,
      width,
      height,
      thumbhash: THUMBHASH,
    })
    expect(photo.error).toBeNull()
    published.push({ ...pet, code: data?.code ?? '' })
  }
  return { owner, pets: published }
}
