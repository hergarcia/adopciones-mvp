import { describe, expect, it } from 'vitest'
import { checkWindow, recordRequest } from './request-window'

const NOW = new Date('2026-09-19T12:00:00Z')

function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * 60 * 1000)
}

function secondsAgo(seconds: number): Date {
  return new Date(NOW.getTime() - seconds * 1000)
}

// Covers: US1-AS7, US1-AS8, FR-006, FR-006b
describe('cuántos enlaces puede pedir este navegador', () => {
  it('el primer pedido siempre pasa', () => {
    expect(checkWindow([], NOW)).toEqual({ allowed: true })
  })

  it('pasado el minuto se puede pedir de nuevo', () => {
    expect(checkWindow([secondsAgo(60)], NOW)).toEqual({ allowed: true })
  })

  it('antes del minuto dice cuántos segundos faltan', () => {
    expect(checkWindow([secondsAgo(15)], NOW)).toEqual({ allowed: false, waitSeconds: 45 })
  })

  it('recién pedido, la espera es el minuto entero', () => {
    expect(checkWindow([NOW], NOW)).toEqual({ allowed: false, waitSeconds: 60 })
  })

  it('redondea la espera para arriba, para no decir que ya puede cuando todavía no', () => {
    const halfSecondAgo = new Date(NOW.getTime() - 59_500)
    expect(checkWindow([halfSecondAgo], NOW)).toEqual({ allowed: false, waitSeconds: 1 })
  })

  it('cinco en la última hora agota el cupo', () => {
    const five = [50, 40, 30, 20, 10].map(minutesAgo)
    expect(checkWindow(five, NOW)).toEqual({ allowed: false, waitSeconds: 10 * 60 })
  })

  it('cuatro en la última hora todavía deja pedir', () => {
    const four = [50, 40, 30, 20].map(minutesAgo)
    expect(checkWindow(four, NOW)).toEqual({ allowed: true })
  })

  it('la ventana es móvil: lo de hace más de una hora ya no cuenta', () => {
    const five = [70, 65, 61, 30, 20].map(minutesAgo)
    expect(checkWindow(five, NOW)).toEqual({ allowed: true })
  })

  it('la espera sale del pedido más viejo aunque lleguen desordenados', () => {
    const shuffled = [20, 55, 10, 40, 30].map(minutesAgo)
    expect(checkWindow(shuffled, NOW)).toEqual({ allowed: false, waitSeconds: 5 * 60 })
  })

  it('con el cupo lleno, la espera es hasta que se libere el más viejo, no una hora entera', () => {
    const five = [59, 40, 30, 20, 10].map(minutesAgo)
    expect(checkWindow(five, NOW)).toEqual({ allowed: false, waitSeconds: 60 })
  })

  it('exactamente una hora atrás ya salió de la ventana', () => {
    const five = [60, 40, 30, 20, 10].map(minutesAgo)
    expect(checkWindow(five, NOW)).toEqual({ allowed: true })
  })

  it('el tope por minuto se aplica aunque el cupo por hora esté libre', () => {
    expect(checkWindow([secondsAgo(5)], NOW)).toEqual({ allowed: false, waitSeconds: 55 })
  })
})

describe('lo que queda guardado después de pedir', () => {
  it('suma el pedido nuevo', () => {
    expect(recordRequest([minutesAgo(10)], NOW)).toEqual([minutesAgo(10), NOW])
  })

  it('descarta lo que ya salió de la ventana, para que la cookie no crezca sin fin', () => {
    expect(recordRequest([minutesAgo(90), minutesAgo(10)], NOW)).toEqual([minutesAgo(10), NOW])
  })

  it('exactamente una hora atrás ya salió, igual que en el cálculo de la espera', () => {
    expect(recordRequest([minutesAgo(60)], NOW)).toEqual([NOW])
  })

  it('un segundo dentro de la hora todavía cuenta', () => {
    const almost = new Date(NOW.getTime() - (60 * 60 * 1000 - 1000))
    expect(recordRequest([almost], NOW)).toEqual([almost, NOW])
  })

  it('no toca la lista que recibe', () => {
    const previous = [minutesAgo(10)]
    recordRequest(previous, NOW)
    expect(previous).toEqual([minutesAgo(10)])
  })
})
