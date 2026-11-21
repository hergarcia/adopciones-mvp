import { describe, expect, it } from 'vitest'
import { statsView } from './stats-view'
import type { PublicationStats } from './types'

const ZERO: PublicationStats = {
  opens: 0,
  taps: 0,
  phoneStops: 0,
  identityStops: 0,
  applications: 0,
  countedSince: '2026-11-03',
  fromPublication: true,
  requiredLevel: 1,
  code: 'abcdefghjk',
  name: 'Tobi',
  sex: 'male',
}

// Covers: US1-AS12, FR-017
describe('el vacío', () => {
  it('con todo en cero', () => {
    expect(statsView(ZERO)).toEqual({ since: { kind: 'publication' }, kind: 'empty' })
  })

  it.each(['opens', 'taps', 'phoneStops', 'identityStops', 'applications'] as const)(
    'no con %s en uno y lo demás en cero',
    (key) => {
      expect(statsView({ ...ZERO, [key]: 1 }).kind).toBe('counts')
    },
  )
})

// Covers: US1-AS1, US1-AS2, FR-015, FR-016
describe('el renglón de los frenos por la identidad', () => {
  it('con la identidad pedida, aunque todavía no frenó a nadie', () => {
    expect(statsView({ ...ZERO, opens: 3, requiredLevel: 2 })).toEqual({
      since: { kind: 'publication' },
      kind: 'counts',
      showIdentity: true,
    })
  })

  it('con el teléfono pedido y un freno por la identidad de antes de bajar el nivel', () => {
    expect(statsView({ ...ZERO, identityStops: 1 })).toMatchObject({ showIdentity: true })
  })

  it('con el teléfono pedido y ningún freno por la identidad, no', () => {
    expect(statsView({ ...ZERO, opens: 40, phoneStops: 2 })).toMatchObject({ showIdentity: false })
  })
})

// Covers: US1-AS11, FR-012
describe('desde cuándo', () => {
  it('lo publicado antes de la historia, desde el día en que se empezó a contar', () => {
    expect(statsView({ ...ZERO, fromPublication: false }).since).toEqual({
      kind: 'day',
      day: '2026-11-03',
    })
    expect(statsView({ ...ZERO, opens: 1, fromPublication: false }).since).toEqual({
      kind: 'day',
      day: '2026-11-03',
    })
  })

  it('lo publicado después, desde que se publicó', () => {
    expect(statsView({ ...ZERO, opens: 1 }).since).toEqual({ kind: 'publication' })
  })
})
