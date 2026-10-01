export type PublishedAgo =
  | { unit: 'today' | 'yesterday'; count: 0 | 1 }
  | { unit: 'days' | 'weeks' | 'months'; count: number }

const DAY_MS = 86_400_000

function dayNumber(day: string): number {
  const [year, month, date] = day.split('-').map(Number)
  return Date.UTC(year, month - 1, date) / DAY_MS
}

// Días de calendario de Uruguay: los dos días llegan ya como `uruguayDay`. Los cortes son los de
// hablar de un posteo (spec Edge Cases «Hace cuánto se publicó»): semanas y meses enteros, hacia
// abajo; el día 60 ya es «hace 2 meses».
export function publishedAgo(publishedOn: string, today: string): PublishedAgo {
  const days = Math.max(0, dayNumber(today) - dayNumber(publishedOn))
  if (days === 0) return { unit: 'today', count: 0 }
  if (days === 1) return { unit: 'yesterday', count: 1 }
  if (days < 14) return { unit: 'days', count: days }
  if (days < 60) return { unit: 'weeks', count: Math.floor(days / 7) }
  return { unit: 'months', count: Math.floor(days / 30) }
}
