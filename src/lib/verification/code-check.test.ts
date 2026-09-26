import { describe, expect, it } from 'vitest'
import { codeCheckOutcome, type CheckFacts } from './code-check'

const NOTHING: CheckFacts = {
  verified: false,
  wasChange: false,
  wasLost: false,
  inUse: false,
  noPending: false,
  noLiveCode: false,
  matchesSuperseded: false,
  expired: false,
  exhausted: false,
  attemptsLeft: null,
  liveNumber: null,
}

function outcome(facts: Partial<CheckFacts> | null) {
  return codeCheckOutcome({
    facts: facts === null ? null : { ...NOTHING, ...facts },
    destination: '/mi-perfil?guardado=telefono',
  })
}

// Covers: US1-AS2, US3-AS1, FR-018a
describe('un código que sirve', () => {
  it('lleva a su destino y se mide como verificado', () => {
    expect(outcome({ verified: true })).toEqual({
      result: { ok: true, data: { destination: '/mi-perfil?guardado=telefono' } },
      events: ['phone_verified'],
    })
  })

  it('en un cambio, se mide también el cambio', () => {
    expect(outcome({ verified: true, wasChange: true }).events).toEqual([
      'phone_verified',
      'phone_changed',
    ])
  })

  // Covers: #25 FR-014 («verificado después de perder el número»)
  it('con el aviso de número perdido, se mide también que volvió a verificar', () => {
    expect(outcome({ verified: true, wasLost: true }).events).toEqual([
      'phone_verified',
      'phone_reverified_after_loss',
    ])
    expect(outcome({ verified: true, wasChange: true, wasLost: true }).events).toEqual([
      'phone_verified',
      'phone_changed',
      'phone_reverified_after_loss',
    ])
  })
})

// Covers: FR-007, FR-007a, US1-AS5, US1-AS6, US1-AS9
describe('un código que no sirve, y por qué', () => {
  it('equivocado, con los intentos que quedan', () => {
    expect(outcome({ attemptsLeft: 3, liveNumber: '+59899123456' })).toEqual({
      result: {
        ok: false,
        error: 'verification.errors.code_wrong',
        detail: { clearInput: true, attemptsLeft: 3 },
      },
      events: ['phone_code_failed'],
    })
  })

  it('equivocado sin saber cuántos quedan, cero', () => {
    expect(outcome({}).result).toMatchObject({ detail: { attemptsLeft: 0 } })
  })

  it('vencido', () => {
    expect(outcome({ expired: true, attemptsLeft: 5 }).result).toEqual({
      ok: false,
      error: 'verification.errors.code_expired',
      detail: { clearInput: true },
    })
  })

  it('agotado', () => {
    expect(outcome({ exhausted: true, attemptsLeft: 0 }).result).toEqual({
      ok: false,
      error: 'verification.errors.code_exhausted',
      detail: { clearInput: true },
    })
  })

  it('reemplazado, nombrando el número del último', () => {
    expect(outcome({ matchesSuperseded: true, liveNumber: '+59898765432' }).result).toEqual({
      ok: false,
      error: 'verification.errors.code_superseded',
      detail: { clearInput: true, number: '098 765 432' },
    })
  })

  it('reemplazado sin un vivo que nombrar, sin número', () => {
    expect(outcome({ matchesSuperseded: true, noLiveCode: true }).result).toEqual({
      ok: false,
      error: 'verification.errors.code_superseded',
      detail: { clearInput: true },
    })
  })

  it('sin ningún código vivo, vencido', () => {
    expect(outcome({ noLiveCode: true }).result).toEqual({
      ok: false,
      error: 'verification.errors.code_expired',
      detail: { clearInput: true },
    })
  })

  it('todos se miden como intento fallido', () => {
    expect(outcome({ expired: true }).events).toEqual(['phone_code_failed'])
    expect(outcome({ matchesSuperseded: true }).events).toEqual(['phone_code_failed'])
  })
})

// Covers: FR-007a (orden de los motivos)
describe('cuando cae en más de un motivo', () => {
  it('reemplazado gana a todo', () => {
    expect(
      outcome({
        matchesSuperseded: true,
        exhausted: true,
        expired: true,
        liveNumber: '+59898765432',
      }).result,
    ).toMatchObject({ error: 'verification.errors.code_superseded' })
  })

  it('agotado gana a vencido', () => {
    expect(outcome({ exhausted: true, expired: true }).result).toMatchObject({
      error: 'verification.errors.code_exhausted',
    })
  })

  it('sin código vivo gana a agotado', () => {
    expect(outcome({ noLiveCode: true, exhausted: true }).result).toMatchObject({
      error: 'verification.errors.code_expired',
    })
  })
})

// Covers: FR-008, FR-008b, FR-008c, US1-AS11
describe('un número que está en otra cuenta', () => {
  it('se dice, se vacía el renglón y se mide aparte, no como intento fallido', () => {
    expect(outcome({ inUse: true })).toEqual({
      result: {
        ok: false,
        error: 'verification.errors.number_in_use',
        detail: { clearInput: true },
      },
      events: ['phone_number_in_use'],
    })
  })

  // Covers: #25 US1-AS1. «Seguir» lo decide ahora la pantalla de los caminos, con la prueba.
  it('aunque fuera un cambio, no trae a dónde seguir', () => {
    expect(outcome({ inUse: true, wasChange: true }).result).toEqual({
      ok: false,
      error: 'verification.errors.number_in_use',
      detail: { clearInput: true },
    })
  })
})

// Covers: FR-007c, Edge Cases «Sin código vivo»
describe('lo que no es un intento', () => {
  it('una falla al comprobar conserva lo escrito y no se mide', () => {
    expect(outcome(null)).toEqual({
      result: {
        ok: false,
        error: 'verification.errors.check_failed',
        detail: { clearInput: false },
      },
      events: [],
    })
  })

  it('sin número a medias, se dice y no se mide', () => {
    expect(outcome({ noPending: true, matchesSuperseded: true })).toEqual({
      result: {
        ok: false,
        error: 'verification.errors.no_pending',
        detail: { clearInput: true },
      },
      events: [],
    })
  })
})
