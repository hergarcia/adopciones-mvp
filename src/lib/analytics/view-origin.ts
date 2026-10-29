import type { EventProps, ProfileViewOrigin, ViewOrigin } from './events'
import { isLinkPreview } from './link-preview'

// «Desde el sitio» es llegar navegando dentro del sitio; todo lo demás, también un `Referer` vacío
// (WhatsApp y los favoritos no mandan), es «desde un enlace» (research R10). Se compara el origen
// entero: `https://sitio.com.evil` no es el sitio.
export function viewOrigin(referer: string | null, siteUrl: string): ViewOrigin {
  try {
    // Stryker disable next-line StringLiteral: cualquier texto que no es una URL da lo mismo, «link».
    return new URL(referer ?? '').origin === new URL(siteUrl).origin ? 'site' : 'link'
  } catch {
    return 'link'
  }
}

// «Desde una solicitud» pide las dos cosas: la marca de «Ver su perfil» y llegar navegando el sitio.
// La misma dirección pegada en otra pestaña o mandada por WhatsApp es un enlace (research R6).
export function profileViewOrigin(
  referer: string | null,
  siteUrl: string,
  fromApplication: boolean,
): ProfileViewOrigin {
  const origin = viewOrigin(referer, siteUrl)
  return fromApplication && origin === 'site' ? 'application' : origin
}

// La dueña mirando el suyo, una vista previa y quien vuelve de su propia acción (la marca `aval`) no
// son alguien abriendo el perfil (FR-028).
export function shouldTrackView(view: {
  isOwner: boolean
  userAgent: string | null
  hasActionFlag: boolean
}): boolean {
  return !view.isOwner && !view.hasActionFlag && !isLinkPreview(view.userAgent)
}

// Si la visita mostró animales (#238, research R7): sin la tanda, porque falló, no se dice nada; un
// «no» inventado contaría como perfil sin animales el de alguien que sí los tiene.
export function profileViewProps(
  origin: ProfileViewOrigin,
  pets: { cards: readonly unknown[] } | null,
): EventProps['public_profile_viewed'] {
  return pets === null ? { origin } : { origin, with_pets: pets.cards.length > 0 }
}
