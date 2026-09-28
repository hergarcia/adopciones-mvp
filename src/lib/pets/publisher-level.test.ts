// Covers: FR-007, US1-AS1
import { describe, expect, it } from 'vitest'
import { publisherLevelLabel } from './publisher-level'

describe('publisherLevelLabel', () => {
  it('nivel 1 es «Teléfono verificado»; nivel 2, «Identidad verificada»; sin nivel, sin sello', () => {
    expect(publisherLevelLabel(1)).toBe('level_one')
    expect(publisherLevelLabel(2)).toBe('level_two')
    expect(publisherLevelLabel(null)).toBeNull()
  })
})
