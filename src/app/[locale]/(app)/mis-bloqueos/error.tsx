'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const blocks = useTranslations('moderation.my_blocks')

  return (
    <ErrorScreen
      title={t('title')}
      body={blocks('load_error')}
      retry={blocks('retry')}
      reset={reset}
    />
  )
}
