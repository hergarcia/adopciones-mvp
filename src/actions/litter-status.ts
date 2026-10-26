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
import { litterPanelPath, litterPath } from '@/lib/litters/paths'
import type { LitterState, YoungState } from '@/lib/litters/types'
import { LISTING_PATH, MY_PETS_PATH } from '@/lib/pets/paths'
import { litterStatusChangeSchema, youngStatusChangeSchema } from '@/lib/schemas/litter-status'
import { petDeletionSchema } from '@/lib/schemas/pet-status'
import { purgeFollowUpPhotos } from '@/lib/supabase/queries/follow-up-records'
import {
  changeLitterStatusRecord,
  changeYoungStatusRecord,
  deleteYoungRecord,
} from '@/lib/supabase/queries/litter-status'
import { deletePetPhotos } from '@/lib/supabase/queries/pet-photos'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { failed, type ActionResult } from './result'

/** Cómo quedó la cría y su camada: lo que la pantalla necesita para dibujarlas (FR-009). */
export type YoungStatusView = { state: YoungState; litterState: LitterState }

export type YoungStatusDone = YoungStatusView & {
  /** El aviso corto, ya traducido: «Cría 2 está en proceso». */
  notice: string
}

const SESSION = 'litters.status.errors.session'
const FAILED = 'litters.status.errors.failed'
const NOT_FOUND = 'litters.status.errors.not_found'

// Las pantallas donde se ve la camada (contracts §Server Actions).
function revalidateLitter(litterId: string, code: string) {
  revalidatePath(MY_PETS_PATH)
  revalidatePath(litterPanelPath(litterId))
  revalidatePath(litterPath(code))
  revalidatePath(LISTING_PATH)
}

// Marcar en proceso o disponible una cría (US2). «Ya estaba» es un éxito: la cría está como se pidió.
// Los rechazos llevan cómo quedó en `detail`, así la pantalla muestra el estado de ahora en vez del
// cambio que no se aplicó (FR-009). Una cría ajena o que no existe es «no existe» (FR-008).
export async function changeYoungStatus(
  input: unknown,
): Promise<ActionResult<YoungStatusDone, YoungStatusView>> {
  const parsed = youngStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const { petId, action } = parsed.data
  try {
    const record = await changeYoungStatusRecord({ ownerId: user.id, petId, action })
    if (record.outcome === 'not_found') return { ok: false, error: NOT_FOUND }
    const view = { state: record.state, litterState: record.litterState }
    if (record.outcome !== 'done' && record.outcome !== 'already')
      return { ok: false, error: `litters.status.errors.${record.outcome}`, detail: view }

    const t = await getTranslations('litters.status')
    const notice = t(`done.${action}`, { name: record.name })
    if (record.outcome === 'done') {
      const now = new Date()
      await trackAll([
        statusChangeEvent({
          action,
          from: record.from,
          to: record.state,
          publishedAt: record.publishedAt,
          now,
          via: 'my_pets',
          litter: 'young',
        }),
        ...(record.endedMarkedAt === null ? [] : [adoptionEndedEvent(record.endedMarkedAt, now)]),
      ])
      revalidateLitter(record.litterId, record.code)
      // Terminó una adopción (#67, R6): las dos puntas dejan de mostrar el contacto.
      if (record.endedMarkedAt !== null) {
        revalidatePath(INBOX_PATH, 'layout')
        revalidatePath(MY_APPLICATIONS_PATH, 'layout')
      }
    }
    return { ok: true, data: { ...view, notice } }
  } catch (cause) {
    return failed(FAILED, 'change_young_status', cause)
  }
}

/** Cómo quedó la camada entera (FR-009). */
export type LitterStatusView = { state: LitterState; expiresAt: string }

export type LitterStatusDone = LitterStatusView & {
  /** El aviso corto, ya traducido: «La camada de Luna está pausada». */
  notice: string
}

// Pausar, reanudar, renovar y volver a publicar la camada entera (US3). Como las de una cría: «ya
// estaba» es un éxito y un rechazo lleva cómo quedó. Reanudar, renovar y volver a publicar sin
// nivel 1 no cambian nada y piden confirmar el teléfono (FR-004).
export async function changeLitterStatus(
  input: unknown,
): Promise<ActionResult<LitterStatusDone, LitterStatusView>> {
  const parsed = litterStatusChangeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const { litterId, action } = parsed.data
  const youngIds = parsed.data.action === 'republish' ? parsed.data.youngIds : undefined
  try {
    const record = await changeLitterStatusRecord({ ownerId: user.id, litterId, action, youngIds })
    if (record.outcome === 'not_found') return { ok: false, error: NOT_FOUND }
    const view = { state: record.state, expiresAt: record.expiresAt.toISOString() }
    if (record.outcome !== 'done' && record.outcome !== 'already')
      return { ok: false, error: `litters.status.errors.${record.outcome}`, detail: view }

    const [t, format] = await Promise.all([getTranslations('litters.status.done'), getFormatter()])
    const date = format.dateTime(record.expiresAt, { day: 'numeric', month: 'long' })
    const notice = t(action, { name: record.name, date })
    if (record.outcome === 'done') {
      const now = new Date()
      await trackAll([
        statusChangeEvent({
          action,
          from: record.from,
          to: record.state,
          publishedAt: record.publishedAt,
          now,
          via: 'my_pets',
          litter: 'litter',
        }),
        ...record.endedMarkedAt.map((markedAt) => adoptionEndedEvent(markedAt, now)),
      ])
      revalidateLitter(litterId, record.code)
      if (record.endedMarkedAt.length > 0) {
        revalidatePath(INBOX_PATH, 'layout')
        revalidatePath(MY_APPLICATIONS_PATH, 'layout')
      }
    }
    return { ok: true, data: { ...view, notice } }
  } catch (cause) {
    return failed(FAILED, 'change_litter_status', cause)
  }
}

// Quitar una cría desde su fila (US4), sin nivel 1: quitar es borrar. Si era la única, se va la
// camada entera (FR-035). Sus solicitudes las cerró la base; acá se miden y sale el correo de cierre
// en el momento, como al borrar un animal (FR-034). Una que ya no existe terminó igual.
export async function deleteYoung(
  input: unknown,
): Promise<ActionResult<{ litterDeleted: boolean }>> {
  const parsed = petDeletionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  try {
    const since = new Date()
    const record = await deleteYoungRecord({ ownerId: user.id, petId: parsed.data.petId })
    if (record.outcome === 'not_found') return { ok: true, data: { litterDeleted: false } }
    if (record.outcome === 'taken_down')
      return { ok: false, error: 'litters.status.errors.taken_down' }
    // Las fotos quedaron sueltas en la base; si borrarlas falla, quedan para la purga.
    await deletePetPhotos(record.released.map((id) => ({ id, ownerId: user.id })))
    await trackAll([deletedEvent(record.from, 'young')])
    await trackApplicationClosures(since, { userId: user.id })
    await drainApplicationNotices()
    // La cascada dejó en la cola las fotos del seguimiento de su adopción (#69, R7).
    after(purgeFollowUpPhotos)
    revalidateLitter(record.litterId, record.code)
    revalidatePath(INBOX_PATH, 'layout')
    revalidatePath(MY_APPLICATIONS_PATH, 'layout')
    return { ok: true, data: { litterDeleted: record.outcome === 'litter_deleted' } }
  } catch (cause) {
    return failed(FAILED, 'delete_young', cause)
  }
}
