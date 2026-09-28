'use client'

import { useTranslations } from 'next-intl'
import { LinkButton } from '@/components/ui/link-button'
import { LISTING_PATH } from '@/lib/pets/paths'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

// Una falla del sitio al traer la ficha, nunca dicha como «no está publicado» (FR-009): reintentar,
// y el camino al listado.
export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const page = useTranslations('pets.page')

  return (
    <ErrorScreen title={t('title')} body={page('load_error')} retry={t('retry')} reset={reset}>
      <div className="flex justify-center">
        <LinkButton href={LISTING_PATH} variant="ghost">
          {page('to_listing')}
        </LinkButton>
      </div>
    </ErrorScreen>
  )
}
