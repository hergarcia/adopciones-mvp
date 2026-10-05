import { describe, expect, it } from 'vitest'
import type { NextStep } from './next-step'
import type { VouchStanding } from './types'
import { NO_STANDING, vouchSlot } from './vouch-slot'

const STEP: NextStep = { kind: 'verify_identity' }
const MEMBER = { isOwner: false, levelTwo: true, step: STEP }
const LACKING = { isOwner: false, levelTwo: false, step: STEP }

function standing(overrides: Partial<VouchStanding> = {}): VouchStanding {
  return { ...NO_STANDING, ...overrides }
}

// Covers: FR-011, US1-AS8, US3-AS2, US3-AS5, US3-AS6, US3-AS7, US3-AS8, US3-AS9. Lo que ve quien
// mira: si se equivoca, ofrece un aval que la base va a rechazar o esconde el retiro de uno dado.
describe('el lugar de avalar', () => {
  it('sin nada entre las dos, sin relación', () => {
    expect(NO_STANDING).toEqual({
      viewerVouches: false,
      targetVouchesViewer: false,
      blockedByTarget: false,
      viewerBlockedTarget: false,
      targetBlockedViewer: false,
    })
  })

  // Covers: US3-AS4 de la #13, FR-017: la bloqueada no ve «Avalar» ni el motivo, y quien bloqueó
  // tampoco, aunque las dos tengan nivel 2.
  it.each([{ viewerBlockedTarget: true }, { targetBlockedViewer: true }])(
    'con un bloqueo entre las dos, nada: %o',
    (block) => {
      expect(
        vouchSlot({ viewer: MEMBER, standing: standing(block), targetLevelTwo: true }),
      ).toEqual({ kind: 'none' })
    },
  )

  it('la dueña no ve nada, ni la opción de avalarse', () => {
    expect(
      vouchSlot({
        viewer: { ...MEMBER, isOwner: true },
        standing: standing(),
        targetLevelTwo: true,
      }),
    ).toEqual({ kind: 'none' })
  })

  it('sin sesión, «Avalar» que pide ingresar, solo si la mirada tiene nivel 2', () => {
    expect(vouchSlot({ viewer: null, standing: standing(), targetLevelTwo: true })).toEqual({
      kind: 'sign_in',
    })
    expect(vouchSlot({ viewer: null, standing: standing(), targetLevelTwo: false })).toEqual({
      kind: 'none',
    })
  })

  it('quien ya avala ve que avala, con las dos en nivel 2', () => {
    expect(
      vouchSlot({
        viewer: MEMBER,
        standing: standing({ viewerVouches: true }),
        targetLevelTwo: true,
      }),
    ).toEqual({ kind: 'vouching' })
  })

  it.each([
    [false, true, 'mine'],
    [true, false, 'theirs'],
    [false, false, 'both'],
  ] as const)(
    'quien avala con el aval en pausa (quien mira con nivel 2: %s, la mirada: %s) lo ve en pausa',
    (viewerLevelTwo, targetLevelTwo, mark) => {
      expect(
        vouchSlot({
          viewer: { ...MEMBER, levelTwo: viewerLevelTwo },
          standing: standing({ viewerVouches: true, targetVouchesViewer: true }),
          targetLevelTwo,
        }),
      ).toEqual({ kind: 'vouching_paused', mark })
    },
  )

  it('quien avala a alguien que perdió el nivel 2 puede retirarlo: en pausa, no «no puede recibir»', () => {
    expect(
      vouchSlot({
        viewer: MEMBER,
        standing: standing({ viewerVouches: true }),
        targetLevelTwo: false,
      }).kind,
    ).toBe('vouching_paused')
  })

  it('a quien te avala no se lo puede avalar, antes que una quita', () => {
    expect(
      vouchSlot({
        viewer: MEMBER,
        standing: standing({ targetVouchesViewer: true, blockedByTarget: true }),
        targetLevelTwo: true,
      }),
    ).toEqual({ kind: 'reciprocal' })
  })

  it('quien no tiene nivel 2 y es avalado por la mirada ve que no se puede avalar a quien te avala', () => {
    expect(
      vouchSlot({
        viewer: LACKING,
        standing: standing({ targetVouchesViewer: true }),
        targetLevelTwo: false,
      }),
    ).toEqual({ kind: 'reciprocal' })
  })

  it('una quita de la mirada, antes que lo que le falta a cada una', () => {
    expect(
      vouchSlot({
        viewer: LACKING,
        standing: standing({ blockedByTarget: true }),
        targetLevelTwo: false,
      }),
    ).toEqual({ kind: 'blocked' })
  })

  it('si la mirada no tiene nivel 2, no puede recibir, antes que lo que le falta a quien mira', () => {
    expect(vouchSlot({ viewer: LACKING, standing: standing(), targetLevelTwo: false })).toEqual({
      kind: 'cannot_receive',
    })
  })

  it('si a quien mira le falta el nivel 2, el paso que le falta', () => {
    expect(vouchSlot({ viewer: LACKING, standing: standing(), targetLevelTwo: true })).toEqual({
      kind: 'needs_level_two',
      step: STEP,
    })
  })

  it('en cualquier otro caso, «Avalar»', () => {
    expect(vouchSlot({ viewer: MEMBER, standing: standing(), targetLevelTwo: true })).toEqual({
      kind: 'can_vouch',
    })
  })
})
