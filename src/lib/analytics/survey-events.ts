import type { FeedbackScreen } from '@/lib/feedback/types'
import type { SurveyMoment, SurveyOption } from '@/lib/surveys/types'
import type { TrackedEvent } from './events'

// Lo que se mide de la encuesta, Opinar y el WhatsApp de soporte (FR-060, research R13): el momento,
// la opción, si escribió y la pantalla. Nunca el texto, el sujeto de la pantalla ni un id (FR-061).

export function surveyOfferedEvent(moment: SurveyMoment): TrackedEvent {
  return { name: 'survey_offered', props: { moment } }
}

export function surveyAnsweredEvent(answer: {
  moment: SurveyMoment
  option: SurveyOption
  wrote: boolean
}): TrackedEvent {
  return {
    name: 'survey_answered',
    props: { moment: answer.moment, option: answer.option, wrote: answer.wrote },
  }
}

export function surveyDismissedEvent(moment: SurveyMoment): TrackedEvent {
  return { name: 'survey_dismissed', props: { moment } }
}

export function feedbackSentEvent(screen: FeedbackScreen): TrackedEvent {
  return { name: 'feedback_sent', props: { screen } }
}

export function supportWhatsAppOpenedEvent(screen: FeedbackScreen): TrackedEvent {
  return { name: 'support_whatsapp_opened', props: { screen } }
}
