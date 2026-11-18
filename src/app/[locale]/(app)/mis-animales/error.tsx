'use client'

import { useSearchParams } from 'next/navigation'
import { useErrorTexts } from '@/app/[locale]/_components/error-texts'
import { LinkButton } from '@/components/ui/link-button'
import { petNotice } from '@/lib/pets/notice'
import { PUBLISH_PATH } from '@/lib/pets/paths'
import { ErrorScreen, type ErrorBoundaryProps } from '@/app/[locale]/_components/error-screen'
import { LazySavedToast } from '@/app/[locale]/_components/lazy-notices'

// Si se llegó recién publicado o guardado, el aviso se ve igual: lo que se hizo, se hizo. Y la
// acción de publicar sigue a la vista (spec §Pantallas, «Mis animales»).
export default function Error({ error, reset }: ErrorBoundaryProps) {
  const t = useErrorTexts('common.error_screen')
  const pets = useErrorTexts('pets')
  const toast = useErrorTexts('common.toast')
  const notice = petNotice(useSearchParams().get('guardado'))

  return (
    <>
      {notice === null ? null : (
        <LazySavedToast
          message={pets(`notices.${notice}`)}
          closeLabel={toast('close')}
          label={toast('label')}
          regionLabel={toast('region')}
        />
      )}
      <ErrorScreen
        error={error}
        title={t('title')}
        body={pets('my_pets.load_error')}
        retry={pets('my_pets.retry')}
        reset={reset}
      >
        <LinkButton href={PUBLISH_PATH} variant="secondary">
          {pets('my_pets.publish')}
        </LinkButton>
      </ErrorScreen>
    </>
  )
}
