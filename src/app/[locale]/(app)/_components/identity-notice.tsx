import { getTranslations } from 'next-intl/server'
import { ScreenToast } from './screen-toast'

export const WITHDRAWN_FLAG = 'retirado'

// El aviso de que el pedido se retiró, en la pantalla a la que se llega (US1-AS6): la de pedir, la
// del estado si queda un rechazo en la ventana, o «Mi perfil» si la cuenta ya no tiene nivel 1.
export async function IdentityNotice({ flag }: { flag: string | undefined }) {
  if (flag !== WITHDRAWN_FLAG) return null
  const t = await getTranslations('identity.request')
  return <ScreenToast message={t('withdrawn')} />
}
