// Covers: US2-AS3, US2-AS4, US2-AS9, FR-018, FR-019, spec §Edge Cases (el primer aviso es el más
// viejo, el tope de 6 y los repetidos, un aviso sin nada nuevo no lleva parte). Si esto se rompe, a
// Bruno le llega el mismo perro dos veces o le falta lo más nuevo.
import { describe, expect, it } from 'vitest'
import { NO_FILTERS } from '@/lib/pets/listing-query'
import { alertMailParts, mailItemCount } from './mail-parts'
import type { AlertMatch, ClaimedAlert } from './types'

const at = (minute: number) => new Date(Date.UTC(2026, 9, 28, 12, minute)).toISOString()

function pet(code: string, minute: number): AlertMatch {
  return {
    kind: 'pet',
    code,
    name: `Animal ${code}`,
    species: 'dog',
    sex: 'male',
    age: { value: 2, unit: 'years' },
    zone: { department: 'UY-MO', locality: 'Pocitos' },
    coverId: `foto-${code}`,
    firstListedAt: at(minute),
  }
}

function litter(code: string, minute: number): AlertMatch {
  return { ...pet(code, minute), kind: 'litter', youngCount: 5 }
}

function alert(alertId: string, matches: AlertMatch[]): ClaimedAlert {
  return { alertId, filters: { ...NO_FILTERS, species: ['dog'] }, matches }
}

const codes = (alerts: ClaimedAlert[]) =>
  alertMailParts(alerts).map((part) => [part.alertId, part.items.map((item) => item.code)])

describe('alertMailParts', () => {
  it('cada parte lleva su aviso, sus filtros y lo nuevo, en el orden de los avisos', () => {
    const first = alert('a1', [pet('p1', 1)])
    const second = { ...alert('a2', [litter('l1', 2)]), filters: NO_FILTERS }

    expect(alertMailParts([first, second])).toEqual([
      { alertId: 'a1', filters: first.filters, items: [pet('p1', 1)] },
      { alertId: 'a2', filters: NO_FILTERS, items: [litter('l1', 2)] },
    ])
  })

  it('un animal que coincide con dos avisos va una sola vez, en el primero', () => {
    expect(
      codes([alert('a1', [pet('p1', 1), pet('p2', 2)]), alert('a2', [pet('p2', 2), pet('p3', 3)])]),
    ).toEqual([
      ['a1', ['p2', 'p1']],
      ['a2', ['p3']],
    ])
  })

  it('un animal y una camada con el mismo código son dos', () => {
    expect(codes([alert('a1', [pet('x1', 1)]), alert('a2', [litter('x1', 2)])])).toEqual([
      ['a1', ['x1']],
      ['a2', ['x1']],
    ])
  })

  it('lo de la primera aparición más reciente va primero, y a la misma hora, por código', () => {
    expect(
      codes([alert('a1', [pet('b', 1), pet('c', 30), pet('a', 30), pet('d', 5), pet('e', 3)])]),
    ).toEqual([['a1', ['a', 'c', 'd', 'e', 'b']]])
  })

  it('compara instantes, no textos: la misma hora escrita con otro huso', () => {
    const late = { ...pet('a', 0), firstListedAt: '2026-10-28T10:00:00-03:00' }
    const early = { ...pet('b', 0), firstListedAt: '2026-10-28T12:30:00+00:00' }
    expect(codes([alert('a1', [early, late])])).toEqual([['a1', ['a', 'b']]])
  })

  it('cada parte lleva los 6 más recientes; el séptimo no pasa al aviso siguiente', () => {
    const nine = Array.from({ length: 9 }, (_, index) => pet(`p${index}`, index))
    expect(codes([alert('a1', nine), alert('a2', [pet('p0', 0), pet('q1', 20)])])).toEqual([
      ['a1', ['p8', 'p7', 'p6', 'p5', 'p4', 'p3']],
      ['a2', ['q1']],
    ])
  })

  it('un aviso que se quedó sin nada no lleva parte', () => {
    expect(
      codes([
        alert('a1', [pet('p1', 1)]),
        alert('a2', [pet('p1', 1)]),
        alert('a3', [pet('p2', 2)]),
      ]),
    ).toEqual([
      ['a1', ['p1']],
      ['a3', ['p2']],
    ])
  })

  it('sin nada nuevo no hay partes, así que no hay correo', () => {
    expect(alertMailParts([])).toEqual([])
    expect(alertMailParts([alert('a1', [])])).toEqual([])
  })
})

describe('mailItemCount', () => {
  it('suma lo de todas las partes; una camada cuenta como uno', () => {
    const parts = alertMailParts([
      alert('a1', [pet('p1', 1), litter('l1', 2)]),
      alert('a2', [pet('p2', 3)]),
    ])
    expect(mailItemCount(parts)).toBe(3)
    expect(mailItemCount([])).toBe(0)
  })
})
