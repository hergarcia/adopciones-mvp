'use server'

import { after } from 'next/server'
import { checkVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { formText } from '@/lib/forms/form-data'
import { petGatePath, petGateRequest, petScreenPath } from '@/lib/pets/paths'
import { MAX_PHOTO_FILE_BYTES, MAX_PREPARED_PHOTO_BYTES } from '@/lib/pets/rules'
import {
  deletePetPhotos,
  petPhotoRowExists,
  purgePetPhotos,
  stagePetPhoto,
  uploadPetPhotoFiles,
} from '@/lib/supabase/queries/pet-photos'
import { isUuid } from '@/lib/supabase/queries/pets'
import { getSessionUser } from '@/lib/supabase/queries/session'
import type { PetActionDetail } from './pets'
import type { ActionResult } from './result'

const SESSION = 'pets.errors.session'
const NEEDS_VERIFICATION = 'pets.errors.needs_verification'

const PHOTO_ID = 'photoId'
const SIZES = ['thumb', 'card', 'full'] as const
const THUMBHASH = /^[A-Za-z0-9+/]{1,62}={0,2}$/u
const WEBP_MAGIC = { riff: 'RIFF', webp: 'WEBP' }

// La firma del archivo y no solo el tipo que declara el navegador: lo que sube el servicio tiene
// que ser de verdad un WebP (research R1).
async function isWebp(file: File): Promise<boolean> {
  const head = new TextDecoder().decode(await file.slice(0, 12).arrayBuffer())
  return head.slice(0, 4) === WEBP_MAGIC.riff && head.slice(8, 12) === WEBP_MAGIC.webp
}

async function preparedFiles(form: FormData): Promise<Record<(typeof SIZES)[number], File> | null> {
  const files = SIZES.map((size) => form.get(size))
  if (!files.every((file) => file instanceof File)) return null
  const total = files.reduce((sum, file) => sum + file.size, 0)
  const valid = files.every(
    (file) => file.type === 'image/webp' && file.size > 0 && file.size <= MAX_PHOTO_FILE_BYTES,
  )
  if (!valid || total > MAX_PREPARED_PHOTO_BYTES) return null
  if (!(await Promise.all(files.map(isWebp))).every(Boolean)) return null
  return { thumb: files[0], card: files[1], full: files[2] }
}

function side(form: FormData, key: string): number | null {
  const value = Number(formText(form, key))
  return Number.isInteger(value) && value > 0 && value <= 32767 ? value : null
}

// Una foto ya preparada, sola: anota la fila en espera (con el nivel 1 comprobado en la base) y
// después sube los tres objetos con permisos de servicio. Idempotente: el mismo id otra vez no crea
// nada nuevo, y un reintento vuelve a mandar solo esta.
export async function uploadPetPhoto(
  form: FormData,
): Promise<ActionResult<{ photoId: string }, PetActionDetail>> {
  after(purgePetPhotos)
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  try {
    const screen = petScreenPath(formText(form, 'returnTo'))
    const gatePath = petGatePath(screen)
    if (!(await checkVerifiedPhone(petGateRequest(screen))).ok) {
      return { ok: false, error: NEEDS_VERIFICATION, detail: { gatePath } }
    }

    const photoId = formText(form, PHOTO_ID)
    const width = side(form, 'width')
    const height = side(form, 'height')
    const thumbhash = formText(form, 'thumbhash')
    const files = await preparedFiles(form)
    if (!isUuid(photoId) || width === null || height === null || files === null) {
      return { ok: false, error: 'pets.errors.photo_invalid' }
    }
    if (!THUMBHASH.test(thumbhash)) return { ok: false, error: 'pets.errors.photo_invalid' }

    const staged = await stagePetPhoto({ ownerId: user.id, photoId, width, height, thumbhash })
    if (!staged.ok) {
      const detail = staged.error === NEEDS_VERIFICATION ? { gatePath } : undefined
      return { ok: false, error: staged.error, detail }
    }

    const uploaded = await uploadPetPhotoFiles(user.id, photoId, files)
    // Si la cuenta se borró en el medio, la fila ya no está: lo que se subió no puede quedar
    // huérfano (research R20).
    if (!uploaded.ok || !(await petPhotoRowExists(photoId))) {
      if (uploaded.ok) await deletePetPhotos([{ id: photoId, ownerId: user.id }])
      return { ok: false, error: 'pets.errors.photo_upload_failed' }
    }
    return { ok: true, data: { photoId } }
  } catch {
    return { ok: false, error: 'pets.errors.photo_upload_failed' }
  }
}
