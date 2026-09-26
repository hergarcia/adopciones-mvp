'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const identity = useTranslations('identity.errors')

  return (
    <ErrorScreen
      title={t('title')}
      body={identity('load_error')}
      retry={t('retry')}
      reset={reset}
    />
  )
}
