// Covers: US3-AS1, US3-AS2, US3-AS4, FR-017, FR-017a, FR-020
import { describe, expect, it } from 'vitest'
import { profileView, type ProfileViewInput } from './profile-view'

const BASE: ProfileViewInput = {
  exists: true,
  isOwner: false,
  isSuspended: false,
  viewerBlocked: false,
  blockedByTarget: false,
}

const view = (overrides: Partial<ProfileViewInput>) => profileView({ ...BASE, ...overrides })

describe('qué ve quien mira un perfil', () => {
  it('una cuenta que existe y nada entre las dos: el perfil', () => {
    expect(view({})).toBe('profile')
  })

  it('la dueña ve su perfil', () => {
    expect(view({ isOwner: true })).toBe('profile')
  })

  it('una cuenta que no existe no se ve, aunque hubiera un bloqueo', () => {
    expect(view({ exists: false })).toBe('not_found')
    expect(view({ exists: false, viewerBlocked: true })).toBe('not_found')
  })

  it('quien bloqueó ve el perfil bloqueado', () => {
    expect(view({ viewerBlocked: true })).toBe('blocked')
  })

  it('el bloqueo gana sobre la suspensión para quien bloqueó (FR-017a)', () => {
    expect(view({ viewerBlocked: true, isSuspended: true })).toBe('blocked')
  })

  it('una suspendida no existe para cualquier otra persona', () => {
    expect(view({ isSuspended: true })).toBe('not_found')
    expect(view({ isSuspended: true, blockedByTarget: true })).toBe('not_found')
  })

  it('la bloqueada ve el perfil de quien la bloqueó como cualquiera (FR-017)', () => {
    expect(view({ blockedByTarget: true })).toBe('profile')
  })

  it('un bloqueo propio no tapa el perfil propio', () => {
    expect(view({ isOwner: true, viewerBlocked: true })).toBe('profile')
  })
})
