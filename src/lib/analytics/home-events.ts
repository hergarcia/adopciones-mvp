import { isLinkPreview } from './link-preview'
import type { TrackedEvent } from './events'

const HOME_PATH = '/'

/** Si se llegó desde la portada de este mismo sitio; un `host` desconocido nunca lo es. */
export function isHomeReferer(referer: string | null, host: string | null): boolean {
  const url = URL.parse(String(referer))
  return url !== null && url.host === host && url.pathname === HOME_PATH
}

export function homeViewEvent(view: { userAgent: string | null }): TrackedEvent | null {
  return isLinkPreview(view.userAgent) ? null : { name: 'home_viewed' }
}

// Se dispara en la página de publicar antes de la puerta: el toque cuenta aunque después pida
// entrar o verificar el teléfono, que es justo el escalón que se quiere ver (research R6).
export function homePublishTapEvent(request: {
  referer: string | null
  host: string | null
}): TrackedEvent | null {
  return isHomeReferer(request.referer, request.host) ? { name: 'home_publish_tapped' } : null
}
