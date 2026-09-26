import { getTranslations } from 'next-intl/server'
import { ScreenToast } from './screen-toast'

export const WITHDRAWN_FLAG = 'retirado'
/** Retirar llegó tarde: el pedido ya se había resuelto o vencido (Edge Cases, «Retira mientras se resuelve»). */
export const NOT_WITHDRAWN_FLAG = 'no-retirado'

type Props = {
  flags: { guardado?: string; error?: string }
}

// El aviso de retirar, en la pantalla a la que se llega (US1-AS6): la de pedir, la del estado si
// queda un rechazo en la ventana, o «Mi perfil» si la cuenta ya no tiene nivel 1. Si el retiro llegó
// tarde, la pantalla ya muestra el resultado y el aviso dice por qué no se retiró.
export async function IdentityNotice({ flags }: Props) {
  if (flags.guardado === WITHDRAWN_FLAG) {
    const t = await getTranslations('identity.request')
    return <ScreenToast message={t('withdrawn')} />
  }
  if (flags.error === NOT_WITHDRAWN_FLAG) {
    const t = await getTranslations('identity.errors')
    return <ScreenToast message={t('not_open')} variant="error" />
  }
  return null
}
