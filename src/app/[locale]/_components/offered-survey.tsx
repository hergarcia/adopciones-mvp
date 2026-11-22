import { getTranslations } from 'next-intl/server'
import { answerSurvey, dismissSurvey } from '@/actions/surveys'
import { LazySurveyCard } from '@/components/surveys/lazy-survey-card'
import { SurveyCardSkeleton } from '@/components/surveys/survey-card-skeleton'
import { SurveyNotArrived } from '@/components/surveys/survey-not-arrived'
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
// una vez (research R13): volver a abrir la pantalla ya no la ofrece de nuevo, y traerla con
// «Reintentar» tampoco, porque eso pasa en el navegador. La espera y el aviso de que no llegó viajan
// en el HTML (historia #352).
export async function OfferedSurvey({ offer, title }: Props) {
  if (offer.state !== 'pending') return null
  const [texts, t] = await Promise.all([
    surveyCardTexts(offer.moment),
    getTranslations(),
    trackAll(offer.newlyOffered ? [surveyOfferedEvent(offer.moment)] : []),
  ])
  const notArrived = {
    message: t('surveys.card.not_arrived'),
    retry: t('common.part_failed.retry'),
  }
  return (
    <LazySurveyCard
      props={{
        offerId: offer.offerId,
        moment: offer.moment,
        texts,
        answer: answerSurvey,
        dismiss: dismissSurvey,
        supportUrl: supportWhatsAppHref(SUPPORT_WHATSAPP),
        title,
      }}
      part={{
        waiting: <SurveyCardSkeleton texts={texts} title={title} />,
        failed: <SurveyNotArrived texts={notArrived} />,
      }}
    />
  )
}
