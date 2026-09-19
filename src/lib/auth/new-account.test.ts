import { describe, expect, it } from 'vitest'
import { bornInThisRequest } from './new-account'

const STARTED = new Date('2026-09-19T12:00:00Z')

function at(offsetMs: number): Date {
  return new Date(STARTED.getTime() + offsetMs)
}

// Covers: FR-032. Si esto se equivoca, el embudo cuenta una cuenta nueva cada vez que alguien
// vuelve, y el escalón que la historia existe para medir queda inservible.
describe('si la cuenta nació en este ingreso', () => {
  it('sí, cuando se creó justo después de arrancar el pedido', () => {
    expect(bornInThisRequest(at(120), STARTED)).toBe(true)
  })

  it('sí, cuando se creó en el mismo instante', () => {
    expect(bornInThisRequest(STARTED, STARTED)).toBe(true)
  })

  it('sí, dentro de la tolerancia de reloj', () => {
    expect(bornInThisRequest(at(-29_000), STARTED)).toBe(true)
  })

  it('sí, justo en el borde de la tolerancia', () => {
    expect(bornInThisRequest(at(-30_000), STARTED)).toBe(true)
  })

  it('no, pasada la tolerancia', () => {
    expect(bornInThisRequest(at(-31_000), STARTED)).toBe(false)
  })

  it('no, cuando la cuenta es de ayer', () => {
    expect(bornInThisRequest(at(-24 * 60 * 60 * 1000), STARTED)).toBe(false)
  })

  it('no, cuando no sabemos cuándo nació: ante la duda, no es nueva', () => {
    expect(bornInThisRequest(null, STARTED)).toBe(false)
  })
})
