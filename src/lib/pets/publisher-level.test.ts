// Covers: FR-007, US1-AS1 (el nivel 3, plan §Reanudación 3)
import { describe, expect, it } from 'vitest'
import { isPublisherLevel, ownPublicationsLevel, publisherLevelLabel } from './publisher-level'

describe('publisherLevelLabel', () => {
  it('nivel 1 es «Teléfono verificado»; 2, «Identidad verificada»; 3, «… y avalada»; sin nivel, sin sello', () => {
    expect(publisherLevelLabel(1)).toBe('level_one')
    expect(publisherLevelLabel(2)).toBe('level_two')
    expect(publisherLevelLabel(3)).toBe('level_three')
    expect(publisherLevelLabel(null)).toBeNull()
  })
})

describe('isPublisherLevel', () => {
  it('lo que devuelve la base es 1, 2 o 3; cualquier otra cosa es sin nivel', () => {
    expect([1, 2, 3].every(isPublisherLevel)).toBe(true)
    expect([0, 4, null].some(isPublisherLevel)).toBe(false)
  })
})

// Covers: #283, la línea de «Mis animales» con cada nivel y sin ninguno
describe('ownPublicationsLevel', () => {
  it('dice lo mismo que la ficha en cada nivel y nada en 0, cuando sus animales no se ven', () => {
    expect(ownPublicationsLevel(1)).toBe('level_one')
    expect(ownPublicationsLevel(2)).toBe('level_two')
    expect(ownPublicationsLevel(3)).toBe('level_three')
    expect(ownPublicationsLevel(0)).toBeNull()
  })
})
