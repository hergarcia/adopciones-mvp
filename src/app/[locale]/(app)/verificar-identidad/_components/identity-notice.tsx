import { getTranslations } from 'next-intl/server'
import { SavedToast } from '@/components/profile/saved-toast'

// El aviso de que el pedido se retiró, en la pantalla a la que se llega (US1-AS6).
export async function IdentityNotice({ flag }: { flag: string | undefined }) {
  if (flag !== 'retirado') return null
  const t = await getTranslations('identity.request')
  const toast = await getTranslations('common.toast')
  return (
    <SavedToast
      message={t('withdrawn')}
      closeLabel={toast('close')}
      label={toast('label')}
      regionLabel={toast('region')}
    />
  )
}
