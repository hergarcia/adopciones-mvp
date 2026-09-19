'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const profile = useTranslations('profile.view')

  // Acá sí se sabe qué se estaba trayendo, así que el texto lo dice (docs/10 §Textos).
  return (
    <ErrorScreen
      title={t('title')}
      body={profile('load_error')}
      retry={profile('retry')}
      reset={reset}
    />
  )
}
