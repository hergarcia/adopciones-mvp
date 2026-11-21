import type { VerificationLevel } from '@/lib/verification/level'
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

// Lo que dicen las publicaciones de quien tiene la sesión, desde su lugar en la escalera (historia
// #283). En 0 la ficha no dice ningún nivel, porque nadie más ve sus animales: no hay nada que mostrar.
export function ownPublicationsLevel(level: VerificationLevel): PublisherLevelKey | null {
  return publisherLevelLabel(level === 0 ? null : level)
}
