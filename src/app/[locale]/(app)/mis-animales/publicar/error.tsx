'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const form = useTranslations('pets.form')

  return (
    <ErrorScreen title={t('title')} body={form('load_error')} retry={form('retry')} reset={reset} />
  )
}
