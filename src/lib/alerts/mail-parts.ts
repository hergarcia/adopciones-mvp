import { ALERT_PART_MAX } from './rules'
import type { AlertMailPart, AlertMatch, ClaimedAlert } from './types'

const keyOf = (match: AlertMatch) => `${match.kind}:${match.code}`

function newestFirst(a: AlertMatch, b: AlertMatch): number {
  return Date.parse(b.firstListedAt) - Date.parse(a.firstListedAt) || a.code.localeCompare(b.code)
}

// Las partes del correo (research R4): cada animal o camada va una sola vez, en el primer aviso que
// lo trae, aunque ahí quede fuera de los 6; lo más nuevo primero. Sin partes, no hay correo.
export function alertMailParts(alerts: readonly ClaimedAlert[]): AlertMailPart[] {
  const taken = new Set<string>()
  return alerts.flatMap(({ alertId, filters, matches }) => {
    const own = matches.filter((match) => {
      const key = keyOf(match)
      if (taken.has(key)) return false
      taken.add(key)
      return true
    })
    const items = own.toSorted(newestFirst).slice(0, ALERT_PART_MAX)
    return items.length === 0 ? [] : [{ alertId, filters, items, total: own.length }]
  })
}

/** Cuántos animales y camadas lleva el correo a la vista: una camada es uno. */
export function mailItemCount(parts: readonly AlertMailPart[]): number {
  return parts.reduce((total, part) => total + part.items.length, 0)
}

// Lo que dicen el asunto y el título (#267): todo lo nuevo, también lo que quedó fuera de los 6 de
// una parte. Cada animal está en una sola parte, así que sumar no cuenta dos veces al mismo.
export function mailNewCount(parts: readonly AlertMailPart[]): number {
  return parts.reduce((total, part) => total + part.total, 0)
}
