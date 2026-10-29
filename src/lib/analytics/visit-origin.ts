import { SUGGESTION_MARK } from '@/lib/applications/suggestions'
import { LISTING_PATH } from '@/lib/pets/paths'
import { LINK_MARKS, MARK_PARAM, type LinkMark } from '@/lib/pets/share-url'
import { PUBLIC_PROFILE_SEGMENT, isPublicId } from '@/lib/profile/public-paths'
import { HOME_PATH } from './home-events'
import { referrerKind } from './referrer-kinds'

/**
 * De dónde llegó una visita a una ficha (FR-023): uno de doce, nunca la dirección de la que vino.
 * `reply` es el enlace de la respuesta para quien escribe por privado (historia #250); `suggested`,
 * un sugerido de Mi solicitud después de no ser elegido (historia #259); `alert`, un renglón del
 * correo de avisos (historia #265).
 */
export type PetViewOrigin =
  | 'listing'
  | 'suggested'
  | 'home'
  | 'profile'
  | 'site'
  | 'shared'
  | 'reply'
  | 'alert'
  | 'social'
  | 'search'
  | 'assistant'
  | 'unknown'

/** La marca de la dirección de la ficha: la de un enlace que salió del sitio o la de un sugerido. */
export type VisitMark = LinkMark | 'suggested'

type Visit = {
  /** La marca del enlace que salió del sitio, se haya pegado donde se haya pegado; null sin marca. */
  mark: VisitMark | null
  referer: string | null
  /** El `host` del pedido: una pantalla de otro sitio no es «de este sitio». */
  host: string | null
  utmSource: string | null
}

// En este orden, la primera que vale (research R11). La marca gana: el enlace salió del sitio, venga
// de WhatsApp, de un grupo de Facebook o de un correo, también el de avisos. El asistente va antes
// que el buscador y la red porque ChatGPT no manda `referer` y sí `utm_source`.
// La marca del sugerido, en cambio, vale solo navegando el sitio: la misma dirección pegada en otra
// pestaña o mandada por WhatsApp no viene de Mi solicitud.
export function petViewOrigin(visit: Visit): PetViewOrigin {
  const from = URL.parse(String(visit.referer))
  const isSite = from !== null && from.host === visit.host
  if (visit.mark === 'suggested') {
    if (isSite) return 'suggested'
  } else if (visit.mark !== null) return visit.mark
  if (isSite) return siteOrigin(from.pathname)
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
  mark: VisitMark | null
  utmSource: string | null
} {
  const value = query[MARK_PARAM]
  const source = query.utm_source
  return {
    mark: markOf(value),
    utmSource: typeof source === 'string' ? source : null,
  }
}

function markOf(value: Param): VisitMark | null {
  if (value === LINK_MARKS.shared) return 'shared'
  if (value === SUGGESTION_MARK) return 'suggested'
  if (value === LINK_MARKS.alert) return 'alert'
  return value === LINK_MARKS.reply ? 'reply' : null
}
