// Covers: FR-020, FR-021, US2-AS2, US2-AS5 y las relacionadas de los casos borde
import { describe, expect, it } from 'vitest'
import { questionGroups, relatedFor } from './groups'
import { QUESTION_PAGES, type QuestionSlug } from './pages'

const page = (slug: QuestionSlug) => QUESTION_PAGES.find((one) => one.slug === slug)!

describe('questionGroups', () => {
  it('ordena los grupos como el índice, venga como venga el registro', () => {
    expect(
      questionGroups([
        'como-se-verifica',
        'reconocer-una-estafa',
        'antes-de-entregar',
        'compromiso-y-seguimiento',
        'que-exige-uruguay',
      ]),
    ).toEqual([
      { group: 'giver', slugs: ['antes-de-entregar', 'que-exige-uruguay'] },
      { group: 'adopter', slugs: ['reconocer-una-estafa', 'compromiso-y-seguimiento'] },
      { group: 'everyone', slugs: ['como-se-verifica'] },
    ])
  })

  it('un grupo sin publicadas no aparece', () => {
    expect(questionGroups(['como-se-verifica', 'antes-de-entregar'])).toEqual([
      { group: 'giver', slugs: ['antes-de-entregar'] },
      { group: 'everyone', slugs: ['como-se-verifica'] },
    ])
  })

  it('sin publicadas no hay grupos', () => {
    expect(questionGroups([])).toEqual([])
  })
})

describe('relatedFor', () => {
  const ALL = [
    'como-se-verifica',
    'antes-de-entregar',
    'que-exige-uruguay',
    'reconocer-una-estafa',
    'compromiso-y-seguimiento',
  ] as const

  it('las dos del registro, en su orden', () => {
    expect(relatedFor(page('reconocer-una-estafa'), ALL)).toEqual([
      'compromiso-y-seguimiento',
      'como-se-verifica',
    ])
  })

  it('una retirada deja de mostrarse', () => {
    expect(
      relatedFor(page('antes-de-entregar'), ['antes-de-entregar', 'como-se-verifica']),
    ).toEqual(['como-se-verifica'])
  })

  it('sin relacionadas publicadas queda vacía, y nunca es la propia', () => {
    expect(relatedFor(page('como-se-verifica'), ['como-se-verifica'])).toEqual([])
  })
})
