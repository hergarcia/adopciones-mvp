import {
  ALL_SURVEY_OPTIONS,
  SURVEY_MOMENTS,
  SURVEY_OFFER_STATES,
  SURVEY_OUTCOMES,
  type SurveyAnswerEntry,
  type SurveyMoment,
  type SurveyMomentSummary,
  type SurveyOffer,
  type SurveyOutcome,
} from '@/lib/surveys/types'
import { createServerSupabase } from '@/lib/supabase/server'
import { UUID } from './applications'
import { NEWEST_CURSOR, readNewest } from './newest-first'
import { oneOf } from './pet-rows'

// La encuesta (historia #71), y lo que lee quien administra de ella. Todo va con la sesión: cada función de la base vuelve a preguntar
// quién es, y lo ajeno no existe (research R2, R7). Ofrecer escribe, por eso las lecturas también
// pueden fallar como una escritura.

type OfferRow = { offer_id: string; moment: string; state: string; newly_offered: boolean }

function offerOf(row: OfferRow): SurveyOffer {
  return {
    offerId: row.offer_id,
    moment: oneOf(SURVEY_MOMENTS, row.moment, 'momento'),
    state: oneOf(SURVEY_OFFER_STATES, row.state, 'estado de la encuesta'),
    newlyOffered: row.newly_offered,
  }
}

/**
 * La encuesta de una solicitud propia al abrir Mi solicitud, ofrecida si corresponde; null si no hay
 * o si la base falló, que deja la pantalla como estaba.
 */
export async function surveyFor(
  moment: Exclude<SurveyMoment, 'gave'>,
  applicationId: string,
): Promise<SurveyOffer | null> {
  if (!UUID.test(applicationId)) return null
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('survey_for', {
    p_moment: moment,
    p_application: applicationId,
  })
  const row = data?.[0]
  if (error || row === undefined) return null
  return offerOf(row)
}

/** La encuesta pendiente de Mis animales, con su animal; null si no hay o si la base falló. */
export async function myPetsSurvey(): Promise<SurveyOffer | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('my_pets_survey')
  const row = data?.[0]
  if (error || row === undefined) return null
  return { ...offerOf(row), petId: row.pet_id }
}

/** Responder; null si la base no contestó. */
export async function answerSurvey(input: {
  offerId: string
  option: string
  body: string | null
}): Promise<SurveyOutcome | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('answer_survey', {
    p_offer: input.offerId,
    p_option: input.option,
    ...(input.body === null ? {} : { p_body: input.body }),
  })
  if (error || data === null) return null
  return oneOf(SURVEY_OUTCOMES, data, 'resultado de la encuesta')
}

/** «Ahora no»; null si la base no contestó. */
export async function dismissSurvey(offerId: string): Promise<SurveyOutcome | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('dismiss_survey', { p_offer: offerId })
  if (error || data === null) return null
  return oneOf(SURVEY_OUTCOMES, data, 'resultado de la encuesta')
}

/**
 * Las cuentas de los tres momentos para quien administra, en el orden en que se ofrecen. La base
 * devuelve una fila por momento y opción, y nada a quien no administra (research R12).
 */
export async function surveySummary(): Promise<SurveyMomentSummary[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('admin_survey_summary')
  if (error) throw new Error('No se pudieron traer las encuestas', { cause: error })
  const byMoment = new Map<SurveyMoment, SurveyMomentSummary>()
  for (const row of data) {
    const moment = oneOf(SURVEY_MOMENTS, row.moment, 'momento')
    const summary = byMoment.get(moment) ?? {
      moment,
      offered: row.offered,
      answered: row.answered,
      dismissed: row.dismissed,
      options: [],
    }
    summary.options.push({
      option: oneOf(ALL_SURVEY_OPTIONS, row.option, 'opción de la encuesta'),
      chosen: row.chosen,
    })
    byMoment.set(moment, summary)
  }
  return [...byMoment.values()]
}

/** Las respuestas con texto de un momento, de la más nueva a la más vieja, las primeras `count`. */
export async function surveyAnswers(
  moment: SurveyMoment,
  count: number,
): Promise<{ items: SurveyAnswerEntry[]; hasMore: boolean }> {
  const supabase = await createServerSupabase()
  return readNewest<SurveyAnswerEntry>(count, async (after, limit) => {
    const { data, error } = await supabase.rpc('admin_survey_answers', {
      p_moment: moment,
      p_before_on: after?.answeredOn ?? NEWEST_CURSOR.day,
      p_before_id: after?.id ?? NEWEST_CURSOR.id,
      p_limit: limit,
    })
    if (error) throw new Error('No se pudieron traer las respuestas', { cause: error })
    return data.map((row) => ({
      id: row.id,
      option: oneOf(ALL_SURVEY_OPTIONS, row.option, 'opción de la encuesta'),
      body: row.body,
      answeredOn: row.answered_on,
    }))
  })
}
