'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LinkButton } from '@/components/ui/link-button'
import { petNotice } from '@/lib/pets/notice'
import { PUBLISH_PATH } from '@/lib/pets/paths'
import { ErrorScreen } from '@/app/[locale]/_components/error-screen'
import { SavedToast } from '@/app/[locale]/_components/saved-toast'

// Si se llegó recién publicado o guardado, el aviso se ve igual: lo que se hizo, se hizo. Y la
// acción de publicar sigue a la vista (spec §Pantallas, «Mis animales»).
export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common.error_screen')
  const pets = useTranslations('pets')
  const toast = useTranslations('common.toast')
  const notice = petNotice(useSearchParams().get('guardado'))

  return (
    <>
      {notice === null ? null : (
        <SavedToast
          message={pets(`notices.${notice}`)}
          closeLabel={toast('close')}
          label={toast('label')}
          regionLabel={toast('region')}
        />
      )}
      <ErrorScreen
        title={t('title')}
        body={pets('my_pets.load_error')}
        retry={pets('my_pets.retry')}
        reset={reset}
      >
        <div className="flex justify-center">
          <LinkButton href={PUBLISH_PATH} variant="secondary">
            {pets('my_pets.publish')}
          </LinkButton>
        </div>
      </ErrorScreen>
    </>
  )
}
