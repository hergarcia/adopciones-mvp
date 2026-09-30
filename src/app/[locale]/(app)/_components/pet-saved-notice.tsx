import { getTranslations } from 'next-intl/server'
import { petNotice } from '@/lib/pets/notice'
import { ScreenToast } from '@/app/[locale]/_components/screen-toast'

// El aviso de «Publicado» o «Guardado», montado en «Mis animales», que es a donde se llega: el
// formulario se desmonta con la navegación (docs/10, `SavedToast`).
export async function PetSavedNotice({ flag }: { flag?: string }) {
  const notice = petNotice(flag)
  if (notice === null) return null

  const t = await getTranslations('pets.notices')
  return <ScreenToast message={t(notice)} />
}
