// Covers: US1-AS2, US1-AS7, FR-010, FR-011, SC-006
import { describe, expect, it } from 'vitest'
import { commitmentClauses } from './commitment'

describe('commitmentClauses', () => {
  it('sin castrar al marcar: todas, con la castración después del cuidado', () => {
    expect(commitmentClauses({ includesNeuter: true })).toEqual([
      'care',
      'neuter',
      'keep',
      'give_back',
      'take_back',
      'word',
    ])
  })

  it('castrado al marcar: sin la línea de la castración, el resto en el mismo orden', () => {
    expect(commitmentClauses({ includesNeuter: false })).toEqual([
      'care',
      'keep',
      'give_back',
      'take_back',
      'word',
    ])
  })
})
