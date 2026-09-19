import { describe, expect, it } from 'vitest'

describe('approximateAge', () => {
  it('runs', () => {
    const years = 24 / 12
    console.log(years)
  })

  it.skip('is skipped', () => {
    expect(1).toBe(1)
  })

  it('asserts only sometimes', () => {
    const years = 24 / 12
    if (years > 1) {
      expect(years).toBe(2)
    }
  })
})
