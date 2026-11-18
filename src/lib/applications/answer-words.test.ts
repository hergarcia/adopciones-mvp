// Covers: FR-025, FR-072
import { describe, expect, it } from 'vitest'
import { answerWords } from './answer-words'
import { QUESTIONS } from './questionnaire'

const WORDS = {
  housing_type: { label: '¿Dónde vivís?', options: { apartment: 'Apartamento' } },
  household: { label: '¿Con quién vivís?' },
}

describe('answerWords', () => {
  it('pone la opción en palabras y deja lo escrito tal cual, en el orden del cuestionario', () => {
    expect(
      answerWords({ household: 'Mi pareja y yo.', housing_type: 'apartment' }, WORDS),
    ).toStrictEqual([
      { id: 'housing_type', question: '¿Dónde vivís?', answer: 'Apartamento' },
      { id: 'household', question: '¿Con quién vivís?', answer: 'Mi pareja y yo.' },
    ])
  })

  it('deja afuera lo que no se contestó', () => {
    expect(answerWords({ household: 'Sola.' }, WORDS)).toStrictEqual([
      { id: 'household', question: '¿Con quién vivís?', answer: 'Sola.' },
    ])
  })

  it('sin el texto de la pregunta o de la opción, muestra la clave', () => {
    expect(answerWords({ hours_alone: 'under_4', housing_type: 'house' }, WORDS)).toStrictEqual([
      { id: 'housing_type', question: '¿Dónde vivís?', answer: 'house' },
      { id: 'hours_alone', question: 'hours_alone', answer: 'under_4' },
    ])
  })

  it('con las preguntas que corresponden, solo esas', () => {
    const answers = { household: 'Sola.', housing_type: 'apartment' }
    const only = QUESTIONS.filter((question) => question.id === 'household')
    expect(answerWords(answers, WORDS, only)).toStrictEqual([
      { id: 'household', question: '¿Con quién vivís?', answer: 'Sola.' },
    ])
  })
})

// Covers: #292 US1-AS2, FR-017 (la pregunta contestada al lado de su respuesta)
describe('answerWords con la pregunta propia', () => {
  const OWN = { question: '¿Podés darle la pastilla?', answer: 'Sí, a las 8.' }
  const WHY = { why_this_pet: { label: '¿Por qué Kira?' } }

  it('va justo antes de «¿Por qué?», con la pregunta que se contestó como etiqueta', () => {
    expect(
      answerWords(
        { household: 'Sola.', why_this_pet: 'Porque sí.' },
        { ...WORDS, ...WHY },
        QUESTIONS,
        OWN,
      ),
    ).toStrictEqual([
      { id: 'household', question: '¿Con quién vivís?', answer: 'Sola.' },
      { id: 'own_question', question: '¿Podés darle la pastilla?', answer: 'Sí, a las 8.' },
      { id: 'why_this_pet', question: '¿Por qué Kira?', answer: 'Porque sí.' },
    ])
  })

  it('sin «¿Por qué?» en la lista, cierra', () => {
    expect(answerWords({ household: 'Sola.' }, WORDS, QUESTIONS, OWN)).toStrictEqual([
      { id: 'household', question: '¿Con quién vivís?', answer: 'Sola.' },
      { id: 'own_question', question: '¿Podés darle la pastilla?', answer: 'Sí, a las 8.' },
    ])
  })

  it('sin pregunta propia, la lista de siempre', () => {
    expect(answerWords({ why_this_pet: 'Porque sí.' }, WHY, QUESTIONS, null)).toStrictEqual([
      { id: 'why_this_pet', question: '¿Por qué Kira?', answer: 'Porque sí.' },
    ])
  })
})
