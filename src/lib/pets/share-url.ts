import { APP_URL } from '@/lib/config'
import { petPath } from './paths'

/** El enlace de la ficha, siempre con la dirección del sitio: nunca la de la barra (FR-013). */
export function shareUrl(code: string): string {
  return new URL(petPath(code), APP_URL).toString()
}
