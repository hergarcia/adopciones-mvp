import { getTranslations } from 'next-intl/server'
import type { ExitQuestionTexts } from '@/components/verification/exit-question'
import { EXIT_OPTIONS, type ExitLevel } from '@/lib/verification/exit-question'

const ERROR_KEYS = ['option', 'too_long', 'contact', 'session', 'failed'] as const

// Los textos de «¿Qué te frena?» de un nivel, traducidos en el servidor: al navegador no le baja
// `messages/es.json`.
export async function exitQuestionTexts(level: ExitLevel): Promise<ExitQuestionTexts> {
  const t = await getTranslations('verification.exit')
  const labels: Record<string, string> = Object.fromEntries(
    level === 'phone'
      ? EXIT_OPTIONS.phone.map((option) => [option, t(`options.phone.${option}`)])
      : EXIT_OPTIONS.identity.map((option) => [option, t(`options.identity.${option}`)]),
  )
  return {
    question: t(`question.${level}`),
    lead: t('lead'),
    options: EXIT_OPTIONS[level]
      .filter((option) => option !== 'other')
      .map((value) => ({ value, label: labels[value] ?? value })),
    other: labels.other ?? '',
    otherLabel: t('other_label'),
    send: t('send'),
    skip: t('skip'),
    unsent: t('errors.unsent'),
    counts: {
      left: { one: t('chars_left_one'), many: String(t.raw('chars_left_many')) },
      over: { one: t('chars_over_one'), many: String(t.raw('chars_over_many')) },
    },
    // El de contacto baja crudo: el fragmento lo pone el cliente.
    errors: Object.fromEntries(
      ERROR_KEYS.map((key) => [
        `verification.exit.errors.${key}`,
        key === 'contact' ? String(t.raw(`errors.${key}`)) : t(`errors.${key}`),
      ]),
    ),
  }
}
