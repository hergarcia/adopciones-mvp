// Covers: US2-AS1, US2-AS3, FR-013, FR-030, FR-033 (lo que ve cada lado de una adopción)
import { describe, expect, it } from 'vitest'
import { adoptionView } from './adoption-view'
import type { AdoptionRow } from './types'

const PENDING: AdoptionRow = {
  side: 'adopter',
  petName: 'Tobi',
  petSex: 'male',
  includesNeuter: true,
  publisherName: 'Rocío',
  adopterName: 'Ana',
  markedAt: '2026-10-08T12:00:00Z',
  adopterAcceptedAt: null,
  declinedAt: null,
  endedAt: null,
  contactCut: false,
  adopterSuspended: false,
}
const DATE = '2026-10-09T12:00:00Z'

describe('adoptionView', () => {
  it('pendiente, para quien adoptó: puede aceptar y ve el contacto', () => {
    expect(adoptionView(PENDING)).toEqual({
      state: 'pending',
      cut: false,
      canAccept: true,
      contact: 'shown',
      showsCommitment: true,
    })
  })

  it('pendiente, para quien lo dio: no acepta nada, ve el contacto', () => {
    expect(adoptionView({ ...PENDING, side: 'publisher' })).toMatchObject({
      state: 'pending',
      canAccept: false,
      contact: 'shown',
    })
  })

  it('aceptado: ya no se acepta, el contacto sigue', () => {
    expect(adoptionView({ ...PENDING, adopterAcceptedAt: DATE })).toEqual({
      state: 'accepted',
      cut: false,
      canAccept: false,
      contact: 'shown',
      showsCommitment: true,
    })
  })

  it('con la cuenta de quien adoptó suspendida: no acepta', () => {
    expect(adoptionView({ ...PENDING, adopterSuspended: true }).canAccept).toBe(false)
  })

  it('con el contacto cortado: no acepta y el contacto ya no está disponible', () => {
    expect(adoptionView({ ...PENDING, contactCut: true })).toEqual({
      state: 'pending',
      cut: true,
      canAccept: false,
      contact: 'unavailable',
      showsCommitment: true,
    })
  })

  it('terminada: el compromiso como quedó, sin contacto ni aceptar', () => {
    expect(adoptionView({ ...PENDING, adopterAcceptedAt: DATE, endedAt: DATE })).toEqual({
      state: 'ended',
      cut: false,
      canAccept: false,
      contact: 'none',
      showsCommitment: true,
    })
    expect(adoptionView({ ...PENDING, endedAt: DATE, contactCut: true })).toMatchObject({
      state: 'ended',
      canAccept: false,
      contact: 'none',
    })
  })

  it('deshecha: sin compromiso ni contacto', () => {
    expect(adoptionView({ ...PENDING, declinedAt: DATE, endedAt: DATE })).toEqual({
      state: 'declined',
      cut: false,
      canAccept: false,
      contact: 'none',
      showsCommitment: false,
    })
  })
})
