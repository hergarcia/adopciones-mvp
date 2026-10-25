// Covers: FR-051. La regla se ve fallar con un ejemplo y después corre sobre los textos de verdad.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { forbiddenLitterWords } from './litter-words'

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
