// Covers: US2-AS1, US4-AS2, US4-AS6, US2-AS3, US3-AS2, US3-AS4, FR-013, FR-020, FR-021, FR-030, FR-033 (lo que ve cada lado de una adopción)
import { describe, expect, it } from 'vitest'
import { adoptionView, shownContact } from './adoption-view'
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
      canDecline: true,
      contact: 'shown',
      showsCommitment: true,
    })
  })

  it('pendiente, para quien lo dio: no acepta nada, ve el contacto', () => {
    expect(adoptionView({ ...PENDING, side: 'publisher' })).toMatchObject({
      state: 'pending',
      canAccept: false,
      canDecline: false,
      contact: 'shown',
    })
  })

  it('aceptado: ya no se acepta, el contacto sigue', () => {
    expect(adoptionView({ ...PENDING, adopterAcceptedAt: DATE })).toEqual({
      state: 'accepted',
      cut: false,
      canAccept: false,
      canDecline: false,
      contact: 'shown',
      showsCommitment: true,
    })
  })

  it('con la cuenta de quien adoptó suspendida: no acepta ni deshace', () => {
    expect(adoptionView({ ...PENDING, adopterSuspended: true })).toMatchObject({
      canAccept: false,
      canDecline: false,
    })
  })

  it('con el contacto cortado: no acepta y el contacto ya no está disponible', () => {
    expect(adoptionView({ ...PENDING, contactCut: true })).toEqual({
      state: 'pending',
      cut: true,
      canAccept: false,
      canDecline: false,
      contact: 'unavailable',
      showsCommitment: true,
    })
  })

  it('terminada: el compromiso como quedó, sin contacto ni aceptar', () => {
    expect(adoptionView({ ...PENDING, adopterAcceptedAt: DATE, endedAt: DATE })).toEqual({
      state: 'ended',
      cut: false,
      canAccept: false,
      canDecline: false,
      contact: 'none',
      showsCommitment: true,
    })
    expect(adoptionView({ ...PENDING, endedAt: DATE, contactCut: true })).toMatchObject({
      state: 'ended',
      canAccept: false,
      canDecline: false,
      contact: 'none',
    })
  })

  it('deshecha: sin compromiso ni contacto', () => {
    expect(adoptionView({ ...PENDING, declinedAt: DATE, endedAt: DATE })).toEqual({
      state: 'declined',
      cut: false,
      canAccept: false,
      canDecline: false,
      contact: 'none',
      showsCommitment: false,
    })
  })
})

describe('shownContact', () => {
  const contact = { name: 'Rocío' }

  it('sin adopción o en curso: el que dio la base', () => {
    expect(shownContact(null, contact)).toBe(contact)
    expect(shownContact(adoptionView(PENDING), contact)).toBe(contact)
    expect(shownContact(adoptionView(PENDING), null)).toBeNull()
  })

  it('con el contacto cortado: no disponible, aunque la base no lo dé', () => {
    expect(shownContact(adoptionView({ ...PENDING, contactCut: true }), null)).toBe('unavailable')
  })

  it('terminada o deshecha: nada', () => {
    expect(shownContact(adoptionView({ ...PENDING, endedAt: DATE }), contact)).toBeNull()
    expect(shownContact(adoptionView({ ...PENDING, declinedAt: DATE }), contact)).toBeNull()
  })
})
