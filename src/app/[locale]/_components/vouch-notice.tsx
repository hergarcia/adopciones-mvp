import { getTranslations } from 'next-intl/server'
import { VOUCH_FLAG, VOUCH_NONCE, parseVouchFlag, type VouchQuery } from '@/lib/vouches/paths'
import { LazyDropFlags } from './lazy-notices'
import { ScreenToast } from './screen-toast'

const MESSAGES = {
  dado: 'given',
  retirado: 'withdrawn',
  quitado: 'removed',
  ausente: 'absent',
  'no-se-pudo': 'unavailable',
} as const

type Props = { query: VouchQuery; signedIn: boolean }

// El aviso de avalar, retirar o quitar, en la pantalla que se vuelve a dibujar, con el verbo del
// botón y sin nombres: irían en la dirección. Solo con sesión: el enlace con la marca que alguien
// copie no le anuncia nada a otra persona. `cambio` no tiene aviso —el lugar de avalar ya dice el
// motivo—, pero la marca igual sale de la dirección. `no-se-pudo` es el aval que un bloqueo frenó:
// dice que no se pudo y nunca por qué (FR-017 de la #13). La vez de cada acción es la `key`: la pantalla
// no se vuelve a montar entre dos acciones, y sin otra `key` el aviso de la segunda no saldría.
export async function VouchNotice({ query, signedIn }: Props) {
  const parsed = parseVouchFlag(query[VOUCH_FLAG])
  if (!signedIn || parsed === null) return null
  const nonce = query[VOUCH_NONCE]
  if (parsed === 'cambio') return <LazyDropFlags key={nonce} />
  const t = await getTranslations('vouches.notice')
  return <ScreenToast key={nonce} message={t(MESSAGES[parsed])} />
}
