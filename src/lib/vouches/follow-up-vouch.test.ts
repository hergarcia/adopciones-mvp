import { describe, expect, it } from 'vitest'
import { followUpVouch, type FollowUpVouchInput } from './follow-up-vouch'
import type { VouchStanding } from './types'
import { NO_STANDING } from './vouch-slot'

const ANSWERED = { status: 'answered', hidden: false } as const
const CURRENT = { endedAt: null, declinedAt: null, contactCut: false }
const DAY = '2026-10-20T12:00:00Z'

function input(overrides: Partial<FollowUpVouchInput> = {}): FollowUpVouchInput {
  return {
    followUp: ANSWERED,
    adoption: CURRENT,
    viewerLevelTwo: true,
    adopter: { levelTwo: true },
    standing: NO_STANDING,
    ...overrides,
  }
}

function standing(overrides: Partial<VouchStanding>): VouchStanding {
  return { ...NO_STANDING, ...overrides }
}

// Covers: #261. Si se equivoca, invita a avalar a quien todavía no mandó las fotos o a alguien que la
// base va a rechazar, o le cuenta a quien dio el animal una quita, un bloqueo o una suspensión.
describe('la invitación a avalar desde el seguimiento', () => {
  it('con las fotos mandadas, la adopción en pie y las dos con nivel 2, invita', () => {
    expect(followUpVouch(input())).toEqual({ kind: 'invite' })
  })

  it('con el aval ya dado, dice que ya la avala', () => {
    expect(followUpVouch(input({ standing: standing({ viewerVouches: true }) }))).toEqual({
      kind: 'vouching',
    })
  })

  it.each([
    ['sin seguimiento', { followUp: null }],
    ['con el seguimiento pedido', { followUp: { status: 'requested', hidden: false } }],
    ['con el seguimiento cerrado sin respuesta', { followUp: { status: 'closed', hidden: false } }],
    ['con el seguimiento escondido por un bloqueo', { followUp: { ...ANSWERED, hidden: true } }],
    ['sin adopción', { adoption: null }],
    ['con la adopción terminada', { adoption: { ...CURRENT, endedAt: DAY } }],
    ['con «Yo no adopté»', { adoption: { ...CURRENT, declinedAt: DAY } }],
    ['con el contacto cortado', { adoption: { ...CURRENT, contactCut: true } }],
    ['con su perfil fuera de la vista', { adopter: null }],
    ['si quien la adoptó no tiene nivel 2', { adopter: { levelTwo: false } }],
    ['si quien dio el animal no tiene nivel 2', { viewerLevelTwo: false }],
    ['si quien adoptó la avala', { standing: standing({ targetVouchesViewer: true }) }],
    ['si quien adoptó quitó su aval', { standing: standing({ blockedByTarget: true }) }],
    ['si la bloqueó', { standing: standing({ targetBlockedViewer: true }) }],
    ['si la bloqueó quien dio el animal', { standing: standing({ viewerBlockedTarget: true }) }],
  ] satisfies [string, Partial<FollowUpVouchInput>][])('nada %s', (_, overrides) => {
    expect(followUpVouch(input(overrides))).toEqual({ kind: 'none' })
  })

  it.each([
    ['con un bloqueo', { viewerVouches: true, targetBlockedViewer: true }],
    ['con un bloqueo propio', { viewerVouches: true, viewerBlockedTarget: true }],
  ])('un aval dado no se nombra %s', (_, overrides) => {
    expect(followUpVouch(input({ standing: standing(overrides) }))).toEqual({ kind: 'none' })
  })

  it.each([
    ['le falta el nivel 2 a quien lo dio', { viewerLevelTwo: false }],
    ['le falta el nivel 2 a quien lo recibió', { adopter: { levelTwo: false } }],
  ] satisfies [string, Partial<FollowUpVouchInput>][])(
    'un aval en pausa no se nombra: %s',
    (_, overrides) => {
      expect(
        followUpVouch(input({ ...overrides, standing: standing({ viewerVouches: true }) })),
      ).toEqual({ kind: 'none' })
    },
  )
})
