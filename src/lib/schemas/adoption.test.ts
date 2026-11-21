// Covers: FR-001, FR-003 (marcar adoptado: a una persona o por fuera)
import { describe, expect, it } from 'vitest'
import { FOUND_VIA_OPTIONS } from '@/lib/adoptions/found-via'
import { commitmentActionSchema, handoverSchema } from './adoption'

const PET = '6f4c1f0e-6a2b-4c7e-9d1a-3b2c1d0e9f8a'
const APPLICATION = '1a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c8d'
const ATTEMPT = '9e8d7c6b-5a4f-4e3d-9c2b-1a0f9e8d7c6b'

describe('handoverSchema', () => {
  it('a una persona: el animal, su solicitud y el intento', () => {
    const input = { petId: PET, applicationId: APPLICATION, attemptId: ATTEMPT, foundVia: null }
    expect(handoverSchema.parse(input)).toEqual(input)
  })

  it('por fuera del sitio: la solicitud es null', () => {
    const input = { petId: PET, applicationId: null, attemptId: ATTEMPT, foundVia: null }
    expect(handoverSchema.parse(input)).toEqual(input)
  })

  // Covers: US1-AS2, US1-AS7 (por dónde te encontró, #254)
  it.each(FOUND_VIA_OPTIONS)('por fuera con %s como canal', (foundVia) => {
    const input = { petId: PET, applicationId: null, attemptId: ATTEMPT, foundVia }
    expect(handoverSchema.parse(input)).toEqual(input)
  })

  it.each([
    ['sin solicitud', { petId: PET, attemptId: ATTEMPT, foundVia: null }],
    [
      'una solicitud que no es un id',
      { petId: PET, applicationId: 'ana', attemptId: ATTEMPT, foundVia: null },
    ],
    [
      'un animal que no es un id',
      { petId: 'tobi', applicationId: null, attemptId: ATTEMPT, foundVia: null },
    ],
    ['sin intento', { petId: PET, applicationId: null, foundVia: null }],
    [
      'un intento que no es un id',
      { petId: PET, applicationId: null, attemptId: '1', foundVia: null },
    ],
    ['sin canal', { petId: PET, applicationId: null, attemptId: ATTEMPT }],
    [
      'un canal que no es una opción',
      { petId: PET, applicationId: null, attemptId: ATTEMPT, foundVia: 'tiktok' },
    ],
    [
      'un campo de más',
      { petId: PET, applicationId: null, attemptId: ATTEMPT, foundVia: null, extra: 1 },
    ],
  ])('rechaza %s', (_what, input) => {
    expect(handoverSchema.safeParse(input).success).toBe(false)
  })
})

// Covers: FR-013 (aceptar el compromiso: solo la solicitud)
describe('commitmentActionSchema', () => {
  it('la solicitud', () => {
    expect(commitmentActionSchema.parse({ applicationId: APPLICATION })).toEqual({
      applicationId: APPLICATION,
    })
  })

  it.each([
    ['sin solicitud', {}],
    ['una solicitud que no es un id', { applicationId: 'ana' }],
    ['una solicitud nula', { applicationId: null }],
    ['un campo de más', { applicationId: APPLICATION, adopter: PET }],
  ])('rechaza %s', (_what, input) => {
    expect(commitmentActionSchema.safeParse(input).success).toBe(false)
  })
})
