import { LISTING_PATH } from '@/lib/pets/paths'
import { SHARE_MARK } from '@/lib/pets/share-url'
import { PUBLIC_PROFILE_SEGMENT, isPublicId } from '@/lib/profile/public-paths'
import { HOME_PATH } from './home-events'
import { referrerKind } from './referrer-kinds'

/** De dónde llegó una visita a una ficha (FR-023): uno de nueve, nunca la dirección de la que vino. */
export type PetViewOrigin =
  'listing' | 'home' | 'profile' | 'site' | 'shared' | 'social' | 'search' | 'assistant' | 'unknown'

type Visit = {
  /** Llegó por el enlace del botón Compartir, se haya pegado donde se haya pegado. */
  marked: boolean
  referer: string | null
  /** El `host` del pedido: una pantalla de otro sitio no es «de este sitio». */
  host: string | null
  utmSource: string | null
}

// En este orden, la primera que vale (research R11). La marca gana: el enlace salió del botón, venga
// de WhatsApp, de un grupo de Facebook o de un correo. El asistente va antes que el buscador y la red
// porque ChatGPT no manda `referer` y sí `utm_source`.
export function petViewOrigin(visit: Visit): PetViewOrigin {
  if (visit.marked) return 'shared'
  const from = URL.parse(String(visit.referer))
  if (from !== null && from.host === visit.host) return siteOrigin(from.pathname)
  if (visit.utmSource !== null && referrerKind(visit.utmSource) === 'assistant') return 'assistant'
  return (from === null ? null : referrerKind(from.hostname)) ?? 'unknown'
}

function siteOrigin(path: string): PetViewOrigin {
  if (path === LISTING_PATH) return 'listing'
  if (isProfilePath(path)) return 'profile'
  return path === HOME_PATH ? 'home' : 'site'
}

// El perfil público de alguien, `/perfil/<publicId>` y nada más abajo (#238, research R6): la foto
// del perfil o un camino que solo se le parece son «del sitio».
function isProfilePath(path: string): boolean {
  const [, segment, id, ...rest] = path.split('/')
  return segment === PUBLIC_PROFILE_SEGMENT && rest.length === 0 && isPublicId(id)
}

type Param = string | string[] | undefined

/** Lo que la dirección de la ficha dice del origen: la marca de Compartir y el `utm_source`. */
export function visitMarks(query: { desde?: Param; utm_source?: Param }): {
  marked: boolean
  utmSource: string | null
} {
  const source = query.utm_source
  return {
    marked: query[SHARE_MARK.param] === SHARE_MARK.value,
    utmSource: typeof source === 'string' ? source : null,
  }
}
