import { APP_URL } from '@/lib/config'

// La misma para todas las fichas y todas las personas: no dice quién compartió, ni desde qué
// cuenta, ni cuándo (FR-024). `desde` ya es el nombre de las marcas de origen del sitio (#73).
export const MARK_PARAM = 'desde'

/**
 * El valor de la marca de cada enlace que sale del sitio: el de «Compartir» y el texto para el grupo
 * (`shared`), y el de la respuesta para quien escribe por privado (`reply`, historia #250), que se
 * cuenta aparte para saber si quien ya eligió el chat acepta verificarse.
 */
export const LINK_MARKS = { shared: 'compartir', reply: 'respuesta' } as const
export type LinkMark = keyof typeof LINK_MARKS

/**
 * El enlace de la ficha —la de un animal o la de una camada—, siempre con la dirección del sitio:
 * nunca la de la barra (FR-013 de la #57). Lleva la marca para que la visita cuente con su origen.
 */
export function shareUrl(path: string, mark: LinkMark = 'shared'): string {
  const url = new URL(path, APP_URL)
  url.searchParams.set(MARK_PARAM, LINK_MARKS[mark])
  return url.toString()
}
