// Covers: FR-011, FR-012, US1-AS1, US1-AS4, spec §Edge Cases (justo en el plazo, empates), spec
// §Vocabulario (cómo se dice una espera)
import { describe, expect, it } from 'vitest'
import { orderQueues, queueStanding, waitParts, wholeHours } from './queues'
import type { QueueKey, QueueStanding } from './types'

const HOUR = 3_600_000
const NOW = new Date('2026-10-09T12:00:00.000Z')
const ago = (ms: number) => new Date(NOW.getTime() - ms)

describe('queueStanding', () => {
  it('sin pendientes que pueda resolver, la cola está en cero', () => {
    expect(queueStanding('identity', null, NOW)).toEqual({ kind: 'clear' })
  })

  it('justo en el plazo todavía está al día; un milisegundo después, atrasada por ese milisegundo', () => {
    expect(queueStanding('identity', ago(48 * HOUR), NOW)).toEqual({
      kind: 'on_time',
      waitedMs: 48 * HOUR,
    })
    expect(queueStanding('identity', ago(48 * HOUR + 1), NOW)).toEqual({
      kind: 'overdue',
      waitedMs: 48 * HOUR + 1,
      overMs: 1,
    })
  })

  it('cada cola con su plazo: publicaciones 24 horas, reportes 48', () => {
    expect(queueStanding('pets', ago(24 * HOUR), NOW)).toEqual({
      kind: 'on_time',
      waitedMs: 24 * HOUR,
    })
    expect(queueStanding('pets', ago(26 * HOUR), NOW)).toEqual({
      kind: 'overdue',
      waitedMs: 26 * HOUR,
      overMs: 2 * HOUR,
    })
    expect(queueStanding('reports', ago(30 * HOUR), NOW)).toEqual({
      kind: 'on_time',
      waitedMs: 30 * HOUR,
    })
    expect(queueStanding('reports', ago(51 * HOUR), NOW)).toEqual({
      kind: 'overdue',
      waitedMs: 51 * HOUR,
      overMs: 3 * HOUR,
    })
  })

  it('un pendiente con el reloj de la base adelantado espera cero, no menos', () => {
    expect(queueStanding('pets', new Date(NOW.getTime() + 5), NOW)).toEqual({
      kind: 'on_time',
      waitedMs: 0,
    })
  })
})

type Item = { queue: QueueKey; standing: QueueStanding | null }
const onTime: QueueStanding = { kind: 'on_time', waitedMs: HOUR }
const over = (overMs: number): QueueStanding => ({ kind: 'overdue', waitedMs: overMs, overMs })
const keys = (items: Item[]) => orderQueues(items).map((item) => item.queue)

describe('orderQueues', () => {
  it('al día, el orden fijo, venga como venga', () => {
    expect(
      keys([
        { queue: 'reports', standing: { kind: 'clear' } },
        { queue: 'pets', standing: onTime },
        { queue: 'identity', standing: onTime },
      ]),
    ).toEqual(['identity', 'pets', 'reports'])
  })

  it('las atrasadas primero, de la que más se pasó a la que menos (US1-AS4)', () => {
    expect(
      keys([
        { queue: 'identity', standing: onTime },
        { queue: 'pets', standing: over(48 * HOUR) },
        { queue: 'reports', standing: over(3 * HOUR) },
      ]),
    ).toEqual(['pets', 'reports', 'identity'])
    expect(
      keys([
        { queue: 'identity', standing: over(HOUR) },
        { queue: 'pets', standing: onTime },
        { queue: 'reports', standing: over(2 * HOUR) },
      ]),
    ).toEqual(['reports', 'identity', 'pets'])
  })

  it('dos que se pasaron lo mismo siguen el orden fijo', () => {
    expect(
      keys([
        { queue: 'reports', standing: over(HOUR) },
        { queue: 'pets', standing: over(HOUR) },
        { queue: 'identity', standing: onTime },
      ]),
    ).toEqual(['pets', 'reports', 'identity'])
  })

  it('la que no se pudo contar va en su lugar fijo, después de las atrasadas', () => {
    expect(
      keys([
        { queue: 'identity', standing: null },
        { queue: 'pets', standing: onTime },
        { queue: 'reports', standing: over(HOUR) },
      ]),
    ).toEqual(['reports', 'identity', 'pets'])
  })

  it('no cambia la lista que recibe', () => {
    const items: Item[] = [
      { queue: 'reports', standing: over(HOUR) },
      { queue: 'identity', standing: onTime },
    ]
    orderQueues(items)
    expect(items.map((item) => item.queue)).toEqual(['reports', 'identity'])
  })
})

describe('waitParts', () => {
  it('menos de una hora no dice minutos', () => {
    expect(waitParts(59 * 60_000)).toEqual({ unit: 'under_hour' })
    expect(waitParts(0)).toEqual({ unit: 'under_hour' })
  })

  it('horas enteras desde 1 hasta 23', () => {
    expect(waitParts(HOUR)).toEqual({ unit: 'hours', value: 1 })
    expect(waitParts(24 * HOUR - 60_000)).toEqual({ unit: 'hours', value: 23 })
  })

  it('días enteros desde 24 horas, redondeando hacia abajo', () => {
    expect(waitParts(24 * HOUR)).toEqual({ unit: 'days', value: 1 })
    expect(waitParts(72 * HOUR - 60_000)).toEqual({ unit: 'days', value: 2 })
    expect(waitParts(72 * HOUR)).toEqual({ unit: 'days', value: 3 })
  })
})

describe('wholeHours', () => {
  it('redondea hacia abajo', () => {
    expect(wholeHours(3 * HOUR - 1)).toBe(2)
    expect(wholeHours(3 * HOUR)).toBe(3)
  })
})
