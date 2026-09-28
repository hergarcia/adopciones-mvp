'use client'

import { useTranslations } from 'next-intl'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

// Lo inesperado: si la base no responde, la página ya dibuja el listado en su estado de error, con
// los filtros a la vista (plan §Listado).
export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const listing = useTranslations('pets.listing')

  return (
    <ErrorScreen title={t('title')} body={listing('load_error')} retry={t('retry')} reset={reset} />
  )
}
