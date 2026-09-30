import { describe, expect, it } from 'vitest'
import { classifyVouchOutcome, type VouchOutcome } from './vouch-failure'

const result = (value: VouchOutcome<null> & { kind: 'result' }) => value
const failed = (error: string): VouchOutcome<null> => ({
  kind: 'result',
  result: { ok: false, error },
})

// Covers: FR-013, FR-014. Decir «sin conexión» cuando el sitio no respondió, o un error cuando el
// aval se dio, deja a la persona tocando de nuevo sin saber qué pasó.
describe('cómo terminó avalar, retirar o quitar', () => {
  it('salió bien', () => {
    expect(
      classifyVouchOutcome({
        online: true,
        outcome: result({ kind: 'result', result: { ok: true, data: null } }),
      }),
    ).toEqual({ kind: 'ok', data: null })
  })

  it('sin conexión, o sin respuesta con conexión', () => {
    expect(classifyVouchOutcome({ online: false, outcome: { kind: 'threw' } })).toEqual({
      kind: 'offline',
    })
    expect(classifyVouchOutcome({ online: true, outcome: { kind: 'threw' } })).toEqual({
      kind: 'no_response',
    })
  })

  it('pasó el plazo: sin respuesta, haya o no conexión', () => {
    expect(classifyVouchOutcome({ online: false, outcome: { kind: 'timeout' } })).toEqual({
      kind: 'no_response',
    })
  })

  it('el sitio no pudo: para la persona es lo mismo que no haber respondido', () => {
    expect(
      classifyVouchOutcome({ online: true, outcome: failed('vouches.errors.save_failed') }),
    ).toEqual({ kind: 'no_response' })
  })

  it('la sesión venció', () => {
    expect(
      classifyVouchOutcome({ online: true, outcome: failed('vouches.errors.session') }),
    ).toEqual({ kind: 'session' })
  })

  it('la persona mirada ya no existe', () => {
    expect(
      classifyVouchOutcome({ online: true, outcome: failed('vouches.errors.not_found') }),
    ).toEqual({ kind: 'gone' })
  })

  it.each(['self', 'reciprocal', 'blocked', 'vouchee_level', 'voucher_level'] as const)(
    'un motivo de FR-013: %s',
    (reason) => {
      expect(
        classifyVouchOutcome({ online: true, outcome: failed(`vouches.errors.${reason}`) }),
      ).toEqual({ kind: 'reason', reason })
    },
  )

  it('un error que no conoce se trata como que no respondió', () => {
    expect(classifyVouchOutcome({ online: true, outcome: failed('vouches.errors.otro') })).toEqual({
      kind: 'no_response',
    })
    expect(classifyVouchOutcome({ online: true, outcome: failed('self') })).toEqual({
      kind: 'no_response',
    })
  })
})
