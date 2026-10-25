// Covers: US1-AS4, US1-AS8, FR-007, FR-008 y el Edge Case «Nombre de cría repetido»
import { describe, expect, it } from 'vitest'
import { nextYoungName, normalizeYoungName, repeatedYoungNames } from './young-names'

const named = (number: number) => `Cría ${number}`

describe('normalizeYoungName', () => {
  it('no mira mayúsculas ni los espacios de los bordes', () => {
    expect(normalizeYoungName('  CRÍA 1 ')).toBe('cría 1')
  })

  it('los espacios de adentro cuentan', () => {
    expect(normalizeYoungName('Cría  1')).not.toBe(normalizeYoungName('Cría 1'))
  })
})

describe('nextYoungName', () => {
  it('sin crías, la 1', () => {
    expect(nextYoungName([], named)).toBe('Cría 1')
  })

  it('después de la última, la siguiente', () => {
    expect(nextYoungName(['Cría 1', 'Cría 2'], named)).toBe('Cría 3')
  })

  it('después de quitar la 2, vuelve la 2', () => {
    expect(nextYoungName(['Cría 1', 'Cría 3'], named)).toBe('Cría 2')
  })

  it('un nombre cambiado libera su número', () => {
    expect(nextYoungName(['Tito', 'Cría 2'], named)).toBe('Cría 1')
  })

  it('el número tomado con otra mayúscula o con espacios cuenta como tomado', () => {
    expect(nextYoungName([' cría 1 ', 'CRÍA 2'], named)).toBe('Cría 3')
  })
})

describe('repeatedYoungNames', () => {
  it('marca la que repite, no la primera', () => {
    expect(repeatedYoungNames(['Tito', 'Mora', 'Tito'])).toEqual([2])
  })

  it('con otra mayúscula y con espacios es la misma', () => {
    expect(repeatedYoungNames(['Cría 1', ' cría 1 ', 'CRÍA 1'])).toEqual([1, 2])
  })

  it('dos vacías no se marcan como repetidas: les falta el nombre', () => {
    expect(repeatedYoungNames(['', '  ', 'Tito'])).toEqual([])
  })

  it('sin repetidas, ninguna', () => {
    expect(repeatedYoungNames(['Tito', 'Mora'])).toEqual([])
  })
})
