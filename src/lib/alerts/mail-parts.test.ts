// Covers: US2-AS3, US2-AS4, US2-AS9, FR-018, FR-019, spec §Edge Cases (el primer aviso es el más
// viejo, el tope de 6 y los repetidos, un aviso sin nada nuevo no lleva parte). Si esto se rompe, a
// Bruno le llega el mismo perro dos veces o le falta lo más nuevo. Y #267 (criterio 2): el asunto
// cuenta todo lo nuevo, también lo que no entra en los 6, sin contar dos veces al mismo. #285 FR-020
// (US3-AS4): la parte de un aviso con «Solo de quien verificó su identidad» lo nombra y su enlace lo
// marca, con los textos de verdad, como los arma el correo. #287 US2-AS1 a US2-AS6, FR-010 a FR-015:
// lo que trae un aviso con ese filtro va en su parte aunque un aviso más viejo sin él también lo
// traiga; si se rompe, esa parte nunca llega y Bruno cree que el aviso no anda.
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { listingHref, NO_FILTERS } from '@/lib/pets/listing-query'
import { alertName } from './alert-name'
import { alertNameWords } from './alert-name-texts'
import { alertMailParts, mailItemCount, mailNewCount } from './mail-parts'
import type { AlertFilters, AlertMatch, ClaimedAlert } from './types'

vi.mock('next-intl/server', async () => {
  const { createTranslator } = await import('next-intl')
  const messages = JSON.parse(readFileSync('messages/es.json', 'utf8'))
  return {
    getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
      createTranslator({ locale, messages, namespace }),
  }
})

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
      { alertId: 'a1', filters: first.filters, items: [pet('p1', 1)], total: 1 },
      { alertId: 'a2', filters: NO_FILTERS, items: [litter('l1', 2)], total: 1 },
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

  it('cuenta solo lo que entra en los 6 de cada parte', () => {
    const nine = Array.from({ length: 9 }, (_, index) => pet(`p${index}`, index))
    expect(mailItemCount(alertMailParts([alert('a1', nine), alert('a2', [pet('g1', 1)])]))).toBe(7)
  })
})

describe('mailNewCount', () => {
  it('9 perros y un gato son 10, aunque la parte de los perros muestre 6', () => {
    const nine = Array.from({ length: 9 }, (_, index) => pet(`p${index}`, index))
    const parts = alertMailParts([alert('a1', nine), alert('a2', [pet('g1', 1)])])
    expect(parts.map((part) => [part.items.length, part.total])).toEqual([
      [6, 9],
      [1, 1],
    ])
    expect(mailNewCount(parts)).toBe(10)
  })

  it('un perro que coincide con los dos avisos cuenta una vez; una camada, como uno', () => {
    const parts = alertMailParts([
      alert('a1', [pet('p1', 1), litter('l1', 2)]),
      alert('a2', [pet('p1', 1), pet('p2', 3)]),
    ])
    expect(mailNewCount(parts)).toBe(3)
    expect(mailNewCount([])).toBe(0)
  })

  it('lo que quedó fuera de los 6 en el primer aviso no se cuenta de nuevo en el segundo', () => {
    const nine = Array.from({ length: 9 }, (_, index) => pet(`p${index}`, index))
    const parts = alertMailParts([alert('a1', nine), alert('a2', [pet('p0', 0), pet('q1', 20)])])
    expect(parts.map((part) => part.total)).toEqual([9, 1])
    expect(mailNewCount(parts)).toBe(10)
  })
})

describe('la parte de un aviso con el filtro de identidad (#285)', () => {
  const dogsInMontevideo: AlertFilters = { ...NO_FILTERS, species: ['dog'], department: ['UY-MO'] }
  const identityOnly: AlertFilters = { ...dogsInMontevideo, publisher: ['identity'] }
  const matches = [pet('p1', 1), litter('l1', 2)]

  it('lleva el filtro, así el nombre y el enlace lo suman; el resto de la parte queda igual', async () => {
    const [withFilter] = alertMailParts([{ alertId: 'a1', filters: identityOnly, matches }])
    const [without] = alertMailParts([{ alertId: 'a1', filters: dogsInMontevideo, matches }])
    const words = await alertNameWords('es')

    expect(withFilter?.filters).toEqual(identityOnly)
    expect(alertName(withFilter?.filters ?? NO_FILTERS, words)).toBe(
      'Perros en Montevideo, de quien verificó su identidad',
    )
    expect(alertName(without?.filters ?? NO_FILTERS, words)).toBe('Perros en Montevideo')
    expect(listingHref(withFilter?.filters ?? NO_FILTERS)).toBe(
      `${listingHref(dogsInMontevideo)}&quien-publica=identidad`,
    )
    expect({ ...withFilter, filters: null }).toEqual({ ...without, filters: null })
  })
})

