'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { adoptionEndedEvent } from '@/lib/analytics/adoption-events'
import { statusChangeEvent } from '@/lib/analytics/pet-events'
import { trackAll } from '@/lib/analytics/track'
import { INBOX_PATH, MY_APPLICATIONS_PATH } from '@/lib/applications/paths'
import { litterPanelPath, litterPath } from '@/lib/litters/paths'
import type { LitterState, YoungState } from '@/lib/litters/types'
import { LISTING_PATH, MY_PETS_PATH } from '@/lib/pets/paths'
import { youngStatusChangeSchema } from '@/lib/schemas/litter-status'
import { changeYoungStatusRecord } from '@/lib/supabase/queries/litter-status'
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
