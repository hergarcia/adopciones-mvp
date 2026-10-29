// Covers: #244 (la vista previa nunca muestra un nivel más alto que la ficha)
import { describe, expect, it } from 'vitest'
import { shareImageVersion } from './share-image-version'

describe('shareImageVersion', () => {
  it('cambia cuando cambia el nivel de quien publicó, con la misma tarjeta', () => {
    expect(shareImageVersion('abc', 3)).toBe('abc-3')
    expect(shareImageVersion('abc', 2)).toBe('abc-2')
  })

  it('sin nivel lleva su propia versión', () => {
    expect(shareImageVersion('abc', null)).toBe('abc-0')
  })
})
