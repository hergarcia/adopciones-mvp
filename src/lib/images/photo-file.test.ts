// Covers: US1-AS8, FR-007 y el Edge Case «Formatos».
import { describe, expect, it } from 'vitest'
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_BYTES, photoFileProblem } from './photo-file'

describe('photoFileProblem', () => {
  it('acepta los cuatro formatos', () => {
    expect(ACCEPTED_PHOTO_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
    for (const type of ACCEPTED_PHOTO_TYPES) expect(photoFileProblem({ type, size: 1 })).toBeNull()
  })

  it.each(['image/heic', 'image/gif', 'video/mp4', 'application/pdf', ''])('rechaza %s', (type) => {
    expect(photoFileProblem({ type, size: 1 })).toBe('type')
  })

  it('10 MB justos pasan y un byte más no', () => {
    expect(MAX_PHOTO_BYTES).toBe(10 * 1024 * 1024)
    expect(photoFileProblem({ type: 'image/jpeg', size: MAX_PHOTO_BYTES })).toBeNull()
    expect(photoFileProblem({ type: 'image/jpeg', size: MAX_PHOTO_BYTES + 1 })).toBe('too_big')
  })

  it('el tipo se mira antes que el tamaño', () => {
    expect(photoFileProblem({ type: 'image/gif', size: MAX_PHOTO_BYTES + 1 })).toBe('type')
  })
})
