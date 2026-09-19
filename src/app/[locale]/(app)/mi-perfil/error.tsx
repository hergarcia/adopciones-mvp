'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('profile.view')

  return (
    <EmptyState title={t('load_error')} action={<Button onClick={reset}>{t('retry')}</Button>} />
  )
}
