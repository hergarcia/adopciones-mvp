'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { followUpAnsweredEvent } from '@/lib/analytics/follow-up-events'
import { trackAll } from '@/lib/analytics/track'
import {
  MY_APPLICATIONS_PATH,
  myApplicationPath,
  publisherApplicationPath,
} from '@/lib/applications/paths'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import { followUpOutcome } from '@/lib/follow-ups/outcomes'
import { formText } from '@/lib/forms/form-data'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { preparedPhotoFiles } from '@/lib/pets/prepared-photo-files'
import { followUpAnswerSchema, followUpPhotoSchema } from '@/lib/schemas/follow-up'
import {
  answerFollowUp as answerFollowUpRecord,
  deleteFollowUpPhotoObjects,
  followUpPhotoRowExists,
  purgeFollowUpPhotos,
  stageFollowUpPhoto,
  uploadFollowUpPhotoFiles,
} from '@/lib/supabase/queries/follow-up-records'
import { getSessionUser } from '@/lib/supabase/queries/session'
import type { ActionResult } from './result'

const SESSION = 'follow_ups.errors.session'
const FAILED = 'follow_ups.errors.failed'
const PHOTO_INVALID = 'follow_ups.errors.photo_invalid'
const UPLOAD_FAILED = 'follow_ups.errors.photo_upload_failed'

const PHOTO_FIELDS = ['applicationId', 'photoId', 'width', 'height', 'thumbhash'] as const

// Una foto del seguimiento, ya preparada, sola (research R6): la base la anota en espera —solo si es
// quien adoptó y el pedido sigue abierto— y después el servicio sube sus tres objetos. Sin la
// compuerta del teléfono verificado (FR-012). El mismo id otra vez es un reintento.
export async function uploadFollowUpPhoto(
  form: FormData,
): Promise<ActionResult<{ photoId: string }>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  try {
    const fields = Object.fromEntries(PHOTO_FIELDS.map((key) => [key, formText(form, key)]))
    const parsed = followUpPhotoSchema.safeParse(fields)
    const files = await preparedPhotoFiles(form)
    if (!parsed.success || files === null) return { ok: false, error: PHOTO_INVALID }

    const { applicationId, photoId, width, height, thumbhash } = parsed.data
    const staged = await stageFollowUpPhoto({
      adopterId: user.id,
      applicationId,
      photoId,
      width,
      height,
      thumbhash,
    })
    if (staged === null) return { ok: false, error: UPLOAD_FAILED }
    const result = followUpOutcome(staged.outcome)
    if (!result.ok) return result
    if (staged.followUpId === null) return { ok: false, error: UPLOAD_FAILED }

    const uploaded = await uploadFollowUpPhotoFiles(staged.followUpId, photoId, files)
    // Si la cuenta se borró en el medio, la fila ya no está y la cola de purga pudo haber pasado
    // antes de la subida: lo subido no puede quedar huérfano (como `uploadPetPhoto`).
    if (!uploaded.ok || !(await followUpPhotoRowExists(photoId))) {
      if (uploaded.ok) await deleteFollowUpPhotoObjects(staged.followUpId, photoId)
      return { ok: false, error: UPLOAD_FAILED }
    }
    return { ok: true, data: { photoId } }
  } catch {
    return { ok: false, error: UPLOAD_FAILED }
  }
}

// «Mandar» (US2): las fotos ya subidas, en orden, y el texto. «Ya estaba» —el doble toque, otra
// pestaña, el reintento que había llegado— vuelve como el primero, sin volver a medir ni a mandar
// (FR-013). El aviso a quien lo dio lo escribió la base en la misma transacción.
export async function answerFollowUp(input: unknown): Promise<ActionResult<null>> {
  const parsed = followUpAnswerSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'follow_ups.errors.invalid' }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  try {
    const record = await answerFollowUpRecord(user.id, parsed.data)
    if (record === null) return { ok: false, error: FAILED }
    const result = followUpOutcome(record.outcome)
    if (!result.ok) return result
    if (record.outcome === 'answered' && record.requestedAt !== null) {
      await trackAll([
        followUpAnsweredEvent({
          requestedAt: record.requestedAt,
          photoCount: record.photoCount,
          hasText: record.hasText,
          now: new Date(),
        }),
      ])
      await drainApplicationNotices()
      after(purgeFollowUpPhotos)
      revalidateFollowUp(parsed.data.applicationId)
    }
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: FAILED }
  }
}

function revalidateFollowUp(applicationId: string) {
  revalidatePath(myApplicationPath(applicationId))
  revalidatePath(MY_APPLICATIONS_PATH)
  revalidatePath(publisherApplicationPath(applicationId))
  revalidatePath(MY_PETS_PATH, 'layout')
}
