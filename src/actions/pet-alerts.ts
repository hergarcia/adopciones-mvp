'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { MY_ALERTS_PATH } from '@/lib/alerts/paths'
import type { CreateAlertOutcome } from '@/lib/alerts/types'
import { alertCreatedEvent, alertDeletedEvent } from '@/lib/analytics/alert-events'
import { trackAll } from '@/lib/analytics/track'
import { petAlertSchema } from '@/lib/schemas/pet-alert'
import { createPetAlertRecord, deletePetAlertRecord } from '@/lib/supabase/queries/pet-alerts'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { failed, type ActionResult } from './result'

const SESSION = 'alerts.errors.session'
const FAILED = 'alerts.errors.failed'

// «Avisame cuando haya uno así» (contracts §createPetAlert). El repetido y el tope son respuestas,
// no errores: la pantalla dice que ya lo tiene o que llegó al máximo, sin medir nada.
export async function createPetAlert(input: unknown): Promise<ActionResult<CreateAlertOutcome>> {
  const parsed = petAlertSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  if ((await getSessionUser()) === null) return { ok: false, error: SESSION }

  const { filters, fromEmpty } = parsed.data
  try {
    const outcome = await createPetAlertRecord(filters)
    if (outcome === 'created') {
      await trackAll([alertCreatedEvent(filters, fromEmpty)])
      revalidatePath(MY_ALERTS_PATH)
    }
    return { ok: true, data: outcome }
  } catch (cause) {
    return failed(FAILED, 'create_pet_alert', cause)
  }
}

// «Borrar» en «Mis avisos». Uno que ya no estaba se da por borrado: es lo que la persona quería.
export async function deletePetAlert(alertId: string): Promise<ActionResult<null>> {
  const parsed = z.uuid().safeParse(alertId)
  if (!parsed.success) return { ok: false, error: FAILED }
  if ((await getSessionUser()) === null) return { ok: false, error: SESSION }

  try {
    if (await deletePetAlertRecord(parsed.data)) {
      await trackAll([alertDeletedEvent('profile')])
      revalidatePath(MY_ALERTS_PATH)
    }
    return { ok: true, data: null }
  } catch (cause) {
    return failed(FAILED, 'delete_pet_alert', cause)
  }
}
