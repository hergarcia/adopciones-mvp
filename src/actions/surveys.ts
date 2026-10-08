'use server'

import { revalidatePath } from 'next/cache'
import { surveyAnsweredEvent, surveyDismissedEvent } from '@/lib/analytics/survey-events'
import { trackAll } from '@/lib/analytics/track'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { surveyAnswerSchema, surveyDismissSchema } from '@/lib/schemas/survey'
import {
  answerSurvey as answerSurveyRecord,
  dismissSurvey as dismissSurveyRecord,
} from '@/lib/supabase/queries/surveys'
import { getSessionUser } from '@/lib/supabase/queries/session'
import { surveyOutcome } from '@/lib/surveys/outcomes'
import type { SurveyMoment } from '@/lib/surveys/types'
import type { ActionResult } from './result'

const SESSION = 'surveys.errors.session'
const FAILED = 'surveys.errors.failed'

// La encuesta vive en Mis animales (`gave`) o en Mi solicitud: la que la mostró no la vuelve a
// pintar. Mi solicitud por el patrón de la ruta, sin el id, que la acción no conoce.
function revalidateSurvey(moment: SurveyMoment) {
  if (moment === 'gave') revalidatePath(MY_PETS_PATH)
  else revalidatePath('/[locale]/mis-solicitudes/[id]', 'page')
}

// «Enviar» (FR-010): la opción y la respuesta libre. La que ya había llegado —doble toque, otra
// pestaña, el reintento— y la cerrada en otra pestaña terminan como un envío, sin medir otra vez.
export async function answerSurvey(input: unknown): Promise<ActionResult<null>> {
  const parsed = surveyAnswerSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? FAILED }
  if ((await getSessionUser()) === null) return { ok: false, error: SESSION }

  try {
    const { offerId, moment, option, body } = parsed.data
    const outcome = await answerSurveyRecord({ offerId, option, body })
    if (outcome === null) return { ok: false, error: FAILED }
    const result = surveyOutcome(outcome)
    if (!result.ok) return result
    if (outcome === 'answered') {
      await trackAll([surveyAnsweredEvent({ moment, option, wrote: body !== null })])
      revalidateSurvey(moment)
    }
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: FAILED }
  }
}

// «Ahora no»: la encuesta se va y no vuelve por ese desenlace (FR-011).
export async function dismissSurvey(input: unknown): Promise<ActionResult<null>> {
  const parsed = surveyDismissSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'surveys.errors.not_found' }
  if ((await getSessionUser()) === null) return { ok: false, error: SESSION }

  try {
    const { offerId, moment } = parsed.data
    const outcome = await dismissSurveyRecord(offerId)
    if (outcome === null) return { ok: false, error: FAILED }
    const result = surveyOutcome(outcome)
    if (!result.ok) return result
    if (outcome === 'dismissed') {
      await trackAll([surveyDismissedEvent(moment)])
      revalidateSurvey(moment)
    }
    return { ok: true, data: null }
  } catch {
    return { ok: false, error: FAILED }
  }
}
