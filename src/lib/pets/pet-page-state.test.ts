// Covers: US1-AS3, US1-AS4, US1-AS7, US1-AS8, US4-AS1, FR-008, FR-009, FR-020 (research R10)
import { describe, expect, it } from 'vitest'
import { petPageState } from './pet-page-state'
import type { PublicPet } from './types'

const LUNA: PublicPet = {
  visibility: 'listed',
  isOwner: false,
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
  it('sin fila es «no está publicado»', () => {
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

  it('oculto y es el publicador: su ficha con el aviso, sin «Editar»', () => {
    const own = pet({ visibility: 'hidden', isOwner: true })
    expect(petPageState(own, { signedIn: true })).toEqual({ kind: 'own_hidden', pet: own })
  })

  it('a la vista y es el publicador: su ficha con «Editar»', () => {
    const own = pet({ isOwner: true })
    expect(petPageState(own, { signedIn: true })).toEqual({ kind: 'own_listed', pet: own })
  })

  it('a la vista y otra persona, con o sin sesión: la ficha de siempre', () => {
    const listed = pet({})
    expect(petPageState(listed, { signedIn: true })).toEqual({ kind: 'listed', pet: listed })
    expect(petPageState(listed, { signedIn: false })).toEqual({ kind: 'listed', pet: listed })
  })
})
