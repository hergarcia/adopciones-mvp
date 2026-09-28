import { describe, expect, it } from 'vitest'
import { sessionLookupFailed } from './session-lookup'

// Covers: FR-003, FR-008
describe('una consulta de la sesión sin persona: sesión cerrada o sitio que no respondió', () => {
  it('sin error, lo que no vino es una sesión que no existe', () => {
    expect(sessionLookupFailed(null)).toBe(false)
  })

  it.each([400, 401, 403, 499])(
    'un %i del servicio es que no la reconoce: la sesión se cerró',
    (status) => {
      expect(sessionLookupFailed({ status })).toBe(false)
    },
  )

  it('sin red, el error llega con estado 0: no se pudo preguntar', () => {
    expect(sessionLookupFailed({ status: 0 })).toBe(true)
  })

  it('una respuesta que no se entiende llega sin estado: no se pudo preguntar', () => {
    expect(sessionLookupFailed({})).toBe(true)
  })

  it('un servicio saturado no dice nada de la sesión', () => {
    expect(sessionLookupFailed({ status: 429 })).toBe(true)
  })

  it.each([500, 502, 504])('un %i es una falla del servicio, no de la sesión', (status) => {
    expect(sessionLookupFailed({ status })).toBe(true)
  })
})
