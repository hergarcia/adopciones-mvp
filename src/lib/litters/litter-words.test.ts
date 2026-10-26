// Covers: FR-051 de #205; youngLabel, FR-036 y FR-038 de #206. La regla se ve fallar con un
// ejemplo y después corre sobre los textos de verdad.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { forbiddenLitterWords, youngLabel } from './litter-words'

const messages: { litters: Record<string, unknown> } = JSON.parse(
  readFileSync('messages/es.json', 'utf8'),
)

describe('forbiddenLitterWords', () => {
  it('encuentra «cachorros» y «Gatitos», con su clave', () => {
    expect(
      forbiddenLitterWords({
        card: { count: 'Tres cachorros', ok: 'Tres crías' },
        page: 'Gatitos en adopción',
        size: 4,
        empty: null,
      }),
    ).toEqual(['card.count', 'page'])
  })

  it('un texto suelto sin ruta', () => {
    expect(forbiddenLitterWords('Un CACHORRO')).toEqual([''])
    expect(forbiddenLitterWords('Una cría')).toEqual([])
  })

  it('ningún texto de las camadas dice «cachorro» ni «gatito»', () => {
    expect(Object.keys(messages.litters).length).toBeGreaterThan(0)
    expect(forbiddenLitterWords(messages.litters)).toEqual([])
  })
})

describe('youngLabel', () => {
  it('un animal suelto se nombra solo', () => {
    expect(youngLabel({ name: 'Tobi', litterName: null })).toEqual({
      form: 'none',
      name: 'Tobi',
      litter: '',
    })
  })

  it('una camada que ya dice «camada» se usa sin el artículo, en minúscula', () => {
    expect(youngLabel({ name: 'Cría 2', litterName: '  La camada de Luna ' })).toEqual({
      form: 'own',
      name: 'Cría 2',
      litter: 'camada de Luna',
    })
    expect(youngLabel({ name: 'Cría 1', litterName: 'Camada del galpón' })).toEqual({
      form: 'own',
      name: 'Cría 1',
      litter: 'camada del galpón',
    })
    expect(youngLabel({ name: 'Cría 1', litterName: 'Camada de la Luna' }).litter).toBe(
      'camada de la Luna',
    )
    expect(youngLabel({ name: 'Cría 1', litterName: 'LA   CAMADA de Mora' }).litter).toBe(
      'cAMADA de Mora',
    )
  })

  it('una camada con otro nombre va entre comillas, tal cual', () => {
    expect(youngLabel({ name: 'Cría 3', litterName: ' Los del galpón ' })).toEqual({
      form: 'quoted',
      name: 'Cría 3',
      litter: 'Los del galpón',
    })
    expect(youngLabel({ name: 'Cría 3', litterName: 'Camadita feliz' }).form).toBe('quoted')
    expect(youngLabel({ name: 'Cría 3', litterName: 'Mi camada' }).form).toBe('quoted')
  })
})
