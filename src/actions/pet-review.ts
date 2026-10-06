'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { getLocale } from 'next-intl/server'
import { track } from '@/lib/analytics/track'
import { trackApplicationClosures } from '@/lib/applications/track-closures'
import { sendPetTakedown } from '@/lib/email/send-pet-takedown'
import { LISTING_PATH, MY_PETS_PATH, PET_REVIEW_PATH, myPetPath, petPath } from '@/lib/pets/paths'
import { petReviewResolutionSchema } from '@/lib/schemas/pet-review'
import { resolvePetReviewRecord } from '@/lib/supabase/queries/pet-reviews'
import { getSessionUser } from '@/lib/supabase/queries/session'
import type { ActionResult } from './result'

const HOUR_MS = 60 * 60 * 1000
const FAILED = 'pet_review.errors.failed'

// Marcar revisada o dar de baja (contracts §Server Actions). Quién administra lo vuelve a preguntar
// la base en cada acción (FR-023); lo que ya no espera como lo vio la pantalla es `closed` (FR-026).
export async function resolvePetReview(input: unknown): Promise<ActionResult<null>> {
  const parsed = petReviewResolutionSchema.safeParse(input)
  if (!parsed.success) {
    // El texto de «otro» tiene su propio error; lo demás no lo puede mandar la pantalla.
    const note = parsed.error.issues.find((issue) => issue.path[0] === 'note')
    return { ok: false, error: note?.message ?? FAILED }
  }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: 'pet_review.errors.not_admin' }

  const resolution = parsed.data
  const takedown =
    resolution.outcome === 'taken_down'
      ? { reason: resolution.reason, note: resolution.note }
      : null
  try {
    const since = new Date()
    const record = await resolvePetReviewRecord({
      adminId: user.id,
      petId: resolution.petId,
      knownSince: resolution.knownSince,
      outcome: resolution.outcome,
      reason: takedown?.reason ?? null,
      note: takedown?.note ?? null,
    })
    if (record.decision !== 'reviewed' && record.decision !== 'taken_down') {
      return { ok: false, error: `pet_review.errors.${record.decision}` }
    }

    // Los momentos de quien administra no llevan la marca de su visita, como la revisión de
    // identidad (research R11).
    const reviewHours = Math.round((Date.now() - record.pendingSince.getTime()) / HOUR_MS)
    if (takedown === null) {
      await track(
        'pet_reviewed',
        { kind: record.kind, review_hours: reviewHours },
        { visit: false },
      )
    } else {
      await track(
        'pet_taken_down',
        { kind: record.kind, reason: takedown.reason, review_hours: reviewHours },
        { visit: false },
      )
      await trackApplicationClosures(since, { petId: record.petId }, { visit: false })
      // El correo sale después de responder: la baja no lo espera ni se deshace si falla (FR-027).
      const locale = await getLocale()
      after(() =>
        sendPetTakedown({
          ownerId: record.ownerId,
          petId: record.petId,
          name: record.name,
          sex: record.sex,
          takedown,
          locale,
        }),
      )
      revalidatePath(LISTING_PATH)
      revalidatePath(petPath(record.code))
      revalidatePath(MY_PETS_PATH)
      revalidatePath(myPetPath(record.petId))
    }
    revalidatePath(PET_REVIEW_PATH)
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: FAILED }
  }
}
