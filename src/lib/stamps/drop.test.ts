import { describe, expect, it } from 'vitest'
import { fallsOnArrival, stateDroppedBy } from './drop'

// Covers: #310, el sello cae solo para quien acaba de tocar.
describe('fallsOnArrival', () => {
  it('cae cuando la pantalla llega por la navegación que siguió al toque', () => {
    expect(fallsOnArrival('empty', true)).toBe(true)
  })

  it('queda quieto al recargar o abrir la pantalla', () => {
    expect(fallsOnArrival('document', true)).toBe(false)
  })

  it('queda quieto si el navegador no dice cómo llegó', () => {
    expect(fallsOnArrival(null, true)).toBe(false)
  })

  it('queda quieto si no se acaba de hacer nada, aunque llegue por una navegación', () => {
    expect(fallsOnArrival('empty', false)).toBe(false)
  })
})

// Covers: #310, «Mis animales»: marcar en proceso y pausar hacen caer su sello.
describe('stateDroppedBy', () => {
  it('marcar en proceso hace caer el sello de en proceso', () => {
    expect(stateDroppedBy('mark_in_process')).toBe('in_process')
  })

  it('pausar hace caer el sello de pausado', () => {
    expect(stateDroppedBy('pause')).toBe('paused')
  })

  it.each(['resume', 'republish', 'mark_available', 'renew', 'mark_adopted'])(
    '«%s» no hace caer ninguno',
    (action) => {
      expect(stateDroppedBy(action)).toBeNull()
    },
  )

  it('sin una acción que haya salido, ninguno', () => {
    expect(stateDroppedBy(null)).toBeNull()
  })
})
