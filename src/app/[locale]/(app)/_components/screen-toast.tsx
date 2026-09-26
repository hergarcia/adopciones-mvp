import { getTranslations } from 'next-intl/server'
import { SavedToast } from '@/components/profile/saved-toast'

type Props = {
  message: string
  variant?: 'success' | 'error'
}

// El aviso de la pantalla a la que se llega, con los textos del `Toast` ya puestos: cada aviso
// dice solo su mensaje.
export async function ScreenToast({ message, variant }: Props) {
  const toast = await getTranslations('common.toast')
  return (
    <SavedToast
      message={message}
      variant={variant}
      closeLabel={toast('close')}
      label={toast('label')}
      regionLabel={toast('region')}
    />
  )
}
