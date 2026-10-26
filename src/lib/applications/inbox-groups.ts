import { inboxOrder } from './inbox-order'
import type { InboxLitterRef, InboxPet, InboxRank } from './types'

export type InboxLitterGroup = { id: string; code: string; name: string; young: InboxPet[] }

/** Una entrada de Solicitudes: un animal suelto, o una camada con todas sus crías adentro. */
export type InboxEntry = InboxRank &
  ({ kind: 'pet'; pet: InboxPet } | { kind: 'litter'; litter: InboxLitterGroup })

type Placed = { row: InboxPet; position: number }

// Las fechas de la base son ISO con la misma zona: ordenarlas como texto las ordena en el tiempo.
function latest(dates: (string | null)[]): string | null {
  return (
    dates
      .filter((date) => date !== null)
      .sort()
      .at(-1) ?? null
  )
}

function litterEntry(ref: InboxLitterRef, placed: Placed[]): InboxEntry[] {
  const young = [...placed].sort((a, b) => a.position - b.position).map((one) => one.row)
  const lastSentAt = latest(young.map((one) => one.lastSentAt))
  if (lastSentAt === null) return []
  return [
    {
      kind: 'litter',
      waiting: young.reduce((sum, one) => sum + one.waiting, 0),
      fresh: young.reduce((sum, one) => sum + one.fresh, 0),
      lastSentAt,
      litter: { id: ref.id, code: ref.code, name: ref.name, young },
    },
  ]
}

// Solicitudes agrupadas (historia #206, research R7): un animal suelto queda como en #65; las crías de
// una camada van juntas, en el orden de la camada, y la camada se ordena con las sumas de sus crías
// por la misma regla que un animal. Un animal sin solicitudes solo entra como cría de una camada que
// tiene alguna.
export function groupInbox(rows: readonly InboxPet[]): InboxEntry[] {
  const litters = new Map<string, { ref: InboxLitterRef; placed: Placed[] }>()
  const entries: InboxEntry[] = []
  for (const row of rows) {
    if (row.litter !== null) {
      const group = litters.get(row.litter.id) ?? { ref: row.litter, placed: [] }
      group.placed.push({ row, position: row.litter.position })
      litters.set(row.litter.id, group)
    } else if (row.lastSentAt !== null) {
      entries.push({
        kind: 'pet',
        waiting: row.waiting,
        fresh: row.fresh,
        lastSentAt: row.lastSentAt,
        pet: row,
      })
    }
  }
  const grouped = [...litters.values()].flatMap((group) => litterEntry(group.ref, group.placed))
  return inboxOrder([...entries, ...grouped])
}
