'use client'

import { useTranslations } from 'next-intl'
import { LinkButton } from '@/components/ui/link-button'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'

// El límite de error de las tres pantallas del publicador: lo que pasó, «Reintentar» y, debajo, el
// camino a Mis animales, que sigue ahí aunque esto no haya cargado.
export function InboxError({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const inbox = useTranslations('inbox')

  return (
    <ErrorScreen
      title={t('title')}
      body={inbox('errors.load_error')}
      retry={inbox('errors.retry')}
      reset={reset}
    >
      <div className="mt-4 flex justify-center">
        <LinkButton href={MY_PETS_PATH} variant="ghost">
          {inbox('list.to_my_pets')}
        </LinkButton>
      </div>
    </ErrorScreen>
  )
}
