// Covers: FR-025, US4-AS9 (lo que llega a la acción de quien administra)
import { describe, expect, it } from 'vitest'
import { TAKEDOWN_NOTE_MAX } from '@/lib/pets/rules'
import { petReviewResolutionSchema } from './pet-review'

const PET = '7b0c4a1e-2f3d-4c5b-8a9e-0f1e2d3c4b5a'
const SINCE = '2026-10-01T04:12:42.123456+00:00'
const base = { petId: PET, knownSince: SINCE }
const other = { ...base, outcome: 'taken_down', reason: 'other' }

function errorsOf(input: unknown) {
  const parsed = petReviewResolutionSchema.safeParse(input)
  return parsed.success ? [] : parsed.error.issues.map((issue) => [issue.path, issue.message])
}

describe('petReviewResolutionSchema', () => {
  it('acepta marcar revisada, tal cual', () => {
    expect(petReviewResolutionSchema.safeParse({ ...base, outcome: 'reviewed' })).toEqual({
      success: true,
      data: { ...base, outcome: 'reviewed' },
    })
  })

  it('acepta una baja con un motivo de la lista, sin texto', () => {
    const input = { ...base, outcome: 'taken_down', reason: 'sale_or_money' }
    expect(petReviewResolutionSchema.safeParse(input)).toEqual({
      success: true,
      data: { ...input, note: null },
    })
  })

  it('descarta el texto que viene con un motivo que no es «otro»', () => {
    const input = { ...base, outcome: 'taken_down', reason: 'not_dog_or_cat' }
    expect(petReviewResolutionSchema.safeParse({ ...input, note: 'Es un loro' }).data).toEqual({
      ...input,
      note: null,
    })
  })

  it('«otro» guarda el texto sin los espacios de los bordes', () => {
    const parsed = petReviewResolutionSchema.safeParse({ ...other, note: '  Un teléfono  ' })
    expect(parsed.data).toEqual({ ...other, note: 'Un teléfono' })
  })

  it('«otro» sin texto, o con solo espacios, pide escribirlo', () => {
    const required = [[['note'], 'pet_review.errors.note_required']]
    expect(errorsOf(other)).toEqual(required)
    expect(errorsOf({ ...other, note: '   ' })).toEqual(required)
  })

  it('«otro» acepta 300 caracteres y no 301', () => {
    expect(errorsOf({ ...other, note: 'a'.repeat(TAKEDOWN_NOTE_MAX) })).toEqual([])
    expect(errorsOf({ ...other, note: 'a'.repeat(TAKEDOWN_NOTE_MAX + 1) })).toEqual([
      [['note'], 'pet_review.errors.note_too_long'],
    ])
  })

  it('cuenta los caracteres como la base: un emoji es uno', () => {
    expect(errorsOf({ ...other, note: '🐶'.repeat(TAKEDOWN_NOTE_MAX) })).toEqual([])
  })

  it.each([
    ['un motivo que no existe', { ...base, outcome: 'taken_down', reason: 'ugly' }],
    ['un id que no es uuid', { ...base, petId: 'k3x9p2qa7m', outcome: 'reviewed' }],
    ['una espera sin hora', { ...base, knownSince: '2026-10-01', outcome: 'reviewed' }],
    ['un campo de más', { ...base, outcome: 'reviewed', note: 'hola' }],
    ['un resultado que no existe', { ...base, outcome: 'approve' }],
  ])('rechaza %s', (_, input) => {
    expect(petReviewResolutionSchema.safeParse(input).success).toBe(false)
  })
})
