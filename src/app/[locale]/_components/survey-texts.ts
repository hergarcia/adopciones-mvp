import { getTranslations } from 'next-intl/server'
import type { SurveyCardTexts } from '@/components/surveys/survey-card'
import { surveyQuestion } from '@/lib/surveys/questions'
import type { SurveyMoment } from '@/lib/surveys/types'

const ERROR_KEYS = [
  'option_required',
  'too_long',
  'contact',
  'not_found',
  'session',
  'failed',
] as const

export async function surveyCardTexts(moment: SurveyMoment): Promise<SurveyCardTexts> {
  const [t, tSupport] = await Promise.all([getTranslations('surveys'), getTranslations('support')])
  const { question, options } = surveyQuestion(moment)
  return {
    question: t(question),
    options: options.map((option) => ({ value: option.value, label: t(option.label) })),
    openQuestion: t('card.open_question'),
    anonymous: t('card.anonymous'),
    send: t('card.send'),
    dismiss: t('card.dismiss'),
    thanks: t('card.thanks'),
    unsent: t('errors.unsent'),
    counts: {
      left: { one: t('card.chars_left_one'), many: String(t.raw('card.chars_left_many')) },
      over: { one: t('card.chars_over_one'), many: String(t.raw('card.chars_over_many')) },
    },
    // El de contacto baja crudo: el fragmento lo pone el cliente.
    errors: Object.fromEntries(
      ERROR_KEYS.map((key) => [
        `surveys.errors.${key}`,
        key === 'contact' ? String(t.raw(`errors.${key}`)) : t(`errors.${key}`),
      ]),
    ),
    supportReply: String(tSupport.raw('reply')),
  }
}
