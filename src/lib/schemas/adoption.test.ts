// Covers: FR-001, FR-003 (marcar adoptado: a una persona o por fuera)
import { describe, expect, it } from 'vitest'
import { handoverSchema } from './adoption'

const PET = '6f4c1f0e-6a2b-4c7e-9d1a-3b2c1d0e9f8a'
const APPLICATION = '1a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c8d'
const ATTEMPT = '9e8d7c6b-5a4f-4e3d-9c2b-1a0f9e8d7c6b'

describe('handoverSchema', () => {
  it('a una persona: el animal, su solicitud y el intento', () => {
    const input = { petId: PET, applicationId: APPLICATION, attemptId: ATTEMPT }
    expect(handoverSchema.parse(input)).toEqual(input)
  })

  it('por fuera del sitio: la solicitud es null', () => {
    const input = { petId: PET, applicationId: null, attemptId: ATTEMPT }
    expect(handoverSchema.parse(input)).toEqual(input)
  })

  it.each([
    ['sin solicitud', { petId: PET, attemptId: ATTEMPT }],
    ['una solicitud que no es un id', { petId: PET, applicationId: 'ana', attemptId: ATTEMPT }],
    ['un animal que no es un id', { petId: 'tobi', applicationId: null, attemptId: ATTEMPT }],
    ['sin intento', { petId: PET, applicationId: null }],
    ['un intento que no es un id', { petId: PET, applicationId: null, attemptId: '1' }],
    ['un campo de más', { petId: PET, applicationId: null, attemptId: ATTEMPT, extra: 1 }],
  ])('rechaza %s', (_what, input) => {
    expect(handoverSchema.safeParse(input).success).toBe(false)
  })
})
