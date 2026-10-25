import { DRAFT_TTL_DAYS } from './rules'

// Cuánto tardó desde que empezó la carga, acotado: un reloj corrido o un valor inventado no
// pueden dar un tiempo negativo ni de meses.
export function secondsSince(startedAt: string, now: number): number {
  const started = Number(startedAt)
  const limit = DRAFT_TTL_DAYS * 24 * 60 * 60
  if (!Number.isFinite(started) || started > now) return 0
  return Math.min(Math.round((now - started) / 1000), limit)
}
