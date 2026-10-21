'use client'

import { useTranslations } from 'next-intl'
import { LinkButton } from '@/components/ui/link-button'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

// Sin las aceptadas no se puede marcar (spec §Pantallas): reintentar, o volver a Mis animales.
export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('common.error_screen')
  const handover = useTranslations('adoptions.handover')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={handover('load_error')}
      retry={handover('retry')}
      reset={reset}
    >
      <LinkButton href={MY_PETS_PATH} variant="secondary">
        {handover('to_my_pets')}
      </LinkButton>
    </ErrorScreen>
  )
}