describe('el reparto con el filtro de identidad (#287)', () => {
  const dogsInMontevideo: AlertFilters = { ...NO_FILTERS, species: ['dog'], department: ['UY-MO'] }
  const verifiedDogsInMontevideo: AlertFilters = { ...dogsInMontevideo, publisher: ['identity'] }
  const verifiedDogs: AlertFilters = { ...NO_FILTERS, species: ['dog'], publisher: ['identity'] }
  const plain = (alertId: string, matches: AlertMatch[]): ClaimedAlert => ({
    alertId,
    filters: dogsInMontevideo,
    matches,
  })
  const verified = (
    alertId: string,
    matches: AlertMatch[],
    filters = verifiedDogsInMontevideo,
  ) => ({
    alertId,
    filters,
    matches,
  })

  // Covers: US2-AS1
  it('Tobi, de Carla, va en el aviso más nuevo con el filtro; Rulo, de Rita, en el viejo; cuenta 2', () => {
    const tobi = pet('tobi', 1)
    const rulo = pet('rulo', 2)
    const parts = alertMailParts([plain('a1', [tobi, rulo]), verified('a2', [tobi])])

    expect(parts).toEqual([
      { alertId: 'a1', filters: dogsInMontevideo, items: [rulo], total: 1 },
      { alertId: 'a2', filters: verifiedDogsInMontevideo, items: [tobi], total: 1 },
    ])
    expect(mailNewCount(parts)).toBe(2)
  })

  // Covers: US2-AS2, FR-013
  it('si los dos avisos traen lo mismo, sale solo la parte con el filtro', () => {
    const both = [pet('p1', 1), pet('p2', 2)]
    expect(codes([plain('a1', both), verified('a2', both)])).toEqual([['a2', ['p2', 'p1']]])
  })

  // Covers: US2-AS3
  it('entre dos avisos con el filtro, va en el más viejo', () => {
    const dog = pet('p1', 1)
    expect(
      codes([verified('a1', [dog], verifiedDogs), verified('a2', [dog]), plain('a3', [dog])]),
    ).toEqual([['a1', ['p1']]])
  })

  // Covers: US2-AS4, FR-011
  it('si ninguno tiene el filtro, va en el más viejo, como hoy', () => {
    const dog = pet('p1', 1)
    expect(codes([plain('a1', [dog]), plain('a2', [dog, pet('p2', 2)])])).toEqual([
      ['a1', ['p1']],
      ['a2', ['p2']],
    ])
  })

  // Covers: US2-AS5
  it('una camada sigue la misma regla y cuenta como una', () => {
    const camada = litter('l1', 1)
    const parts = alertMailParts([plain('a1', [camada]), verified('a2', [camada])])
    expect(parts.map((part) => [part.alertId, part.items.map((item) => item.code)])).toEqual([
      ['a2', ['l1']],
    ])
    expect(mailItemCount(parts)).toBe(1)
    expect(mailNewCount(parts)).toBe(1)
  })

  // Covers: US2-AS6, FR-014
  it('lo que no entra en los 6 de la parte con el filtro no pasa a la otra y se cuenta una vez', () => {
    const nine = Array.from({ length: 9 }, (_, index) => pet(`p${index}`, index))
    const parts = alertMailParts([plain('a1', [...nine, pet('q1', 20)]), verified('a2', nine)])

    expect(
      parts.map((part) => [part.alertId, part.items.map((item) => item.code), part.total]),
    ).toEqual([
      ['a1', ['q1'], 1],
      ['a2', ['p8', 'p7', 'p6', 'p5', 'p4', 'p3'], 9],
    ])
    expect(mailNewCount(parts)).toBe(10)
  })

  // Covers: FR-015
  it('las partes siguen en el orden de los avisos, aunque el del filtro sea el más nuevo', () => {
    expect(
      codes([
        plain('a1', [pet('p1', 1)]),
        verified('a2', [pet('p2', 2)]),
        plain('a3', [pet('p3', 3)]),
      ]),
    ).toEqual([
      ['a1', ['p1']],
      ['a2', ['p2']],
      ['a3', ['p3']],
    ])
  })
})
