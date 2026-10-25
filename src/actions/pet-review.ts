'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { getLocale } from 'next-intl/server'
import { track } from '@/lib/analytics/track'
import { trackApplicationClosures } from '@/lib/applications/track-closures'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import { sendPetTakedown } from '@/lib/email/send-pet-takedown'
import { litterPath } from '@/lib/litters/paths'
import { LISTING_PATH, MY_PETS_PATH, PET_REVIEW_PATH, myPetPath, petPath } from '@/lib/pets/paths'
import { petReviewResolutionSchema } from '@/lib/schemas/pet-review'
import { resolvePetReviewRecord, type ResolvedSubject } from '@/lib/supabase/queries/pet-reviews'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { failed, type ActionResult } from './result'

const HOUR_MS = 60 * 60 * 1000
const FAILED = 'pet_review.errors.failed'

// Lo que deja de verse con la baja. Una camada se lleva sus crías: sus solicitudes se buscan por quien
// publicó, como al borrar una camada (#205).
function afterTakedown(subject: ResolvedSubject, ownerId: string, code: string) {
  revalidatePath(LISTING_PATH)
  revalidatePath(MY_PETS_PATH)
  if (subject.kind === 'litter') {
    revalidatePath(litterPath(code))
    return { userId: ownerId }
  }
  revalidatePath(petPath(code))
  revalidatePath(myPetPath(subject.petId))
  return { petId: subject.petId }
}

// Marcar revisada o dar de baja un animal o una camada entera (contracts §Server Actions). Quién
// administra lo vuelve a preguntar la base en cada acción (FR-023); lo que ya no espera como lo vio la
// pantalla es `closed` (FR-026).
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
      target: { kind: resolution.kind, id: resolution.id },
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
    const litter = record.subject.kind === 'litter'
    if (takedown === null) {
      await track(
        'pet_reviewed',
        { kind: record.kind, review_hours: reviewHours, litter },
        { visit: false },
      )
    } else {
      await track(
        'pet_taken_down',
        { kind: record.kind, reason: takedown.reason, review_hours: reviewHours, litter },
        { visit: false },
      )
      const scope = afterTakedown(record.subject, record.ownerId, record.code)
      await trackApplicationClosures(since, scope, { visit: false })
      await drainApplicationNotices()
      // El correo sale después de responder: la baja no lo espera ni se deshace si falla (FR-027).
      const locale = await getLocale()
      after(() =>
        sendPetTakedown({
          ownerId: record.ownerId,
          subject: record.subject,
          name: record.name,
          takedown,
          locale,
        }),
      )
    }
    revalidatePath(PET_REVIEW_PATH)
    return { ok: true, data: null }
  } catch (cause) {
    return failed(FAILED, 'resolve_pet_review', cause)
  }
}
