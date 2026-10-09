import { getTranslations } from 'next-intl/server'
import type { FeedbackFormTexts } from '@/components/feedback/feedback-form'
import type { FeedbackListTexts } from '@/components/feedback/feedback-list'

const ERROR_KEYS = ['empty', 'too_long', 'contact', 'limit', 'failed'] as const

export async function feedbackFormTexts(): Promise<FeedbackFormTexts> {
  const [t, tSupport] = await Promise.all([getTranslations('feedback'), getTranslations('support')])
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
    supportReply: String(tSupport.raw('reply')),
  }
}

const DELETE_ERROR_KEYS = ['delete_failed', 'not_found'] as const

export async function feedbackListTexts(): Promise<FeedbackListTexts> {
  const t = await getTranslations('feedback')
  return {
    label: t('list.list_label'),
    empty: t('list.empty'),
    more: t('list.more'),
    delete: {
      trigger: t('list.delete.trigger'),
      title: t('list.delete.title'),
      body: t('list.delete.body'),
      confirm: t('list.delete.confirm'),
      cancel: t('list.delete.cancel'),
      close: t('list.delete.close'),
      deleted: t('list.deleted'),
      gone: t('list.gone'),
      errors: Object.fromEntries(
        DELETE_ERROR_KEYS.map((key) => [`feedback.errors.${key}`, t(`errors.${key}`)]),
      ),
    },
  }
}
