import { describe, expect, it } from 'vitest'
import { reviewState } from './review-state'

const NOW = new Date('2026-09-26T15:00:00Z')
const LATER = new Date(NOW.getTime() + 1)
const EARLIER = new Date(NOW.getTime() - 1)

// Covers: US2-AS6, US2-AS7, FR-021, FR-028. Lo que la cola le dice a quien administra de un pedido
// que se cerró mientras lo miraba.
describe('qué le pasó a un pedido abierto en pantalla', () => {
  it('a la vista y vigente, sigue abierto', () => {
    expect(
      reviewState({ row: { expiresAt: LATER }, resolved: false, knownExpiresAt: LATER }, NOW),
    ).toBe('open')
  })

  it('a la vista y con el vencimiento cumplido, venció', () => {
    expect(
      reviewState({ row: { expiresAt: NOW }, resolved: false, knownExpiresAt: null }, NOW),
    ).toBe('expired')
  })

  it('sin fila y con registro de resolución, ya fue resuelto', () => {
    expect(reviewState({ row: null, resolved: true, knownExpiresAt: EARLIER }, NOW)).toBe(
      'resolved',
    )
  })

  it('sin fila ni resolución y con el vencimiento conocido y pasado, venció', () => {
    expect(reviewState({ row: null, resolved: false, knownExpiresAt: NOW }, NOW)).toBe('expired')
  })

  it('sin fila ni resolución y todavía vigente, la persona lo retiró o ya no tiene cuenta', () => {
    expect(reviewState({ row: null, resolved: false, knownExpiresAt: LATER }, NOW)).toBe('gone')
  })

  it('sin nada conocido, ya no está', () => {
    expect(reviewState({ row: null, resolved: false, knownExpiresAt: null }, NOW)).toBe('gone')
  })
})
