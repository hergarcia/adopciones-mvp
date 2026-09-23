import { describe, expect, it } from 'vitest'
import { twilioOutcome } from './twilio-outcome'

// Covers: FR-002a, FR-009a
describe('qué pasó con el mensaje, según Twilio', () => {
  it('aceptado es que salió', () => {
    expect(twilioOutcome(201)).toBe('sent')
    expect(twilioOutcome(200)).toBe('sent')
    expect(twilioOutcome(299)).toBe('sent')
  })

  it.each([21211, 21614, 21610, 21612])(
    'el %s es del número: lo escrito no recibe mensajes y cuenta para la persona',
    (code) => {
      expect(twilioOutcome(400, code)).toBe('rejected')
    },
  )

  it('el 21408 es de nuestra cuenta, no del número, y no le cuenta a nadie', () => {
    expect(twilioOutcome(400, 21408)).toBe('failed')
  })

  it('cualquier otro error, un 5xx o uno sin código son del servicio', () => {
    expect(twilioOutcome(400, 20003)).toBe('failed')
    expect(twilioOutcome(503)).toBe('failed')
    expect(twilioOutcome(400)).toBe('failed')
    expect(twilioOutcome(300)).toBe('failed')
    expect(twilioOutcome(199)).toBe('failed')
  })

  it('un código de número con un estado de éxito es que salió', () => {
    expect(twilioOutcome(201, 21211)).toBe('sent')
  })
})
