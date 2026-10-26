'use client'

import { useTranslations } from 'next-intl'
import { LinkButton } from '@/components/ui/link-button'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

// Sin la camada no hay nada que mostrar: reintentar, o volver a Mis animales.
export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('common.error_screen')
  const page = useTranslations('litters.page')
  const myPets = useTranslations('pets.my_pets')

  return (
    <ErrorScreen
      error={error}
      title={t('title')}
      body={page('load_error')}
      retry={myPets('retry')}
      reset={reset}
    >
      <LinkButton href={MY_PETS_PATH} variant="secondary">
        {page('to_my_pets')}
      </LinkButton>
    </ErrorScreen>
  )
}
