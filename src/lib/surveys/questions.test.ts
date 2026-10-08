// Covers: US1-AS1, US1-AS2, US1-AS3 (la pregunta y las opciones de cada momento)
import { describe, expect, it } from 'vitest'
import { isSurveyOption, surveyQuestion } from './questions'

describe('surveyQuestion', () => {
  it('dio en adopción: Sí, Tal vez, No', () => {
    expect(surveyQuestion('gave')).toEqual({
      question: 'questions.gave',
      options: [
        { value: 'yes', label: 'options.yes' },
        { value: 'maybe', label: 'options.maybe' },
        { value: 'no', label: 'options.no' },
      ],
    })
  })

  it('adoptó: Sí, Más o menos, No', () => {
    expect(surveyQuestion('adopted')).toEqual({
      question: 'questions.adopted',
      options: [
        { value: 'yes', label: 'options.yes' },
        { value: 'somewhat', label: 'options.somewhat' },
        { value: 'no', label: 'options.no' },
      ],
    })
  })

  it('no fue elegida: Sí, Tal vez, No, vuelvo a los grupos', () => {
    expect(surveyQuestion('not_chosen')).toEqual({
      question: 'questions.not_chosen',
      options: [
        { value: 'yes', label: 'options.yes' },
        { value: 'maybe', label: 'options.maybe' },
        { value: 'back_to_groups', label: 'options.back_to_groups' },
      ],
    })
  })
})

describe('isSurveyOption', () => {
  it('las del momento sí', () => {
    expect(isSurveyOption('adopted', 'somewhat')).toBe(true)
    expect(isSurveyOption('not_chosen', 'back_to_groups')).toBe(true)
  })

  it('las de otro momento o ninguna, no', () => {
    expect(isSurveyOption('adopted', 'maybe')).toBe(false)
    expect(isSurveyOption('gave', 'back_to_groups')).toBe(false)
    expect(isSurveyOption('gave', '')).toBe(false)
  })
})
