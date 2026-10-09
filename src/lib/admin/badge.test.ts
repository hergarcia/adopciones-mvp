// Covers: FR-020, spec §Edge Cases (más de 99)
import { describe, expect, it } from 'vitest'
import { badgeCount } from './badge'

describe('badgeCount', () => {
  it('sin pendientes, sin número', () => {
    expect(badgeCount(0)).toBeNull()
  })

  it('el número tal cual hasta 99', () => {
    expect(badgeCount(1)).toBe('1')
    expect(badgeCount(99)).toBe('99')
  })

  it('pasado 99, «99+»', () => {
    expect(badgeCount(100)).toBe('99+')
  })
})
