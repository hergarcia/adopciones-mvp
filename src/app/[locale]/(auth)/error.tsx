'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

// El grupo de ingreso no tenía estado de error diseñado: sin esto, un fallo en cualquiera de sus
// cinco pantallas cae en la página de error de Next, que está en inglés y no ofrece salida.
export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('profile.view')

  return (
    <EmptyState title={t('load_error')} action={<Button onClick={reset}>{t('retry')}</Button>} />
  )
}
