// Covers: US1-AS3, US1-AS4, US1-AS7, US1-AS8, US4-AS1, FR-008, FR-009, FR-020 (research R10 de la
// #57) y, de la #59: US1-AS1, US1-AS3, US1-AS4, US1-AS12, US2-AS3, US2-AS6, FR-009, FR-013
import { describe, expect, it } from 'vitest'
import { petPageState } from './pet-page-state'
import type { PublicPet } from './types'

const LUNA: PublicPet = {
  visibility: 'listed',
  isOwner: false,
  state: 'available',
  takedown: null,
  editId: null,
  code: 'k3x9p2qa7m',
  name: 'Luna',
  species: 'dog',
  sex: 'female',
  age: { value: 2, unit: 'years' },
  size: 'medium',
  isNeutered: true,
  vaccines: 'up_to_date',
  hasChip: false,
  goodWithKids: 'yes',
  goodWithDogs: 'unknown',
  goodWithCats: 'no',
  description: null,
  zone: { department: 'UY-MO', locality: 'Pocitos' },
  isUrgent: false,
  publishedOn: '2026-09-20',
  photos: [],
  publisher: { name: 'Ana', avatar: null, isRescuer: true, level: 1 },
  version: 'abc123',
  signedAt: '2026-09-28T12:00:00.000Z',
}

const pet = (overrides: Partial<PublicPet>): PublicPet => ({ ...LUNA, ...overrides })

describe('petPageState', () => {
  it('sin fila es «no está publicado»: no existe, borrada o dada de baja', () => {
    expect(petPageState(null, { signedIn: true })).toEqual({ kind: 'missing' })
  })

  it('oculto sin sesión: «no disponible» con entrar', () => {
    expect(petPageState({ visibility: 'hidden', isOwner: false }, { signedIn: false })).toEqual({
      kind: 'unavailable',
      offerSignIn: true,
    })
  })

  it('oculto con otra sesión: «no disponible» sin entrar', () => {
    expect(petPageState({ visibility: 'hidden', isOwner: false }, { signedIn: true })).toEqual({
      kind: 'unavailable',
      offerSignIn: false,
    })
  })

  it.each([false, true])('pausada, con sesión %s: el texto de pausada, sin entrar', (signedIn) => {
    expect(petPageState({ visibility: 'paused', isOwner: false }, { signedIn })).toEqual({
      kind: 'paused',
    })
  })

  it.each([false, true])('vencida, con sesión %s: el texto de vencida, sin entrar', (signedIn) => {
    expect(petPageState({ visibility: 'expired', isOwner: false }, { signedIn })).toEqual({
      kind: 'expired',
    })
  })

  it('oculto y es el publicador sin nivel 1: su ficha con el aviso de confirmar', () => {
    const own = pet({ visibility: 'hidden', isOwner: true })
    expect(petPageState(own, { signedIn: true })).toEqual({
      kind: 'own_hidden',
      pet: own,
      reason: 'no_level',
    })
  })

  it.each(['paused', 'expired'] as const)('%s y es el publicador: su ficha con ese motivo', (s) => {
    const own = pet({ visibility: s, state: s, isOwner: true })
    expect(petPageState(own, { signedIn: true })).toEqual({
      kind: 'own_hidden',
      pet: own,
      reason: s,
    })
  })

  it('pausada y además sin nivel 1: el motivo es la pausa', () => {
    const own = pet({ visibility: 'paused', state: 'paused', isOwner: true })
    expect(petPageState(own, { signedIn: true })).toMatchObject({ reason: 'paused' })
  })

  it('dada de baja y es el publicador: su ficha con el motivo de la baja', () => {
    const own = pet({ visibility: 'hidden', state: 'taken_down', isOwner: true })
    expect(petPageState(own, { signedIn: true })).toEqual({
      kind: 'own_hidden',
      pet: own,
      reason: 'taken_down',
    })
  })

  it('a la vista y es el publicador: su ficha con «Editar»', () => {
    const own = pet({ isOwner: true })
    expect(petPageState(own, { signedIn: true })).toEqual({ kind: 'own_listed', pet: own })
  })

  it('adoptada y es el publicador: su ficha a la vista', () => {
    const own = pet({ visibility: 'adopted', state: 'adopted', isOwner: true })
    expect(petPageState(own, { signedIn: true })).toEqual({ kind: 'own_listed', pet: own })
  })

  it('a la vista y otra persona, con o sin sesión: la ficha de siempre', () => {
    const listed = pet({})
    expect(petPageState(listed, { signedIn: true })).toEqual({ kind: 'listed', pet: listed })
    expect(petPageState(listed, { signedIn: false })).toEqual({ kind: 'listed', pet: listed })
  })

  it('adoptada y otra persona: la ficha, con su estado adentro', () => {
    const adopted = pet({ visibility: 'adopted', state: 'adopted' })
    expect(petPageState(adopted, { signedIn: false })).toEqual({ kind: 'listed', pet: adopted })
  })
})
