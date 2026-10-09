import { getTranslations } from 'next-intl/server'
import type { FeedbackFormTexts } from '@/components/feedback/feedback-form'

const ERROR_KEYS = ['empty', 'too_long', 'contact', 'limit', 'failed'] as const

export async function feedbackFormTexts(): Promise<FeedbackFormTexts> {
  const t = await getTranslations('feedback')
  return {
    label: t('form.label'),
    send: t('form.send'),
    sent: t('form.sent'),
    back: t('form.back'),
    counts: {
      left: { one: t('form.chars_left_one'), many: String(t.raw('form.chars_left_many')) },
      over: { one: t('form.chars_over_one'), many: String(t.raw('form.chars_over_many')) },
    },
    // El de contacto baja crudo: el fragmento lo pone el cliente.
    errors: Object.fromEntries(
      ERROR_KEYS.map((key) => [
        `feedback.errors.${key}`,
        key === 'contact' ? String(t.raw(`errors.${key}`)) : t(`errors.${key}`),
      ]),
    ),
  }
}
