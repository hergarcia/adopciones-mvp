'use server'

import { revalidatePath } from 'next/cache'
import { handoverEvent } from '@/lib/analytics/adoption-events'
import { statusChangeEvent } from '@/lib/analytics/pet-events'
import { trackAll } from '@/lib/analytics/track'
import { handoverOutcome } from '@/lib/adoptions/outcomes'
import { handedOverPath } from '@/lib/adoptions/paths'
import { INBOX_PATH, MY_APPLICATIONS_PATH } from '@/lib/applications/paths'
import { trackApplicationClosures } from '@/lib/applications/track-closures'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import { LISTING_PATH, MY_PETS_PATH, myPetPath, petPath } from '@/lib/pets/paths'
import { handoverSchema } from '@/lib/schemas/adoption'
import { markPetAdoptedRecord } from '@/lib/supabase/queries/adoptions'
import { getSessionUser } from '@/lib/supabase/queries/session'
import type { ActionResult } from './result'

const SESSION = 'adoptions.handover.errors.session'
const FAILED = 'adoptions.handover.errors.failed'

export type HandoverDetail = {
  /** El nombre de la elegida que dejó de estar aceptada: «Ana ya no sigue con esta solicitud». */
  person: string
  /** Qué hace la pantalla: volver a elegir, o ir a ver cómo quedó el animal. */
  then: 'choose_again' | 'show_state'
}

// Las pantallas de las dos puntas: la de quien lo dio, el animal y las solicitudes de quienes lo
// pidieron, que se cerraron (contracts §Server Actions).
function revalidateBoth(petId: string, code: string | null) {
  revalidatePath(MY_PETS_PATH)
  revalidatePath(myPetPath(petId))
  revalidatePath(INBOX_PATH, 'layout')
  revalidatePath(MY_APPLICATIONS_PATH, 'layout')
  revalidatePath(LISTING_PATH)
  if (code !== null) revalidatePath(petPath(code))
}

// Marcar adoptado eligiendo a quién se entregó (US1). «Ya estaba» —el doble toque o el reintento
// que había llegado— vuelve igual que el primero, sin volver a medir ni a mandar (FR-055). Los
// correos —el de la elegida y los de «encontró hogar»— los escribe la base en la misma transacción
// y salen al vaciar la bandeja: si un correo no sale, lo hecho queda hecho.
export async function markPetAdopted(
  input: unknown,
  back: string,
): Promise<ActionResult<{ returnTo: string }, HandoverDetail>> {
  const parsed = handoverSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: SESSION }

  const { petId, applicationId } = parsed.data
  try {
    const since = new Date()
    const record = await markPetAdoptedRecord(user.id, parsed.data)
    if (record === null) return { ok: false, error: FAILED }
    const result = handoverOutcome(record.outcome)
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        detail: { person: record.person ?? '', then: result.then },
      }
    }

    if (record.outcome === 'done' && record.publishedAt !== null && record.from !== null) {
      const now = new Date()
      await trackAll([
        handoverEvent({
          site: applicationId !== null,
          publishedAt: record.publishedAt,
          acceptedAt: record.acceptedAt,
          acceptedCount: record.acceptedCount,
          now,
        }),
        statusChangeEvent({
          action: 'mark_adopted',
          from: record.from,
          to: 'adopted',
          publishedAt: record.publishedAt,
          now,
          via: 'my_pets',
        }),
      ])
      await trackApplicationClosures(since, { petId })
      await drainApplicationNotices()
      revalidateBoth(petId, record.code)
    }
    return { ok: true, data: { returnTo: handedOverPath(petId, back) } }
  } catch {
    return { ok: false, error: FAILED }
  }
}
