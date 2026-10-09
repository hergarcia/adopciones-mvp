import { QUEUE_KEYS, type QueueKey, type QueueStanding } from './types'

const HOUR_MS = 3_600_000
const DAY_HOURS = 24

/** El plazo de cada cola, contado desde que el pendiente entró (FR-011). */
export const QUEUE_DEADLINE_HOURS: Record<QueueKey, number> = {
  identity: 48,
  pets: 24,
  reports: 48,
}

/**
 * Cómo está una cola para quien mira, por su pendiente más viejo de lo que puede resolver: al día
 * mientras espera hasta su plazo inclusive, atrasada recién al pasarlo (spec §Edge Cases).
 */
export function queueStanding(queue: QueueKey, oldest: Date | null, now: Date): QueueStanding {
  if (oldest === null) return { kind: 'clear' }
  // El reloj de la base puede ir unos milisegundos adelante del de la aplicación.
  const waitedMs = Math.max(0, now.getTime() - oldest.getTime())
  const overMs = waitedMs - QUEUE_DEADLINE_HOURS[queue] * HOUR_MS
  return overMs > 0 ? { kind: 'overdue', waitedMs, overMs } : { kind: 'on_time', waitedMs }
}

const overOf = (standing: QueueStanding | null) =>
  standing?.kind === 'overdue' ? standing.overMs : 0

/**
 * Las atrasadas primero, de la que más se pasó a la que menos; después, y en los empates, el orden
 * fijo (FR-012). Una cola que no se pudo contar (`null`) va en su lugar fijo.
 */
export function orderQueues<T extends { queue: QueueKey; standing: QueueStanding | null }>(
  items: readonly T[],
): T[] {
  return [...items].sort(
    (a, b) =>
      overOf(b.standing) - overOf(a.standing) ||
      QUEUE_KEYS.indexOf(a.queue) - QUEUE_KEYS.indexOf(b.queue),
  )
}

export type WaitParts =
  { unit: 'under_hour' } | { unit: 'hours'; value: number } | { unit: 'days'; value: number }

/** Cómo se dice una espera o un atraso: horas enteras debajo de 24, días enteros desde 24. */
export function waitParts(ms: number): WaitParts {
  const hours = Math.floor(ms / HOUR_MS)
  if (hours < 1) return { unit: 'under_hour' }
  if (hours < DAY_HOURS) return { unit: 'hours', value: hours }
  return { unit: 'days', value: Math.floor(hours / DAY_HOURS) }
}

/** Las horas enteras de una espera, para los eventos. */
export function wholeHours(ms: number): number {
  return Math.floor(ms / HOUR_MS)
}
