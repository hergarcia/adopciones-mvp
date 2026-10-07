'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  applicationSentEvent,
  applicationStartedEvent,
  applicationWithdrawnEvent,
} from '@/lib/analytics/application-events'
import { trackAll } from '@/lib/analytics/track'
import { MY_APPLICATIONS_PATH, applyPath } from '@/lib/applications/paths'
import { submitOutcome, type SubmitResult } from '@/lib/applications/submit-outcome'
import { signInWithNext } from '@/lib/auth/next-destination'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import { petPath } from '@/lib/pets/paths'
import { PET_CODE_PATTERN } from '@/lib/pets/rules'
import { formErrorKey, validateApplication } from '@/lib/schemas/application'
import {
  checkApplicationAttemptRecord,
  getApplyScreen,
  submitApplicationRecord,
  withdrawApplicationRecord,
} from '@/lib/supabase/queries/applications'
import { getSessionUser } from '@/lib/supabase/queries/session'
import type { ActionResult } from './result'

// Enviar una solicitud y lo que la rodea (contracts/routes.md). Ninguna confía en el cliente: la
// sesión se vuelve a leer —con la puerta de la suspendida— y la base vuelve a controlar todo con el
// estado de ese momento (FR-030).

const FAILED = 'applications.errors.failed'
const WITHDRAW_FAILED = 'applications.withdraw.errors.failed'

const SUBMIT_INPUT = z.object({
  code: z.string().regex(PET_CODE_PATTERN),
  attemptId: z.uuid(),
  startedAt: z.number().nullable(),
  proposedUsed: z.boolean(),
  after: z.enum(['phone', 'identity']).nullable(),
  answers: z.record(z.string(), z.unknown()),
})

export async function submitApplication(input: unknown): Promise<SubmitResult> {
  const parsed = SUBMIT_INPUT.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const { code, attemptId, startedAt, proposedUsed, after, answers } = parsed.data
  const user = await getSessionUser()
  if (user === null) {
    return { ok: false, error: FAILED, detail: { redirect: signInWithNext(applyPath(code)) } }
  }

  // Castrado o no, al momento de enviar: si cambió mientras contestaba, la pregunta del compromiso
  // aparece como una que falta (spec §Edge Cases).
  const screen = await getApplyScreen(user.id, code).catch(() => undefined)
  if (screen === undefined) return { ok: false, error: FAILED }
  if (screen === null) return { ok: false, error: 'applications.errors.not_receiving' }
  const validation = validateApplication(answers, { isNeutered: screen.pet.isNeutered })
  if (!validation.ok) {
    return {
      ok: false,
      error: formErrorKey(validation.errors),
      detail: { errors: validation.errors },
    }
  }

  const row = await submitApplicationRecord({
    applicantId: user.id,
    attemptId,
    code,
    answers: validation.data,
  })
  if (row?.outcome === 'sent') {
    await trackAll([applicationSentEvent({ startedAt, proposedUsed, after }, Date.now())])
    await drainApplicationNotices()
    revalidatePath(petPath(code))
    revalidatePath(MY_APPLICATIONS_PATH)
  }
  return submitOutcome(row, code)
}

/**
 * Retirar una activa (FR-052). Retirada en otra pestaña, cerrada mientras tanto o ajena: no cambia
 * nada y dice por qué; la ajena, como inexistente (FR-070).
 */
export async function withdrawApplication(id: string): Promise<ActionResult<null>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: WITHDRAW_FAILED }
  const row = await withdrawApplicationRecord(user.id, id)
  if (row === null) return { ok: false, error: WITHDRAW_FAILED }
  if (row.outcome !== 'withdrawn')
    return { ok: false, error: `applications.withdraw.errors.${row.outcome}` }

  if (row.sentAt !== null) {
    await trackAll([applicationWithdrawnEvent(new Date(row.sentAt), new Date())])
  }
  if (row.code !== null) revalidatePath(petPath(row.code))
  revalidatePath(MY_APPLICATIONS_PATH)
  return { ok: true, data: null }
}

/** Si el intento del borrador ya había enviado: una respuesta perdida y una recarga (R7). */
export async function checkApplicationAttempt(
  attemptId: string,
): Promise<ActionResult<{ id: string | null }>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: FAILED }
  const id = await checkApplicationAttemptRecord(user.id, attemptId)
  return id === undefined ? { ok: false, error: FAILED } : { ok: true, data: { id } }
}

/** La primera respuesta tocada (R11); los demás momentos los registra el servidor solo. */
export async function trackApplicationMoment(
  moment: 'started',
  props: { proposed: boolean },
): Promise<ActionResult<null>> {
  if (moment === 'started') await trackAll([applicationStartedEvent({ proposed: props.proposed })])
  return { ok: true, data: null }
}
