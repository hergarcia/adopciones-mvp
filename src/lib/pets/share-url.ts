import { APP_URL } from '@/lib/config'

// La misma para todas las fichas y todas las personas: no dice quién compartió, ni desde qué
// cuenta, ni cuándo (FR-024). `desde` ya es el nombre de las marcas de origen del sitio (#73).
export const SHARE_MARK = { param: 'desde', value: 'compartir' } as const

/**
 * El enlace de la ficha —la de un animal o la de una camada—, siempre con la dirección del sitio:
 * nunca la de la barra (FR-013 de la #57). Lleva la marca de Compartir para que la visita cuente como
 * compartida desde el sitio.
 */
export function shareUrl(path: string): string {
  const url = new URL(path, APP_URL)
  url.searchParams.set(SHARE_MARK.param, SHARE_MARK.value)
  return url.toString()
}
