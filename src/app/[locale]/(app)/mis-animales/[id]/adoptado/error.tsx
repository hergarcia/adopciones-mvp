'use client'

import { useTranslations } from 'next-intl'
import { LinkButton } from '@/components/ui/link-button'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

// Sin las aceptadas no se puede marcar (spec §Pantallas): reintentar, o volver a Mis animales.
export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const handover = useTranslations('adoptions.handover')

  return (
    <ErrorScreen
      title={t('title')}
      body={handover('load_error')}
      retry={handover('retry')}
      reset={reset}
    >
      <div className="flex justify-center">
        <LinkButton href={MY_PETS_PATH} variant="secondary">
          {handover('to_my_pets')}
        </LinkButton>
      </div>
    </ErrorScreen>
  )
}
