'use server'

import { after } from 'next/server'
import { checkVerifiedPhone } from '@/lib/auth/require-verified-phone'
import { formText } from '@/lib/forms/form-data'
import { petGatePath, petGateRequest, petScreenPath } from '@/lib/pets/paths'
import { preparedPhotoFiles, THUMBHASH_PATTERN } from '@/lib/pets/prepared-photo-files'
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
    const files = await preparedPhotoFiles(form)
    if (!isUuid(photoId) || width === null || height === null || files === null) {
      return { ok: false, error: 'pets.errors.photo_invalid' }
    }
    if (!THUMBHASH_PATTERN.test(thumbhash)) return { ok: false, error: 'pets.errors.photo_invalid' }

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
