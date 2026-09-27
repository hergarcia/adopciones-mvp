import { getTranslations } from 'next-intl/server'
import { SavedToast } from '@/app/[locale]/_components/saved-toast'
import { petNotice } from '@/lib/pets/notice'

// El aviso de «Publicado» o «Guardado», montado en «Mis animales», que es a donde se llega: el
// formulario se desmonta con la navegación (docs/10, `SavedToast`).
export async function PetSavedNotice({ flag }: { flag?: string }) {
  const notice = petNotice(flag)
  if (notice === null) return null

  const t = await getTranslations('pets.notices')
  const toast = await getTranslations('common.toast')
  return (
    <SavedToast
      message={t(notice)}
      closeLabel={toast('close')}
      label={toast('label')}
      regionLabel={toast('region')}
    />
  )
}
