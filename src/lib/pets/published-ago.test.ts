// Covers: FR-006 y el Edge Case «Hace cuánto se publicó».
import { describe, expect, it } from 'vitest'
import { uruguayDay } from './age'
import { publishedAgo } from './published-ago'

const PUBLISHED = '2026-01-10'
const plus = (days: number) => new Date(Date.UTC(2026, 0, 10 + days)).toISOString().slice(0, 10)

describe('publishedAgo', () => {
  it.each([
    [0, { unit: 'today', count: 0 }],
    [1, { unit: 'yesterday', count: 1 }],
    [2, { unit: 'days', count: 2 }],
    [13, { unit: 'days', count: 13 }],
    [14, { unit: 'weeks', count: 2 }],
    [20, { unit: 'weeks', count: 2 }],
    [21, { unit: 'weeks', count: 3 }],
    [59, { unit: 'weeks', count: 8 }],
    [60, { unit: 'months', count: 2 }],
    [89, { unit: 'months', count: 2 }],
    [90, { unit: 'months', count: 3 }],
    [400, { unit: 'months', count: 13 }],
  ])('el día %i', (days, expected) => {
    expect(publishedAgo(PUBLISHED, plus(days))).toEqual(expected)
  })

  it('cruza meses y años contando días de calendario', () => {
    expect(publishedAgo('2025-12-31', '2026-01-01')).toEqual({ unit: 'yesterday', count: 1 })
    expect(publishedAgo('2026-02-28', '2026-03-14')).toEqual({ unit: 'weeks', count: 2 })
  })

  it('un reloj adelantado del lado de la base no da un día negativo', () => {
    expect(publishedAgo('2026-01-11', '2026-01-10')).toEqual({ unit: 'today', count: 0 })
  })

  it('el día cambia a la medianoche de Uruguay, no a la de UTC', () => {
    const published = uruguayDay(new Date('2026-03-01T12:00:00Z'))
    expect(publishedAgo(published, uruguayDay(new Date('2026-03-02T02:30:00Z')))).toEqual({
      unit: 'today',
      count: 0,
    })
    expect(publishedAgo(published, uruguayDay(new Date('2026-03-02T03:30:00Z')))).toEqual({
      unit: 'yesterday',
      count: 1,
    })
  })
})
