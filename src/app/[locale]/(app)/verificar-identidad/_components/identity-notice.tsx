import { getTranslations } from 'next-intl/server'
import { ScreenToast } from '@/app/[locale]/(app)/_components/screen-toast'

// El aviso de que el pedido se retiró, en la pantalla a la que se llega (US1-AS6).
export async function IdentityNotice({ flag }: { flag: string | undefined }) {
  if (flag !== 'retirado') return null
  const t = await getTranslations('identity.request')
  return <ScreenToast message={t('withdrawn')} />
}
