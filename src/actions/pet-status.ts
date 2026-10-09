'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { getFormatter, getTranslations } from 'next-intl/server'
import { adoptionEndedEvent } from '@/lib/analytics/adoption-events'
import { deletedEvent, statusChangeEvent } from '@/lib/analytics/pet-events'
import { trackAll } from '@/lib/analytics/track'
import { INBOX_PATH, MY_APPLICATIONS_PATH } from '@/lib/applications/paths'
import { trackApplicationClosures } from '@/lib/applications/track-closures'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import { LISTING_PATH, MY_PETS_PATH, myPetPath, petPath } from '@/lib/pets/paths'
import type { PetState } from '@/lib/pets/types'
import { petDeletionSchema, petStatusChangeSchema } from '@/lib/schemas/pet-status'
import { purgeFollowUpPhotos } from '@/lib/supabase/queries/follow-up-records'
import { deletePetPhotoObjects } from '@/lib/supabase/queries/pet-photos'
import {
  changePetStatusRecord,
  deletePetRecord,
  petPhotoIds,
} from '@/lib/supabase/queries/pet-status'
import { getSessionUser } from '@/lib/supabase/queries/session'
import type { ActionResult } from './result'

/** Cómo quedó el animal: lo que la pantalla necesita para dibujarlo sin esperar a recargar. */
export type PetStatusView = { state: PetState; expiresAt: string | null }

export type PetStatusDone = PetStatusView & {
  /** El aviso corto de lo que pasó, ya traducido: «Tobi está en proceso». */
  notice: string
}

const SESSION = 'pets.status.errors.session'
const FAILED = 'pets.status.errors.failed'
const NOT_FOUND = 'pets.status.errors.not_found'

function revalidateAll(petId: string, code: string) {
  revalidatePath(MY_PETS_PATH)
  revalidatePath(myPetPath(petId))
  revalidatePath(LISTING_PATH)
  revalidatePath(petPath(code))
}

// Una acción de «Mis animales» (contracts §Server Actions). «Ya estaba» es un éxito: el animal está
// como se pidió. Los rechazos llevan el estado de ahora en `detail`, así la pantalla muestra cómo
// quedó en vez del cambio que no se aplicó (FR-007).
export async function changePetStatus(
  input: unknown,
): Promise<ActionResult<PetStatusDone, PetStatusView>> {
  const parsed = petStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const { petId, action } = parsed.data
  try {
    const record = await changePetStatusRecord({ ownerId: user.id, petId, action })
    if (record.outcome === 'not_found') return { ok: false, error: NOT_FOUND }
    const view = { state: record.state, expiresAt: record.expiresAt?.toISOString() ?? null }
    if (record.outcome !== 'done' && record.outcome !== 'already')
      return { ok: false, error: `pets.status.errors.${record.outcome}`, detail: view }

    const [t, format] = await Promise.all([getTranslations('pets.status.done'), getFormatter()])
    const date = record.expiresAt
      ? format.dateTime(record.expiresAt, { day: 'numeric', month: 'long' })
      : ''
    const notice = t(action, { name: record.name, sex: record.sex, date })
    if (record.outcome === 'done') {
      const now = new Date()
      await trackAll([
        statusChangeEvent({ ...record, to: record.state, action, now, via: 'my_pets' }),
        ...(record.endedMarkedAt === null ? [] : [adoptionEndedEvent(record.endedMarkedAt, now)]),
      ])
      revalidateAll(petId, record.code)
      // Terminó una adopción (historia #67, R6): las dos puntas dejan de mostrar el contacto.
      if (record.endedMarkedAt !== null) {
        revalidatePath(INBOX_PATH, 'layout')
        revalidatePath(MY_APPLICATIONS_PATH, 'layout')
      }
    }
    return { ok: true, data: { ...view, notice } }
  } catch {
    return { ok: false, error: FAILED }
  }
}

// Borrar para siempre (FR-005). Los objetos de Storage primero: si eso falla, la fila sigue y se
// reintenta, en vez de dejar fotos que nadie puede volver a alcanzar.
export async function deletePet(input: unknown): Promise<ActionResult<null>> {
  const parsed = petDeletionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const { petId } = parsed.data
  try {
    const photos = await petPhotoIds(user.id, petId)
    const removed = await deletePetPhotoObjects(photos.map((id) => ({ id, ownerId: user.id })))
    if (!removed.ok) return { ok: false, error: FAILED }
    const since = new Date()
    const record = await deletePetRecord(user.id, petId)
    if (record.outcome === 'not_found') return { ok: false, error: NOT_FOUND }
    await trackAll([deletedEvent(record.from)])
    // Borrado, el animal ya no está en la solicitud: se pregunta por quien lo publicó.
    await trackApplicationClosures(since, { userId: user.id })
    await drainApplicationNotices()
    // La cascada dejó en la cola las fotos del seguimiento de su adopción (historia #69, R7).
    after(purgeFollowUpPhotos)
    revalidateAll(petId, record.code)
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: FAILED }
  }
}
