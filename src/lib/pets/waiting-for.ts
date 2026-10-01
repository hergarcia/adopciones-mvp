export type WaitingFor = { unit: 'minutes' | 'hours' | 'days'; count: number }

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

// Desde cuándo espera una publicación por revisar (spec §Pantallas): «hace 3 horas», «hace 2 días»,
// siempre hacia abajo. Menos de un minuto se dice como uno: «hace 0 minutos» no dice nada.
export function waitingFor(since: Date, now: Date): WaitingFor {
  const elapsed = now.getTime() - since.getTime()
  if (elapsed < HOUR_MS) {
    return { unit: 'minutes', count: Math.max(1, Math.floor(elapsed / MINUTE_MS)) }
  }
  if (elapsed < DAY_MS) return { unit: 'hours', count: Math.floor(elapsed / HOUR_MS) }
  return { unit: 'days', count: Math.floor(elapsed / DAY_MS) }
}
