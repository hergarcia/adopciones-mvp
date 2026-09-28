import { getTranslations } from 'next-intl/server'
import { parseVouchFlag } from '@/lib/vouches/paths'
import { LazyDropFlags } from './lazy-notices'
import { ScreenToast } from './screen-toast'

const MESSAGES = {
  dado: 'given',
  retirado: 'withdrawn',
  quitado: 'removed',
  ausente: 'absent',
} as const

type Props = { flag: string | undefined; signedIn: boolean }

// El aviso de avalar, retirar o quitar, en la pantalla que se vuelve a dibujar, con el verbo del
// botón y sin nombres: irían en la dirección. Solo con sesión: el enlace con la marca que alguien
// copie no le anuncia nada a otra persona. `cambio` no tiene aviso —el lugar de avalar ya dice el
// motivo—, pero la marca igual sale de la dirección.
export async function VouchNotice({ flag, signedIn }: Props) {
  const parsed = parseVouchFlag(flag)
  if (!signedIn || parsed === null) return null
  if (parsed === 'cambio') return <LazyDropFlags />
  const t = await getTranslations('vouches.notice')
  return <ScreenToast message={t(MESSAGES[parsed])} />
}
