// Covers: SC-006, FR-050 (las horas de `report_closed`)
import { describe, expect, it } from 'vitest'
import { reportHours } from './report-age'

const CREATED = new Date('2026-10-01T12:00:00.000Z')
const after = (minutes: number) => new Date(CREATED.getTime() + minutes * 60_000)

describe('reportHours', () => {
  it.each([
    [0, 0],
    [29, 0],
    [30, 1],
    [59, 1],
    [60, 1],
    [89, 1],
    [90, 2],
    [23 * 60, 23],
    [24 * 60, 24],
    [24 * 60 * 7 + 20, 168],
  ])('a los %i minutos son %i horas', (minutes, hours) => {
    expect(reportHours(CREATED, after(minutes))).toBe(hours)
  })

  it('un reloj atrasado no da horas negativas', () => {
    expect(reportHours(CREATED, after(-90))).toBe(0)
  })
})
