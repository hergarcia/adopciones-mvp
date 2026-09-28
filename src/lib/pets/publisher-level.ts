import type { Publisher } from './types'

export type PublisherLevelKey = 'level_one' | 'level_two'

// El nivel en palabras (FR-007): la clave de `pets.page`, no el texto. Sin nivel, sin sello: solo
// pasa cuando el publicador mira su ficha oculta, y no se le dice un nivel que hoy no tiene.
export function publisherLevelLabel(level: Publisher['level']): PublisherLevelKey | null {
  if (level === null) return null
  return level === 2 ? 'level_two' : 'level_one'
}
