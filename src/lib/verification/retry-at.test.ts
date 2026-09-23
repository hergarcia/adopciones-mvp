import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { retryDisplay, retryText, secondsUntil, type RetryDisplay } from './retry-at'

const UY = { timeZone: 'America/Montevideo', locale: 'es' }

// El equipo que corre el test está en otra zona a propósito: si la hora de Uruguay saliera de la
// zona del servidor y no de la pasada, las pruebas de la medianoche fallarían.
const machineZone = process.env.TZ
beforeAll(() => {
  process.env.TZ = 'Asia/Tokyo'
})
afterAll(() => {
  process.env.TZ = machineZone
})
// Las 20:00 del martes 22 de septiembre de 2026 en Montevideo (UTC−3).
const NOW = new Date('2026-09-22T20:00:00-03:00')

function after(ms: number): Date {
  return new Date(NOW.getTime() + ms)
}

// Covers: FR-010, FR-010a, US1-AS7, US1-AS10
describe('cuándo se puede pedir otro código', () => {
  it('sin freno, o con uno que ya pasó, es ahora', () => {
    expect(retryDisplay(null, NOW, UY)).toEqual({ kind: 'now' })
    expect(retryDisplay(NOW, NOW, UY)).toEqual({ kind: 'now' })
    expect(retryDisplay(after(-1000), NOW, UY)).toEqual({ kind: 'now' })
  })

  it('por debajo de dos minutos, en segundos redondeados para arriba', () => {
    expect(retryDisplay(after(42_000), NOW, UY)).toEqual({ kind: 'seconds', seconds: 42 })
    expect(retryDisplay(after(41_200), NOW, UY)).toEqual({ kind: 'seconds', seconds: 42 })
    expect(retryDisplay(after(1), NOW, UY)).toEqual({ kind: 'seconds', seconds: 1 })
    expect(retryDisplay(after(119_000), NOW, UY)).toEqual({ kind: 'seconds', seconds: 119 })
  })

  it('desde los dos minutos, con la hora de hoy', () => {
    expect(retryDisplay(after(120_000), NOW, UY)).toEqual({
      kind: 'at',
      day: 'today',
      weekday: 'martes',
      time: '20:02',
      seconds: 120,
    })
  })

  it('al día siguiente, mañana', () => {
    const at = new Date('2026-09-23T09:15:00-03:00')
    expect(retryDisplay(at, NOW, UY)).toMatchObject({ day: 'tomorrow', time: '9:15' })
  })

  it('más allá, con el día nombrado', () => {
    const at = new Date('2026-09-24T08:00:00-03:00')
    expect(retryDisplay(at, NOW, UY)).toMatchObject({ day: 'weekday', weekday: 'jueves' })
  })

  // A las 23:59 de Montevideo ya son las 02:59 en UTC: un cálculo con la zona del servidor diría
  // "hoy" para las 00:01 de Montevideo, que en UTC siguen siendo el mismo día.
  it('la medianoche es la de Uruguay, no la del servidor', () => {
    const lateNight = new Date('2026-09-22T23:59:00-03:00')
    const justAfter = new Date('2026-09-23T00:01:00-03:00')
    expect(retryDisplay(justAfter, lateNight, UY)).toMatchObject({
      day: 'tomorrow',
      time: '0:01',
      seconds: 120,
    })
  })

  it('antes de la medianoche de Uruguay sigue siendo hoy, aunque en UTC ya sea mañana', () => {
    const evening = new Date('2026-09-22T21:30:00-03:00')
    const later = new Date('2026-09-22T23:30:00-03:00')
    expect(retryDisplay(later, evening, UY)).toMatchObject({ day: 'today', time: '23:30' })
  })
})

const TEXTS = {
  secondsOne: 'Podés pedir otro en 1 segundo.',
  secondsMany: 'Podés pedir otro en {seconds} segundos.',
  today: 'Podés pedir otro hoy a las {time}.',
  tomorrow: 'Podés pedir otro mañana a las {time}.',
  weekday: 'Podés pedir otro el {weekday} a las {time}.',
}

function atDisplay(day: 'today' | 'tomorrow' | 'weekday', seconds: number): RetryDisplay {
  return { kind: 'at', day, weekday: 'jueves', time: '9:15', seconds }
}

describe('de dónde arranca la cuenta regresiva', () => {
  it('ahora es cero, y si no, los segundos que faltan', () => {
    expect(secondsUntil({ kind: 'now' })).toBe(0)
    expect(secondsUntil({ kind: 'seconds', seconds: 42 })).toBe(42)
    expect(secondsUntil(atDisplay('tomorrow', 50_000))).toBe(50_000)
  })
})

// Covers: FR-010a, US1-AS10
describe('qué dice la línea mientras corre la cuenta', () => {
  it('con segundos que todavía no bajaron de dos minutos, los segundos igual', () => {
    expect(retryText({ kind: 'seconds', seconds: 150 }, 150, TEXTS)).toBe(
      'Podés pedir otro en 150 segundos.',
    )
  })

  it('cuando ya se puede, nada', () => {
    expect(retryText({ kind: 'now' }, 0, TEXTS)).toBeNull()
    expect(retryText({ kind: 'seconds', seconds: 42 }, 0, TEXTS)).toBeNull()
  })

  it('con segundos, los segundos, en singular y en plural', () => {
    expect(retryText({ kind: 'seconds', seconds: 42 }, 42, TEXTS)).toBe(
      'Podés pedir otro en 42 segundos.',
    )
    expect(retryText({ kind: 'seconds', seconds: 42 }, 1, TEXTS)).toBe(
      'Podés pedir otro en 1 segundo.',
    )
  })

  it('con una hora lejana, la hora del día que toca', () => {
    expect(retryText(atDisplay('today', 5000), 5000, TEXTS)).toBe(
      'Podés pedir otro hoy a las 9:15.',
    )
    expect(retryText(atDisplay('tomorrow', 5000), 5000, TEXTS)).toBe(
      'Podés pedir otro mañana a las 9:15.',
    )
    expect(retryText(atDisplay('weekday', 5000), 5000, TEXTS)).toBe(
      'Podés pedir otro el jueves a las 9:15.',
    )
  })

  it('cuando la hora se acerca a menos de dos minutos, pasa a contar los segundos', () => {
    expect(retryText(atDisplay('today', 5000), 120, TEXTS)).toBe('Podés pedir otro hoy a las 9:15.')
    expect(retryText(atDisplay('today', 5000), 119, TEXTS)).toBe(
      'Podés pedir otro en 119 segundos.',
    )
  })
})
