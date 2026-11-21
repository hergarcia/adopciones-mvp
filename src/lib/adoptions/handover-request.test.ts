// Covers: FR-010, FR-013 (lo que manda la pantalla según el camino)
import { describe, expect, it } from 'vitest'
import { OUTSIDE, handoverRequest } from './handover-request'

const PET = '6f4c1f0e-6a2b-4c7e-9d1a-3b2c1d0e9f8a'
const APPLICATION = '1a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c8d'
const ATTEMPT = '9e8d7c6b-5a4f-4e3d-9c2b-1a0f9e8d7c6b'

describe('handoverRequest', () => {
  // Covers: US1-AS5
  it('con una persona: su solicitud y ningún canal, aunque se haya tocado uno', () => {
    expect(
      handoverRequest({
        petId: PET,
        attemptId: ATTEMPT,
        choice: APPLICATION,
        foundVia: 'instagram',
      }),
    ).toStrictEqual({ petId: PET, applicationId: APPLICATION, attemptId: ATTEMPT, foundVia: null })
  })

  // Covers: US1-AS2
  it('por fuera con un canal: sin solicitud y el canal', () => {
    expect(
      handoverRequest({ petId: PET, attemptId: ATTEMPT, choice: OUTSIDE, foundVia: 'facebook' }),
    ).toStrictEqual({ petId: PET, applicationId: null, attemptId: ATTEMPT, foundVia: 'facebook' })
  })

  // Covers: US1-AS3
  it('por fuera sin elegir: sin solicitud y sin canal', () => {
    expect(
      handoverRequest({ petId: PET, attemptId: ATTEMPT, choice: OUTSIDE, foundVia: '' }),
    ).toStrictEqual({ petId: PET, applicationId: null, attemptId: ATTEMPT, foundVia: null })
  })

  it('«por fuera» se elige con la clave outside', () => {
    expect(OUTSIDE).toBe('outside')
  })
})
