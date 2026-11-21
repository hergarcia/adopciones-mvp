// «¿Por dónde te encontró?» al marcar adoptado por fuera del sitio (historia #254). Solo viaja en la
// medición de esa adopción: no se guarda ni lo ve nadie (research R1).

/** En el orden de la historia, que es el de la pantalla. */
export const FOUND_VIA_OPTIONS = [
  'facebook',
  'instagram',
  'whatsapp',
  'seen_here',
  'someone_known',
  'other',
] as const
export type FoundVia = (typeof FOUND_VIA_OPTIONS)[number]

/** Lo que se cuenta de una adopción por fuera: la opción, o que no eligió ninguna. */
export type FoundViaAnswer = FoundVia | 'unanswered'

/** Lo elegido en la pantalla; vacío, o algo que no es una opción, es que no eligió (null). */
export function foundViaOf(selected: string): FoundVia | null {
  return FOUND_VIA_OPTIONS.find((option) => option === selected) ?? null
}
