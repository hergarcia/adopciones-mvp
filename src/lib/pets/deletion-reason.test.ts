// Covers: FR-001, FR-002, FR-003, FR-008, FR-010 (cuándo se pregunta y qué se cuenta de lo elegido)
import { describe, expect, it } from 'vitest'
import {
  DELETION_ANSWERS,
  DELETION_KINDS,
  DELETION_REASONS,
  deletionAnswerOf,
  litterAsksDeletionReason,
  petAsksDeletionReason,
} from './deletion-reason'

describe('las opciones', () => {
  it('son las cinco de la historia, en su orden, y sin contestar va aparte al final', () => {
    expect(DELETION_REASONS).toEqual([
      'no_applications',
      'unconvincing_applications',
      'given_elsewhere',
      'not_for_adoption',
      'other',
    ])
    expect(DELETION_ANSWERS).toEqual([...DELETION_REASONS, 'unanswered'])
  })

  it('se cuentan de un animal o de una camada, en ese orden', () => {
    expect(DELETION_KINDS).toEqual(['pet', 'litter'])
  })
})

describe('petAsksDeletionReason', () => {
  it.each(['available', 'in_process', 'paused', 'expired'] as const)('%s pregunta', (state) => {
    expect(petAsksDeletionReason(state)).toBe(true)
  })

  // Covers: US1-AS6, US1-AS7
  it.each(['adopted', 'taken_down'] as const)('%s no pregunta', (state) => {
    expect(petAsksDeletionReason(state)).toBe(false)
  })
})

describe('litterAsksDeletionReason', () => {
  it.each(['available', 'paused', 'expired'] as const)('%s pregunta', (state) => {
    expect(litterAsksDeletionReason(state)).toBe(true)
  })

  it.each(['adopted', 'taken_down'] as const)('%s no pregunta', (state) => {
    expect(litterAsksDeletionReason(state)).toBe(false)
  })
})

describe('deletionAnswerOf', () => {
  it.each(DELETION_REASONS)('%s se cuenta tal cual', (reason) => {
    expect(deletionAnswerOf(reason)).toBe(reason)
  })

  // Covers: US1-AS3, US1-AS5 (nada elegido, o la elegida tocada otra vez)
  it('vacío es sin contestar', () => {
    expect(deletionAnswerOf('')).toBe('unanswered')
  })

  it('algo que no es una opción es sin contestar', () => {
    expect(deletionAnswerOf('groups')).toBe('unanswered')
    expect(deletionAnswerOf('unanswered')).toBe('unanswered')
  })
})
