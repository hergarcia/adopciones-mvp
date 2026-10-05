'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

// También cuando no se pudo saber cómo está la cuenta (research R4): reintentar vuelve a preguntar.
export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const screen = useTranslations('moderation.suspended_screen')

  return (
    <ErrorScreen title={t('title')} body={screen('load_error')} retry={t('retry')} reset={reset} />
  )
}
