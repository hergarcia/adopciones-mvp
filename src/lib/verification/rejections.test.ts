import { describe, expect, it } from 'vitest'
import { newestFirst, type Rejection } from './rejections'

const rejection = (rejectedOn: string, sequence: number): Rejection => ({
  rejectedOn,
  reason: 'unreadable',
  sequence,
})

const order = (rejections: Rejection[]) =>
  newestFirst(rejections).map(({ rejectedOn, sequence }) => `${rejectedOn}#${sequence}`)

// Covers: US1-AS1, US1-AS3, US2-AS1, US3-AS1, FR-001, FR-012
describe('el último rechazo va primero', () => {
  it('días distintos, del más nuevo al más viejo, lleguen en el orden que lleguen', () => {
    expect(order([rejection('2026-09-10', 1), rejection('2026-09-21', 2)])).toEqual([
      '2026-09-21#2',
      '2026-09-10#1',
    ])
    expect(order([rejection('2026-09-21', 2), rejection('2026-09-10', 1)])).toEqual([
      '2026-09-21#2',
      '2026-09-10#1',
    ])
  })

  it('el día manda sobre el orden de resolución', () => {
    expect(order([rejection('2026-09-10', 9), rejection('2026-09-21', 2)])).toEqual([
      '2026-09-21#2',
      '2026-09-10#9',
    ])
  })

  it('el mismo día, primero el que se resolvió último', () => {
    expect(order([rejection('2026-09-21', 3), rejection('2026-09-21', 7)])).toEqual([
      '2026-09-21#7',
      '2026-09-21#3',
    ])
    expect(order([rejection('2026-09-21', 7), rejection('2026-09-21', 3)])).toEqual([
      '2026-09-21#7',
      '2026-09-21#3',
    ])
  })

  it('una mezcla de días con uno repetido', () => {
    expect(
      order([
        rejection('2026-09-15', 4),
        rejection('2026-09-21', 5),
        rejection('2026-09-01', 1),
        rejection('2026-09-15', 6),
      ]),
    ).toEqual(['2026-09-21#5', '2026-09-15#6', '2026-09-15#4', '2026-09-01#1'])
  })

  it('no toca la lista que recibe', () => {
    const given = [rejection('2026-09-10', 1), rejection('2026-09-21', 2)]
    newestFirst(given)
    expect(given.map(({ sequence }) => sequence)).toEqual([1, 2])
  })
})
