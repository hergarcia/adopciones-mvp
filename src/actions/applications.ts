'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  applicationHeldEvent,
  applicationSentEvent,
  applicationStartedEvent,
  applicationWithdrawnEvent,
  questionAnsweredEvent,
} from '@/lib/analytics/application-events'
import { trackAll } from '@/lib/analytics/track'
import {
  INBOX_PATH,
  MY_APPLICATIONS_PATH,
  applyPath,
  myApplicationPath,
} from '@/lib/applications/paths'
import { holdOutcome, type HoldResult } from '@/lib/applications/held-outcome'
import { answerOutcome, type AnswerResult } from '@/lib/applications/response-outcome'
import type { Answers } from '@/lib/applications/questionnaire'
import {
  submitOutcome,
  type SubmitDetail,
  type SubmitResult,
} from '@/lib/applications/submit-outcome'
import { signInWithNext } from '@/lib/auth/next-destination'
import { drainApplicationNotices } from '@/lib/email/drain-application-notices'
import { YOUNG_ADOPTED, YOUNG_GONE } from '@/lib/litters/young-gone'
import { petPath } from '@/lib/pets/paths'
import { PET_CODE_PATTERN } from '@/lib/pets/rules'
import { formErrorKey, validateApplication } from '@/lib/schemas/application'
import { answerSchema } from '@/lib/schemas/application-response'
import { answerQuestionRecord } from '@/lib/supabase/queries/application-response-records'
import {
  checkApplicationAttemptRecord,
  getApplyScreen,
  holdApplicationRecord,
  submitApplicationRecord,
  withdrawApplicationRecord,
  withdrawHeldRecord,
} from '@/lib/supabase/queries/applications'
import { getApplicationMeasure } from '@/lib/supabase/queries/measured-levels'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { failed, type ActionResult } from './result'

// Enviar una solicitud y lo que la rodea (contracts/routes.md). Ninguna confía en el cliente: la
// sesión se vuelve a leer —con la puerta de la suspendida— y la base vuelve a controlar todo con el
// estado de ese momento (FR-030).

const FAILED = 'applications.errors.failed'
const WITHDRAW_FAILED = 'applications.withdraw.errors.failed'
const ANSWER_FAILED = 'applications.answer.errors.failed'

const SUBMIT_INPUT = z.object({
  code: z.string().regex(PET_CODE_PATTERN),
  attemptId: z.uuid(),
  startedAt: z.number().nullable(),
  proposedUsed: z.boolean(),
  after: z.enum(['phone', 'identity']).nullable(),
  litter: z.boolean(),
  answers: z.record(z.string(), z.unknown()),
})

type SubmitInput = z.infer<typeof SUBMIT_INPUT>
type Checked =
  | { ok: true; userId: string; answers: Answers }
  | { ok: false; result: { ok: false; error: string; detail?: SubmitDetail } }

// Lo que comparten mandar y dejar escrita: la sesión, el animal de ahora y las respuestas contra
// el castrado de ese momento. Si cambió mientras contestaba, la pregunta del compromiso aparece como
// una que falta (spec §Edge Cases); una cría que quien publicó sacó lo dice, y el cuestionario ofrece
// volver a su camada sin perder lo escrito (FR-032 de la #205).
async function checkAnswers(input: SubmitInput, step: string): Promise<Checked> {
  const { code, litter, answers } = input
  const user = await getSessionUser()
  if (user === null) {
    return {
      ok: false,
      result: { ok: false, error: FAILED, detail: { redirect: signInWithNext(applyPath(code)) } },
    }
  }
  const screen = await getApplyScreen(user.id, code).catch(() => undefined)
  if (screen === undefined) return { ok: false, result: await failed(FAILED, step) }
  if (screen === null) {
    return {
      ok: false,
      result: { ok: false, error: litter ? YOUNG_GONE : 'applications.errors.not_receiving' },
    }
  }
  if (litter && screen.pet.isAdopted)
    return { ok: false, result: { ok: false, error: YOUNG_ADOPTED } }
  const validation = validateApplication(answers, { isNeutered: screen.pet.isNeutered })
  if (!validation.ok) {
    return {
      ok: false,
      result: {
        ok: false,
        error: formErrorKey(validation.errors),
        detail: { errors: validation.errors },
      },
    }
  }
  return { ok: true, userId: user.id, answers: validation.data }
}

// Los dos niveles salen de la misma lectura, después de mandar, y no de la pantalla, que se leyó
// antes: así son del mismo instante (#236, R4). Sin lectura, el momento sale sin ellos.
async function afterSent(input: SubmitInput, id: string, after: SubmitInput['after']) {
  const measure = await getApplicationMeasure(id)
  await trackAll([
    applicationSentEvent(
      {
        startedAt: input.startedAt,
        proposedUsed: input.proposedUsed,
        after,
        litter: input.litter,
        applicantLevel: measure?.applicant?.level ?? null,
        publisherLevel: measure?.publisherLevel ?? null,
      },
      Date.now(),
    ),
  ])
  await drainApplicationNotices()
  revalidatePath(petPath(input.code))
  revalidatePath(MY_APPLICATIONS_PATH)
}

