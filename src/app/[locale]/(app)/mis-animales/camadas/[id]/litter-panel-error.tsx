'use client'

import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { LinkButton } from '@/components/ui/link-button'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'

// Sin la camada no hay nada que mostrar: reintentar, o volver a Mis animales.
export function LitterPanelError({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const page = useErrorTexts('litters.page')
  const myPets = useErrorTexts('pets.my_pets')

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
