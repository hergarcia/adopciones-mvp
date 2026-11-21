import type { PublicationStats } from './types'

export type StatsSince = { kind: 'publication' } | { kind: 'day'; day: string }

export type StatsShape = { since: StatsSince } & (
  { kind: 'empty' } | { kind: 'counts'; showIdentity: boolean }
)

// El vacío es solo con todo en cero: una publicación anterior a la historia puede tener solicitudes
// y ninguna apertura contada, y decirle «todavía nadie abrió la ficha» sería falso (FR-017). El
// renglón de la identidad sigue a la vista si ya frenó a alguien aunque hoy pida solo el teléfono:
// esconderlo borraría un número que existió (FR-016).
export function statsView(stats: PublicationStats): StatsShape {
  const since: StatsSince = stats.fromPublication
    ? { kind: 'publication' }
    : { kind: 'day', day: stats.countedSince }
  const counts = [
    stats.opens,
    stats.taps,
    stats.phoneStops,
    stats.identityStops,
    stats.applications,
  ]
  if (counts.every((count) => count === 0)) return { since, kind: 'empty' }
  return {
    since,
    kind: 'counts',
    showIdentity: stats.requiredLevel === 2 || stats.identityStops > 0,
  }
}
