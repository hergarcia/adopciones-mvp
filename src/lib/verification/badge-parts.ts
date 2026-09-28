import type { VerificationLevel } from './level'

export type BadgeLevel = Exclude<VerificationLevel, 0>

export type BadgeParts = {
  /** Papel con contorno yerba en nivel 1; yerba lleno desde nivel 2. */
  fill: 'paper' | 'primary'
  check: boolean
  /** El anillo grabado adentro del aro: «avalado». */
  ring: boolean
  label: 'badge_level_1' | 'badge_level_2' | 'badge_level_3'
}

// Lo que distingue a cada chapita, además del texto al lado: el nivel nunca lo dice solo el color
// (docs/10 §Piso de accesibilidad). La chapita solo pinta esto.
export function badgeParts(level: BadgeLevel): BadgeParts {
  if (level === 1) return { fill: 'paper', check: false, ring: false, label: 'badge_level_1' }
  if (level === 2) return { fill: 'primary', check: true, ring: false, label: 'badge_level_2' }
  return { fill: 'primary', check: true, ring: true, label: 'badge_level_3' }
}
