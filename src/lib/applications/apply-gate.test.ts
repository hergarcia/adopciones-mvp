// Covers: FR-003, FR-004, FR-005, FR-063, US1-AS3, US1-AS8, US4-AS4 (el orden de los frenos)
import { describe, expect, it } from 'vitest'
import { applyGate } from './apply-gate'
import type { ApplyContext } from './types'

const OPEN: ApplyContext = {
  isOwner: false,
  receiving: 'yes',
  inProcess: false,
  blockedByPublisher: false,
  blockedPublisher: false,
  myActiveId: null,
  activeCount: 0,
  levelOne: true,
  levelTwo: false,
  requiredLevel: 1,
}

// Todo lo que frena a la vez: cada caso saca lo anterior y mira qué gana.
const EVERYTHING: ApplyContext = {
  isOwner: true,
  receiving: 'closed',
  inProcess: true,
  blockedByPublisher: true,
  blockedPublisher: true,
  myActiveId: 'activa',
  activeCount: 3,
  levelOne: false,
  levelTwo: false,
  requiredLevel: 2,
}

describe('applyGate', () => {
  it('con todo en orden, el cuestionario', () => {
    expect(applyGate(OPEN)).toEqual({ kind: 'form', inProcess: false })
  })

  it('en proceso, el cuestionario con la marca', () => {
    expect(applyGate({ ...OPEN, inProcess: true })).toEqual({ kind: 'form', inProcess: true })
  })

  it('la dueña ve lo suyo antes que cualquier otra cosa, en cualquier estado', () => {
    expect(applyGate(EVERYTHING)).toEqual({ kind: 'own' })
    expect(applyGate({ ...OPEN, isOwner: true, receiving: 'unavailable' })).toEqual({ kind: 'own' })
  })

  it('quien bloqueó al publicador ve el bloqueo, aunque también la hayan bloqueado', () => {
    expect(applyGate({ ...EVERYTHING, isOwner: false })).toEqual({ kind: 'blocked_publisher' })
  })

  it('la bloqueada ve que no recibe solicitudes, sin importar su nivel ni el estado', () => {
    expect(
      applyGate({ ...EVERYTHING, isOwner: false, blockedPublisher: false, receiving: 'yes' }),
    ).toEqual({ kind: 'not_receiving' })
    expect(
      applyGate({ ...OPEN, blockedByPublisher: true, receiving: 'unavailable', levelTwo: true }),
    ).toEqual({ kind: 'not_receiving' })
  })

  it('un animal que ya no recibe solicitudes, antes que su solicitud activa', () => {
    expect(
      applyGate({
        ...EVERYTHING,
        isOwner: false,
        blockedPublisher: false,
        blockedByPublisher: false,
      }),
    ).toEqual({ kind: 'not_receiving' })
  })

  it('un animal no disponible por ahora, antes que su solicitud activa', () => {
    expect(
      applyGate({
        ...EVERYTHING,
        isOwner: false,
        blockedPublisher: false,
        blockedByPublisher: false,
        receiving: 'unavailable',
      }),
    ).toEqual({ kind: 'unavailable' })
  })

  it('la activa por ese animal, antes que el límite', () => {
    expect(applyGate({ ...OPEN, myActiveId: 'activa', activeCount: 3, levelOne: false })).toEqual({
      kind: 'has_active',
      id: 'activa',
    })
  })

  it('el límite antes que el teléfono', () => {
    expect(applyGate({ ...OPEN, activeCount: 3, levelOne: false, requiredLevel: 2 })).toEqual({
      kind: 'limit',
    })
  })

  it('con dos activas todavía hay lugar', () => {
    expect(applyGate({ ...OPEN, activeCount: 2 })).toEqual({ kind: 'form', inProcess: false })
  })

  it('el teléfono antes que la identidad', () => {
    expect(applyGate({ ...OPEN, levelOne: false, requiredLevel: 2 })).toEqual({
      kind: 'needs_phone',
    })
  })

  it('un animal que pide identidad, a quien no la tiene', () => {
    expect(applyGate({ ...OPEN, requiredLevel: 2 })).toEqual({ kind: 'needs_identity' })
  })

  it('con identidad, al cuestionario de un animal que la pide', () => {
    expect(applyGate({ ...OPEN, requiredLevel: 2, levelTwo: true })).toEqual({
      kind: 'form',
      inProcess: false,
    })
  })

  it('nivel 2 con un animal que pide teléfono: el cuestionario', () => {
    expect(applyGate({ ...OPEN, levelTwo: true })).toEqual({ kind: 'form', inProcess: false })
  })
})
