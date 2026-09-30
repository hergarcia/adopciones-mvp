import { describe, expect, it } from 'vitest'
import { nextStepToLevelTwo } from './next-step'

// Covers: FR-011.7, US3-AS5, US4-AS5. Mandar a alguien al paso equivocado le hace perder un trámite.
describe('el paso que falta para nivel 2', () => {
  it('sin el perfil completo, completarlo', () => {
    expect(nextStepToLevelTwo({ hasProfile: false, levelOne: false, identity: 'none' })).toEqual({
      kind: 'complete_profile',
    })
    expect(nextStepToLevelTwo({ hasProfile: false, levelOne: true, identity: 'none' })).toEqual({
      kind: 'complete_profile',
    })
  })

  it('sin teléfono y sin identidad, el teléfono', () => {
    expect(nextStepToLevelTwo({ hasProfile: true, levelOne: false, identity: 'none' })).toEqual({
      kind: 'verify_phone',
      restoresLevelTwo: false,
    })
  })

  it('sin teléfono y con la identidad aprobada, el teléfono, que la devuelve a nivel 2', () => {
    expect(nextStepToLevelTwo({ hasProfile: true, levelOne: false, identity: 'approved' })).toEqual(
      { kind: 'verify_phone', restoresLevelTwo: true },
    )
  })

  it('sin teléfono y con un pedido en revisión, igual el teléfono primero', () => {
    expect(
      nextStepToLevelTwo({ hasProfile: true, levelOne: false, identity: 'in_review' }),
    ).toEqual({ kind: 'verify_phone', restoresLevelTwo: false })
  })

  it('con nivel 1 y sin pedido, verificar la identidad', () => {
    expect(nextStepToLevelTwo({ hasProfile: true, levelOne: true, identity: 'none' })).toEqual({
      kind: 'verify_identity',
    })
    expect(nextStepToLevelTwo({ hasProfile: true, levelOne: true, identity: 'rejected' })).toEqual({
      kind: 'verify_identity',
    })
  })

  it('con nivel 1 y el pedido en revisión, esperar', () => {
    expect(nextStepToLevelTwo({ hasProfile: true, levelOne: true, identity: 'in_review' })).toEqual(
      {
        kind: 'identity_in_review',
      },
    )
  })
})
