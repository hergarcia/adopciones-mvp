import type { Publisher } from './types'

const KEYS = { 1: 'level_one', 2: 'level_two', 3: 'level_three' } as const

export type PublisherLevelKey = (typeof KEYS)[keyof typeof KEYS]

// El nivel en palabras (FR-007): la clave de `pets.page`, no el texto. La escalera la decide la base
// (`pet_by_code`); acá solo se nombra. Sin nivel, sin sello: solo pasa cuando el publicador mira su
// ficha oculta, y no se le dice un nivel que hoy no tiene.
export function publisherLevelLabel(level: Publisher['level']): PublisherLevelKey | null {
  return level === null ? null : KEYS[level]
}

export function isPublisherLevel(value: number | null): value is 1 | 2 | 3 {
  return Object.hasOwn(KEYS, String(value))
}
