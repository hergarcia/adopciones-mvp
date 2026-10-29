// Covers: FR-028, R7 (si era un animal o una camada y la respuesta; nunca un id ni el día)
import { describe, expect, it } from 'vitest'
import { deletionReasonEvent } from './deletion-reason-events'

describe('el momento de «¿Por qué lo borrás?»', () => {
  it('un animal con su respuesta', () => {
    expect(deletionReasonEvent('pet', 'given_elsewhere')).toEqual({
      name: 'pet_deletion_reason',
      props: { kind: 'pet', reason: 'given_elsewhere' },
    })
  })

  it('una camada sin contestar', () => {
    expect(deletionReasonEvent('litter', 'unanswered')).toEqual({
      name: 'pet_deletion_reason',
      props: { kind: 'litter', reason: 'unanswered' },
    })
  })
})
