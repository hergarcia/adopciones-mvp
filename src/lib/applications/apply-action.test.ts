// Covers: FR-001, US1-AS9, US1-AS10, FR-023, US2-AS4 (lo que ofrece la ficha)
import { describe, expect, it } from 'vitest'
import { applyActionKind } from './apply-action'

describe('applyActionKind', () => {
  it('disponible o en proceso, sin solicitud: «Quiero adoptar»', () => {
    expect(
      applyActionKind({ isOwner: false, state: 'available', myActiveId: null, myRejected: false }),
    ).toBe('apply')
    expect(
      applyActionKind({ isOwner: false, state: 'in_process', myActiveId: null, myRejected: false }),
    ).toBe('apply')
  })

  it('con una activa por ese animal: «Ver mi solicitud»', () => {
    expect(
      applyActionKind({ isOwner: false, state: 'in_process', myActiveId: 'a1', myRejected: false }),
    ).toBe('view_mine')
  })

  it('a quien lo publicó, nada, en cualquier estado', () => {
    expect(
      applyActionKind({ isOwner: true, state: 'available', myActiveId: null, myRejected: false }),
    ).toBe('none')
    expect(
      applyActionKind({ isOwner: true, state: 'available', myActiveId: 'a1', myRejected: false }),
    ).toBe('none')
  })

  it('una adoptada no ofrece ni solicitar ni ver la solicitud', () => {
    expect(
      applyActionKind({ isOwner: false, state: 'adopted', myActiveId: null, myRejected: false }),
    ).toBe('none')
    expect(
      applyActionKind({ isOwner: false, state: 'adopted', myActiveId: 'a1', myRejected: false }),
    ).toBe('none')
  })

  it('cualquier otro estado, nada', () => {
    for (const state of ['paused', 'expired', 'taken_down'] as const) {
      expect(applyActionKind({ isOwner: false, state, myActiveId: null, myRejected: false })).toBe(
        'none',
      )
    }
  })

  it('a quien rechazaron por ese animal, que no fue aceptada, donde estaría «Quiero adoptar»', () => {
    const rejected = { isOwner: false, myActiveId: null, myRejected: true }
    expect(applyActionKind({ ...rejected, state: 'available' })).toBe('rejected')
    expect(applyActionKind({ ...rejected, state: 'in_process' })).toBe('rejected')
    expect(applyActionKind({ ...rejected, state: 'paused' })).toBe('none')
    expect(applyActionKind({ ...rejected, state: 'adopted' })).toBe('none')
    expect(applyActionKind({ ...rejected, isOwner: true, state: 'available' })).toBe('none')
  })
})
