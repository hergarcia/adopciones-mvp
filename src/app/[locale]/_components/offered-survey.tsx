import { answerSurvey, dismissSurvey } from '@/actions/surveys'
import { SurveyCard } from '@/components/surveys/survey-card'
import { surveyOfferedEvent } from '@/lib/analytics/survey-events'
import { trackAll } from '@/lib/analytics/track'
import { SUPPORT_WHATSAPP } from '@/lib/config'
import { supportWhatsAppHref } from '@/lib/support/whatsapp'
import type { SurveyOffer } from '@/lib/surveys/types'
import { surveyCardTexts } from './survey-texts'

type Props = {
  offer: SurveyOffer
  /** El desenlace con el nombre del animal, donde la pantalla no lo dice (Mis animales). */
  title?: string
}

// La encuesta ofrecida al abrir la pantalla, solo mientras está pendiente. Recién ofrecida, se mide
// una vez (research R13): volver a abrir la pantalla ya no la ofrece de nuevo.
export async function OfferedSurvey({ offer, title }: Props) {
  if (offer.state !== 'pending') return null
  const [texts] = await Promise.all([
    surveyCardTexts(offer.moment),
    trackAll(offer.newlyOffered ? [surveyOfferedEvent(offer.moment)] : []),
  ])
  return (
    <SurveyCard
      offerId={offer.offerId}
      moment={offer.moment}
      texts={texts}
      answer={answerSurvey}
      dismiss={dismissSurvey}
      supportUrl={supportWhatsAppHref(SUPPORT_WHATSAPP)}
      title={title}
    />
  )
}
