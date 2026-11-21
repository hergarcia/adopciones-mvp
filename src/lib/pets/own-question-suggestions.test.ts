// Covers: historia #300, criterios 1 a 4 (el 5, que Beto no ve las de Ana, lo cubre la RLS de
// `pets` y `litters` en tests/db/own-questions-privacy.test.ts).
import { describe, expect, it } from 'vitest'
import {
  ownQuestionSuggestions,
  shownOwnQuestionSuggestions,
  type OwnQuestionSource,
} from './own-question-suggestions'

const PATIO = '¿Tenés el patio cerrado?'
const PASTILLA = 'Kira toma una pastilla dos veces por día. ¿Podés dársela en horario?'

let day = 0
function source(name: string, question: string, id = name): OwnQuestionSource {
  day += 1
  return { id, name, question, publishedAt: new Date(Date.UTC(2026, 10, day)) }
}

describe('ownQuestionSuggestions', () => {
  it('ofrece las preguntas de la más nueva a la más vieja, con el nombre de donde se usaron', () => {
    const tobi = source('Tobi', PATIO)
    const kira = source('Kira', PASTILLA)
    const expected = [
      { question: PASTILLA, name: 'Kira' },
      { question: PATIO, name: 'Tobi' },
    ]
    expect(ownQuestionSuggestions([tobi, kira], null)).toEqual(expected)
    expect(ownQuestionSuggestions([kira, tobi], null)).toEqual(expected)
  })

  it('como mucho 3, sin repetir, de las publicaciones más recientes', () => {
    const sources = [
      source('Tobi', PATIO),
      source('Nube', PATIO),
      source('Luna', PATIO),
      source('Rayo', '¿Vivís en apartamento?'),
      source('Kira', PASTILLA),
      source('Coco', '¿Trabajás todo el día afuera?'),
    ]
    expect(ownQuestionSuggestions(sources, null)).toEqual([
      { question: '¿Trabajás todo el día afuera?', name: 'Coco' },
      { question: PASTILLA, name: 'Kira' },
      { question: '¿Vivís en apartamento?', name: 'Rayo' },
    ])
  })

  it('una repetida aparece una vez, con la publicación más nueva que la usó', () => {
    const sources = [source('Tobi', PATIO), source('Nube', PATIO), source('Luna', PATIO)]
    expect(ownQuestionSuggestions(sources, null)).toEqual([{ question: PATIO, name: 'Luna' }])
  })

  it('mayúsculas y espacios de más no la vuelven otra pregunta', () => {
    const sources = [
      source('Tobi', '¿tenés el  patio   cerrado?'),
      source('Nube', ' ¿Tenés el patio cerrado?'),
      source('Luna', PATIO),
    ]
    expect(ownQuestionSuggestions(sources, null)).toEqual([{ question: PATIO, name: 'Luna' }])
  })

  it('dos preguntas que difieren en un espacio siguen siendo dos', () => {
    const sources = [
      source('Tobi', '¿Tenés el patio cerrado?'),
      source('Nube', '¿Tenés elpatio cerrado?'),
    ]
    expect(ownQuestionSuggestions(sources, null)).toHaveLength(2)
  })

  it('dos letras que solo coinciden en mayúsculas siguen siendo dos preguntas', () => {
    const sources = [
      source('Tobi', '¿Vivís en la calle Weiß?'),
      source('Nube', '¿Vivís en la calle Weiss?'),
    ]
    expect(ownQuestionSuggestions(sources, null)).toHaveLength(2)
  })

  it('nunca ofrece la de la publicación que se edita', () => {
    const tobi = source('Tobi', PATIO, 'tobi-id')
    const kira = source('Kira', PASTILLA, 'kira-id')
    expect(ownQuestionSuggestions([tobi, kira], 'kira-id')).toEqual([
      { question: PATIO, name: 'Tobi' },
    ])
  })

  it('sin otras publicaciones con pregunta, no ofrece nada', () => {
    expect(ownQuestionSuggestions([], null)).toEqual([])
    expect(ownQuestionSuggestions([source('Kira', PASTILLA, 'kira-id')], 'kira-id')).toEqual([])
  })
})

describe('shownOwnQuestionSuggestions', () => {
  const suggestions = [{ question: PATIO, name: 'Tobi' }]

  it('con el campo vacío o solo con espacios, se ven', () => {
    expect(shownOwnQuestionSuggestions('', suggestions)).toEqual(suggestions)
    expect(shownOwnQuestionSuggestions('  \n', suggestions)).toEqual(suggestions)
  })

  it('en cuanto hay algo escrito, dejan de verse', () => {
    expect(shownOwnQuestionSuggestions('¿Ten', suggestions)).toEqual([])
  })
})
