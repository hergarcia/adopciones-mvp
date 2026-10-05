// Covers: FR-001, FR-002, FR-010, FR-014, FR-018, US2-AS11, Edge Cases «Reportarse o bloquearse a
// sí misma» y «Quien administra bloquea a alguien»
import { describe, expect, it } from 'vitest'
import { safetyActions } from './safety-actions'

const person = { isOwner: false, isAdmin: false }
const admin = { isOwner: false, isAdmin: true }

describe('safetyActions', () => {
  it('en el propio perfil no hay nada, tampoco para quien administra', () => {
    for (const view of ['profile', 'blocked'] as const) {
      expect(safetyActions({ viewer: { isOwner: true, isAdmin: false }, view })).toEqual({
        actions: [],
        signIn: false,
      })
      expect(safetyActions({ viewer: { isOwner: true, isAdmin: true }, view })).toEqual({
        actions: [],
        signIn: false,
      })
    }
  })

  it('sin sesión, reportar y bloquear llevan a ingresar', () => {
    expect(safetyActions({ viewer: null, view: 'profile' })).toEqual({
      actions: ['report', 'block'],
      signIn: true,
    })
  })

  it('con sesión, reportar y bloquear', () => {
    expect(safetyActions({ viewer: person, view: 'profile' })).toEqual({
      actions: ['report', 'block'],
      signIn: false,
    })
  })

  it('quien administra suma suspender', () => {
    expect(safetyActions({ viewer: admin, view: 'profile' })).toEqual({
      actions: ['report', 'block', 'suspend'],
      signIn: false,
    })
  })

  it('en el perfil bloqueado: desbloquear y reportar, y suspender para quien administra', () => {
    expect(safetyActions({ viewer: person, view: 'blocked' })).toEqual({
      actions: ['unblock', 'report'],
      signIn: false,
    })
    expect(safetyActions({ viewer: admin, view: 'blocked' })).toEqual({
      actions: ['unblock', 'report', 'suspend'],
      signIn: false,
    })
  })
})
