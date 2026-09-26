import { clockTime } from './retry-at'

export type ClaimDeadline = { label: string; msLeft: number }

// Hasta qué hora se puede confirmar, en la zona pasada a mano (FR-005a), y cuánto falta para que
// la pantalla cambie sola. En cero la prueba ya no vale: la base compara `valid_until > now()`.
export function claimDeadline(
  validUntil: Date,
  now: Date,
  options: { timeZone: string; locale: string },
): ClaimDeadline {
  return {
    label: clockTime(validUntil, options),
    msLeft: Math.max(validUntil.getTime() - now.getTime(), 0),
  }
}
