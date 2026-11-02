import { ALERT_PART_MAX } from './rules'
import type { AlertMailPart, AlertMatch, ClaimedAlert } from './types'

const keyOf = (match: AlertMatch) => `${match.kind}:${match.code}`

function newestFirst(a: AlertMatch, b: AlertMatch): number {
  return Date.parse(b.firstListedAt) - Date.parse(a.firstListedAt) || a.code.localeCompare(b.code)
}

const hasIdentityFilter = ({ filters }: ClaimedAlert) => filters.publisher.includes('identity')

// Las partes del correo (research R4, #287 R7): cada animal o camada va una sola vez, en el aviso más
// viejo con «Solo de quien verificó su identidad» que lo trae, y si ninguno lo tiene, en el más viejo
// que lo trae. Quien pidió esperar a una persona verificada ve así que ese aviso anda. Va ahí aunque
// quede fuera de los 6; lo más nuevo primero. Sin partes, no hay correo.
export function alertMailParts(alerts: readonly ClaimedAlert[]): AlertMailPart[] {
  const owners = new Map<string, string>()
  for (const alert of [...alerts.filter(hasIdentityFilter), ...alerts]) {
    for (const match of alert.matches) {
      const key = keyOf(match)
      if (!owners.has(key)) owners.set(key, alert.alertId)
    }
  }
  return alerts.flatMap(({ alertId, filters, matches }) => {
    const own = matches.filter((match) => owners.get(keyOf(match)) === alertId)
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
