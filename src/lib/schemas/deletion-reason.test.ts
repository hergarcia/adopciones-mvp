// Covers: FR-010, FR-011 (lo que llega de la confirmación de borrar)
import { describe, expect, it } from 'vitest'
import { DELETION_ANSWERS } from '@/lib/pets/deletion-reason'
import { deletionAnswerSchema } from './deletion-reason'

describe('deletionAnswerSchema', () => {
  it.each(DELETION_ANSWERS)('acepta %s', (answer) => {
    expect(deletionAnswerSchema.safeParse(answer)).toEqual({ success: true, data: answer })
  })

  it('acepta que no venga: la confirmación no mostró la pregunta', () => {
    expect(deletionAnswerSchema.safeParse(undefined)).toEqual({ success: true, data: undefined })
  })

  it('rechaza una opción que no existe, vacío y nulo', () => {
    expect(deletionAnswerSchema.safeParse('groups').success).toBe(false)
    expect(deletionAnswerSchema.safeParse('').success).toBe(false)
    expect(deletionAnswerSchema.safeParse(null).success).toBe(false)
  })
})
