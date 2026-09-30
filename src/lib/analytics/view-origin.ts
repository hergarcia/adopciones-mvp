import type { ViewOrigin } from './events'
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

// La dueña mirando el suyo, una vista previa y quien vuelve de su propia acción (la marca `aval`) no
// son alguien abriendo el perfil (FR-028).
export function shouldTrackView(view: {
  isOwner: boolean
  userAgent: string | null
  hasActionFlag: boolean
}): boolean {
  return !view.isOwner && !view.hasActionFlag && !isLinkPreview(view.userAgent)
}
