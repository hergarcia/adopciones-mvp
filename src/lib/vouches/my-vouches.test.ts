import { describe, expect, it } from 'vitest'
import { countingReceived, pauseMark } from './my-vouches'
import type { MyVouch } from './types'

function row(overrides: Partial<MyVouch> = {}): MyVouch {
  return {
    direction: 'received',
    otherPublicId: 'SemillaBeto00000000006',
    otherDisplayName: 'Beto Silva',
    otherHasPhoto: false,
    givenOn: '2026-09-03',
    mineLacksLevelTwo: false,
    otherLacksLevelTwo: false,
    ...overrides,
  }
}

// Covers: FR-025, US4-AS6. La marca dice a quién le falta el nivel 2, sin decir por qué.
describe('la marca de un aval en pausa', () => {
  it('ninguna si las dos partes tienen nivel 2', () => {
    expect(pauseMark(row())).toBeNull()
  })

  it('mía, suya o de las dos', () => {
    expect(pauseMark(row({ mineLacksLevelTwo: true }))).toBe('mine')
    expect(pauseMark(row({ otherLacksLevelTwo: true }))).toBe('theirs')
    expect(pauseMark(row({ mineLacksLevelTwo: true, otherLacksLevelTwo: true }))).toBe('both')
  })
})

// Covers: FR-022, SC-005. Un número de más en «Mi perfil» miente sobre lo que ve el perfil público.
describe('los avales que cuentan', () => {
  it('solo los recibidos sin pausa', () => {
    expect(
      countingReceived([
        row(),
        row({ otherPublicId: 'SemillaAval00000000001' }),
        row({ otherPublicId: 'SemillaAval00000000002' }),
        row({ direction: 'given' }),
        row({ otherLacksLevelTwo: true }),
        row({ mineLacksLevelTwo: true }),
      ]),
    ).toBe(3)
  })

  it('ninguno sin filas', () => {
    expect(countingReceived([])).toBe(0)
  })
})
