// Covers: research R15. Las comprobaciones de privacidad contra la nube usan casillas reservadas
// (`@example.test`); sin esto, cada aviso que les tocara sería un rechazo de Resend en el registro.
import { describe, expect, it } from 'vitest'
import { isDeliverable } from './deliverable'

describe('isDeliverable', () => {
  it.each([
    'prueba+1@example.test',
    'x@foo.example',
    'x@a.invalid',
    'x@localhost',
    'x@app.localhost',
    'X@EXAMPLE.TEST',
    'ana.test@localhost',
  ])('%s es de un dominio reservado (RFC 2606)', (email) => {
    expect(isDeliverable(email)).toBe(false)
  })

  it.each(['x@gmail.com', 'x@test.com.uy', 'x@mitest.uy', 'ana.test@gmail.com', 'x@intranet'])(
    '%s sale',
    (email) => {
      expect(isDeliverable(email)).toBe(true)
    },
  )
})
