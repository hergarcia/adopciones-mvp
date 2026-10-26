// Covers: US1-AS1, US1-AS2, FR-023 (la bandeja agrupada por camada, research R7)
import { describe, expect, it } from 'vitest'
import { groupInbox, type InboxEntry } from './inbox-groups'
import type { InboxPet } from './types'

const LUNA = { id: 'luna', code: 'lunacode00', name: 'La camada de Luna' }
const MORA = { id: 'mora', code: 'moracode00', name: 'Los de Mora' }

function pet(
  name: string,
  counts: { fresh?: number; waiting?: number; last?: string | null } = {},
): InboxPet {
  return {
    petId: name,
    code: `${name}-code`,
    name,
    cover: null,
    fresh: counts.fresh ?? 0,
    waiting: counts.waiting ?? 0,
    lastSentAt: counts.last === undefined ? '2026-10-01T10:00:00Z' : counts.last,
    litter: null,
  }
}

function young(
  litter: typeof LUNA,
  position: number,
  counts: { fresh?: number; waiting?: number; last?: string | null } = {},
): InboxPet {
  return { ...pet(`${litter.id}-${position}`, counts), litter: { ...litter, position } }
}

function names(entries: InboxEntry[]): string[] {
  return entries.map((entry) => (entry.kind === 'pet' ? entry.pet.name : entry.litter.name))
}

describe('groupInbox', () => {
  it('un animal suelto queda como una entrada propia, con sus cuentas', () => {
    const tobi = pet('Tobi', { fresh: 1, waiting: 2, last: '2026-10-03T10:00:00Z' })
    expect(groupInbox([tobi])).toEqual([
      { kind: 'pet', fresh: 1, waiting: 2, lastSentAt: '2026-10-03T10:00:00Z', pet: tobi },
    ])
  })

  it('las crías de una camada van juntas, en su orden, con las sumas y la más reciente', () => {
    const rows = [
      young(LUNA, 3, { last: null }),
      young(LUNA, 1, { fresh: 2, waiting: 3, last: '2026-10-02T10:00:00Z' }),
      young(LUNA, 2, { fresh: 1, waiting: 1, last: '2026-10-04T10:00:00Z' }),
    ]
    const [entry, ...rest] = groupInbox(rows)
    expect(rest).toEqual([])
    expect(entry).toEqual({
      kind: 'litter',
      fresh: 3,
      waiting: 4,
      lastSentAt: '2026-10-04T10:00:00Z',
      litter: { ...LUNA, young: [rows[1], rows[2], rows[0]] },
    })
  })

  it('la más reciente de la camada no depende del orden de las crías', () => {
    const rows = [
      young(LUNA, 1, { waiting: 1, last: '2026-10-05T10:00:00Z' }),
      young(LUNA, 2, { waiting: 1, last: '2026-10-02T10:00:00Z' }),
    ]
    expect(groupInbox(rows)[0]?.lastSentAt).toBe('2026-10-05T10:00:00Z')
  })

  it('una camada con una sola cría pedida trae a las demás en cero', () => {
    const rows = [
      young(LUNA, 1, { last: null }),
      young(LUNA, 2, { waiting: 1, last: '2026-10-02T10:00:00Z' }),
    ]
    const [entry] = groupInbox(rows)
    expect(entry?.kind === 'litter' ? entry.litter.young.map((one) => one.petId) : []).toEqual([
      'luna-1',
      'luna-2',
    ])
    expect(entry).toMatchObject({ fresh: 0, waiting: 1, lastSentAt: '2026-10-02T10:00:00Z' })
  })

  it('un animal suelto sin solicitudes no entra, ni una camada sin ninguna', () => {
    expect(groupInbox([pet('Sola', { last: null }), young(MORA, 1, { last: null })])).toEqual([])
  })

  it('mezcla animales y camadas con la regla de siempre: nuevas, después esperan, más reciente', () => {
    const rows = [
      pet('sin-espera', { last: '2026-10-09T10:00:00Z' }),
      young(MORA, 1, { waiting: 1, last: '2026-10-05T10:00:00Z' }),
      pet('espera', { waiting: 1, last: '2026-10-06T10:00:00Z' }),
      young(LUNA, 1, { last: '2026-10-01T10:00:00Z' }),
      young(LUNA, 2, { fresh: 1, waiting: 1, last: '2026-10-02T10:00:00Z' }),
      pet('nueva', { fresh: 1, waiting: 1, last: '2026-10-03T10:00:00Z' }),
    ]
    expect(names(groupInbox(rows))).toEqual(['nueva', LUNA.name, 'espera', MORA.name, 'sin-espera'])
  })

  it('dos camadas no se mezclan y no cambia la lista que recibe', () => {
    const rows = [
      young(LUNA, 2, { last: '2026-10-02T10:00:00Z' }),
      young(MORA, 1, { last: '2026-10-03T10:00:00Z' }),
      young(LUNA, 1, { last: '2026-10-01T10:00:00Z' }),
    ]
    const copy = [...rows]
    const entries = groupInbox(rows)
    expect(rows).toEqual(copy)
    expect(
      entries.map((entry) =>
        entry.kind === 'litter' ? entry.litter.young.map((one) => one.petId) : [],
      ),
    ).toEqual([['mora-1'], ['luna-1', 'luna-2']])
  })
})