export async function submitApplication(input: unknown): Promise<SubmitResult> {
  const parsed = SUBMIT_INPUT.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const checked = await checkAnswers(parsed.data, 'submit_application')
  if (!checked.ok) return checked.result
  const { code, attemptId } = parsed.data

  const row = await submitApplicationRecord({
    applicantId: checked.userId,
    attemptId,
    code,
    answers: checked.answers,
  })
  if (row === null) return failed(FAILED, 'submit_application')
  if (row.outcome === 'sent' && row.id !== null) {
    await afterSent(parsed.data, row.id, parsed.data.after)
  }
  return submitOutcome(row, code)
}

/**
 * Dejarla escrita mientras revisan la identidad (historia #289, contracts §holdApplication). Con la
 * identidad ya aprobada, la base la manda como siempre y se mide como una mandada después de la
 * identidad (FR-006).
 */
export async function holdApplication(input: unknown): Promise<HoldResult> {
  const parsed = SUBMIT_INPUT.safeParse(input)
  if (!parsed.success) return { ok: false, error: FAILED }
  const checked = await checkAnswers(parsed.data, 'hold_application')
  if (!checked.ok) return checked.result
  const { code, attemptId } = parsed.data

  const row = await holdApplicationRecord({
    applicantId: checked.userId,
    attemptId,
    code,
    answers: checked.answers,
  })
  if (row === null) return failed(FAILED, 'hold_application')
  if (row.outcome === 'sent' && row.applicationId !== null) {
    await afterSent(parsed.data, row.applicationId, 'identity')
  }
  if (row.outcome === 'held') {
    const { startedAt, proposedUsed, litter } = parsed.data
    await trackAll([applicationHeldEvent({ startedAt, proposedUsed, litter }, Date.now())])
    revalidatePath(petPath(code))
    revalidatePath(MY_APPLICATIONS_PATH)
  }
  return holdOutcome(row, code)
}

/**
 * Retirar una que espera la identidad (FR-015). Si salió mientras tanto, lo dice con el id de la
 * solicitud que le llegó a quien publicó; si ya no salió, que estaba cerrada. La pantalla de atrás
 * se refresca con el estado real.
 */
export async function withdrawHeldApplication(
  id: string,
): Promise<ActionResult<null, { applicationId: string }>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: WITHDRAW_FAILED }
  const row = await withdrawHeldRecord(user.id, id)
  if (row === null) return failed(WITHDRAW_FAILED, 'withdraw_held_application')
  revalidatePath(MY_APPLICATIONS_PATH)
  if (row.outcome === 'withdrawn') return { ok: true, data: null }
  if (row.outcome === 'released' && row.applicationId !== null) {
    return {
      ok: false,
      error: 'applications.withdraw.errors.released',
      detail: { applicationId: row.applicationId },
    }
  }
  return { ok: false, error: `applications.withdraw.errors.${row.outcome}` }
}

/**
 * Retirar una activa (FR-052). Retirada en otra pestaña, cerrada mientras tanto o ajena: no cambia
 * nada y dice por qué; la ajena, como inexistente (FR-070).
 */
export async function withdrawApplication(id: string): Promise<ActionResult<null>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: WITHDRAW_FAILED }
  const row = await withdrawApplicationRecord(user.id, id)
  if (row === null) return failed(WITHDRAW_FAILED, 'withdraw_application')
  if (row.outcome !== 'withdrawn')
    return { ok: false, error: `applications.withdraw.errors.${row.outcome}` }

  if (row.sentAt !== null) {
    await trackAll([applicationWithdrawnEvent(new Date(row.sentAt), new Date())])
  }
  if (row.code !== null) revalidatePath(petPath(row.code))
  revalidatePath(MY_APPLICATIONS_PATH)
  return { ok: true, data: null }
}

/**
 * Contestar una pregunta del publicador (FR-030, FR-032): una vez, mientras la solicitud siga activa.
 * Ya contestada en otra pestaña cuenta como hecha y la pantalla muestra la que quedó.
 */
export async function answerQuestion(input: unknown): Promise<AnswerResult> {
  const parsed = answerSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? ANSWER_FAILED }
  }
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: ANSWER_FAILED }

  const record = await answerQuestionRecord(user.id, parsed.data)
  if (record === null) return failed(ANSWER_FAILED, 'answer_question')
  if (record?.outcome === 'answered' && record.askedAt !== null) {
    await trackAll([questionAnsweredEvent(new Date(record.askedAt), new Date())])
  }
  if (record !== null && record.applicationId !== null) {
    await drainApplicationNotices()
    revalidatePath(myApplicationPath(record.applicationId))
    revalidatePath(MY_APPLICATIONS_PATH)
    // Las pantallas del publicador: la solicitud y la carpeta del animal dicen si espera que conteste.
    revalidatePath(INBOX_PATH, 'layout')
  }
  return answerOutcome(record)
}

/** Si el intento del borrador ya había enviado: una respuesta perdida y una recarga (R7). */
export async function checkApplicationAttempt(
  attemptId: string,
): Promise<ActionResult<{ id: string | null }>> {
  const user = await getSessionUser()
  if (user === null) return { ok: false, error: FAILED }
  const id = await checkApplicationAttemptRecord(user.id, attemptId)
  return id === undefined ? failed(FAILED, 'check_application_attempt') : { ok: true, data: { id } }
}

/** La primera respuesta tocada (R11); los demás momentos los registra el servidor solo. */
export async function trackApplicationMoment(
  moment: 'started',
  props: { proposed: boolean },
): Promise<ActionResult<null>> {
  if (moment === 'started') await trackAll([applicationStartedEvent({ proposed: props.proposed })])
  return { ok: true, data: null }
}
