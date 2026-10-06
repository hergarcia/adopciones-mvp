// Covers: FR-020, FR-022, US1-AS4, US1-AS5
import { describe, expect, it } from 'vitest'
import { QUESTIONS, isQuestionId, lastAnswered, stepOf, visibleQuestions } from './questionnaire'

const ids = (questions: { id: string }[]) => questions.map((question) => question.id)

describe('QUESTIONS', () => {
  it('las doce de FR-020, en su orden, cada una con su tipo y sus opciones', () => {
    expect(QUESTIONS).toEqual([
      {
        id: 'housing_type',
        kind: 'choice',
        options: ['house', 'apartment', 'other'],
        orientation: 'row',
      },
      {
        id: 'housing_tenure',
        kind: 'choice',
        options: ['owned', 'rented', 'other'],
        orientation: 'row',
      },
      {
        id: 'rental_allows_pets',
        kind: 'choice',
        options: ['yes', 'no', 'unsure'],
        orientation: 'row',
      },
      {
        id: 'outdoor_space',
        kind: 'choice',
        options: ['yard', 'netted_balcony', 'open_balcony', 'none'],
        orientation: 'column',
      },
      { id: 'household', kind: 'text' },
      { id: 'other_pets', kind: 'text' },
      {
        id: 'hours_alone',
        kind: 'choice',
        options: ['under_4', '4_to_8', 'over_8'],
        orientation: 'row',
      },
      { id: 'moving_plan', kind: 'text' },
      { id: 'experience', kind: 'text' },
      { id: 'neuter_commitment', kind: 'choice', options: ['yes', 'no'], orientation: 'row' },
      { id: 'vet_budget', kind: 'choice', options: ['yes', 'tight', 'no'], orientation: 'row' },
      { id: 'why_this_pet', kind: 'text' },
    ])
  })
})

describe('visibleQuestions', () => {
  const always = [
    'housing_type',
    'housing_tenure',
    'outdoor_space',
    'household',
    'other_pets',
    'hours_alone',
    'moving_plan',
    'experience',
    'vet_budget',
    'why_this_pet',
  ]

  it('animal castrado y vivienda sin elegir: sin las dos condicionales', () => {
    expect(ids(visibleQuestions({}, { isNeutered: true }))).toEqual(always)
  })

  it('alquilada suma el permiso del dueño justo después', () => {
    expect(ids(visibleQuestions({ housing_tenure: 'rented' }, { isNeutered: true }))).toEqual([
      'housing_type',
      'housing_tenure',
      'rental_allows_pets',
      ...always.slice(2),
    ])
  })

  it('propia u otra situación no lo suman', () => {
    for (const tenure of ['owned', 'other']) {
      expect(ids(visibleQuestions({ housing_tenure: tenure }, { isNeutered: true }))).toEqual(
        always,
      )
    }
  })

  it('un animal sin castrar suma el compromiso antes de la plata', () => {
    expect(ids(visibleQuestions({}, { isNeutered: false }))).toEqual([
      ...always.slice(0, 8),
      'neuter_commitment',
      'vet_budget',
      'why_this_pet',
    ])
  })
})

describe('isQuestionId', () => {
  it('solo los ids del cuestionario', () => {
    expect(isQuestionId('why_this_pet')).toBe(true)
    expect(isQuestionId('phone')).toBe(false)
    expect(isQuestionId(undefined)).toBe(false)
  })
})

describe('lastAnswered', () => {
  it('la más avanzada en el orden del cuestionario, no la última tocada', () => {
    expect(
      lastAnswered(
        { hours_alone: 'over_8', housing_type: 'house', household: 'Yo' },
        { isNeutered: true },
      ),
    ).toBe('hours_alone')
  })

  it('una respuesta de solo espacios no cuenta', () => {
    expect(lastAnswered({ housing_type: 'house', household: '   ' }, { isNeutered: true })).toBe(
      'housing_type',
    )
  })

  it('una condicional que dejó de corresponder no cuenta', () => {
    expect(
      lastAnswered(
        { housing_tenure: 'owned', rental_allows_pets: 'yes', neuter_commitment: 'yes' },
        { isNeutered: true },
      ),
    ).toBe('housing_tenure')
    expect(lastAnswered({ neuter_commitment: 'yes' }, { isNeutered: false })).toBe(
      'neuter_commitment',
    )
  })

  it('sin respuestas, ninguna', () => {
    expect(lastAnswered({}, { isNeutered: true })).toBeNull()
  })
})

describe('stepOf', () => {
  const neutered = visibleQuestions({ housing_tenure: 'owned' }, { isNeutered: true })

  it('la pregunta que está, en su lugar', () => {
    expect(stepOf(neutered, 'housing_type')).toBe(0)
    expect(stepOf(neutered, 'outdoor_space')).toBe(2)
    expect(stepOf(neutered, 'why_this_pet')).toBe(neutered.length - 1)
  })

  it('una condicional que no está cae en la siguiente que sí', () => {
    expect(stepOf(neutered, 'rental_allows_pets')).toBe(2)
    expect(neutered[2]?.id).toBe('outdoor_space')
    expect(stepOf(neutered, 'neuter_commitment')).toBe(neutered.length - 2)
    expect(neutered.at(-2)?.id).toBe('vet_budget')
  })

  it('después de la última, la última', () => {
    const short = neutered.slice(0, 3)
    expect(stepOf(short, 'why_this_pet')).toBe(2)
  })
})
