import { daysSincePublished } from '@/lib/analytics/pet-events'

/**
 * Cuántos días lleva esperando (FR-004): días de calendario de Uruguay desde que se mandó, «hoy» el
 * mismo día y «1 día» al siguiente, la misma cuenta que «Publicado hace…».
 */
export function daysWaiting(sentAt: Date, now: Date): number {
  return daysSincePublished(sentAt, now)
}
