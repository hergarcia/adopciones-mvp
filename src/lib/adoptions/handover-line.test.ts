// Covers: US1-AS3, US1-AS5, FR-040 (el renglón de Mis animales)
import { describe, expect, it } from 'vitest'
import { handoverLine } from './handover-line'
import type { PetAdoptionSummary } from './types'

const SITE: PetAdoptionSummary = {
  petId: 'p1',
  kind: 'site',
  adopterName: 'Ana',
  declined: false,
  adopterAcceptedAt: null,
  markedAt: '2026-10-08T12:00:00Z',
  endsPerson: true,
}

describe('handoverLine', () => {
  it('sin adopción registrada: nada', () => {
    expect(handoverLine(undefined)).toBeNull()
  })

  it('por fuera del sitio: sin persona ni compromiso', () => {
    expect(handoverLine({ ...SITE, kind: 'outside', adopterName: null })).toEqual({
      kind: 'outside',
    })
  })

  it('por fuera aunque la base trajera un nombre: sigue siendo por fuera', () => {
    expect(handoverLine({ ...SITE, kind: 'outside' })).toEqual({ kind: 'outside' })
  })

  it('a una persona que borró su cuenta: nada', () => {
    expect(handoverLine({ ...SITE, adopterName: null })).toBeNull()
  })

  it('a una persona con el compromiso pendiente', () => {
    expect(handoverLine(SITE)).toEqual({
      kind: 'person',
      person: 'Ana',
      commitment: { kind: 'pending' },
    })
  })

  it('a una persona que aceptó: con la fecha', () => {
    expect(handoverLine({ ...SITE, adopterAcceptedAt: '2026-10-09T15:00:00Z' })).toEqual({
      kind: 'person',
      person: 'Ana',
      commitment: { kind: 'accepted', at: '2026-10-09T15:00:00Z' },
    })
  })

  it('la persona dijo que no lo adoptó: su nombre, sin compromiso', () => {
    expect(handoverLine({ ...SITE, declined: true })).toEqual({ kind: 'declined', person: 'Ana' })
  })
})
