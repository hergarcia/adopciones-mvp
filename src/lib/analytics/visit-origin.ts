import { LISTING_PATH } from '@/lib/pets/paths'
import { LINK_MARKS, MARK_PARAM, type LinkMark } from '@/lib/pets/share-url'
import { PUBLIC_PROFILE_SEGMENT, isPublicId } from '@/lib/profile/public-paths'
import { HOME_PATH } from './home-events'
import { referrerKind } from './referrer-kinds'

/**
 * De dónde llegó una visita a una ficha (FR-023): uno de diez, nunca la dirección de la que vino.
 * `reply` es el enlace de la respuesta para quien escribe por privado (historia #250).
 */
export type PetViewOrigin =
  | 'listing'
  | 'home'
  | 'profile'
  | 'site'
  | 'shared'
  | 'reply'
  | 'social'
  | 'search'
  | 'assistant'
  | 'unknown'

type Visit = {
  /** La marca del enlace que salió del sitio, se haya pegado donde se haya pegado; null sin marca. */
  mark: LinkMark | null
  referer: string | null
  /** El `host` del pedido: una pantalla de otro sitio no es «de este sitio». */
  host: string | null
  utmSource: string | null
}

// En este orden, la primera que vale (research R11). La marca gana: el enlace salió del sitio, venga
// de WhatsApp, de un grupo de Facebook o de un correo. El asistente va antes que el buscador y la red
// porque ChatGPT no manda `referer` y sí `utm_source`.
export function petViewOrigin(visit: Visit): PetViewOrigin {
  if (visit.mark !== null) return visit.mark
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

/** Lo que la dirección de la ficha dice del origen: la marca del enlace y el `utm_source`. */
export function visitMarks(query: { desde?: Param; utm_source?: Param }): {
  mark: LinkMark | null
  utmSource: string | null
} {
  const value = query[MARK_PARAM]
  const source = query.utm_source
  return {
    mark: markOf(value),
    utmSource: typeof source === 'string' ? source : null,
  }
}

function markOf(value: Param): LinkMark | null {
  if (value === LINK_MARKS.shared) return 'shared'
  return value === LINK_MARKS.reply ? 'reply' : null
}
