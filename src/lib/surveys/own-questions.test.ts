// Covers: US4-AS1, US4-AS2 (el conteo, el tramo que se ve y «Ver más» solo si quedan)
import { describe, expect, it } from 'vitest'
import { ownQuestionView } from './own-questions'

const QUESTIONS = [
  '¿Tenés patio cerrado?',
  '¿Vivís en casa o en apartamento?',
  'Toma una pastilla.',
]

describe('ownQuestionView', () => {
  it('pasa las cuentas para el texto tal como llegan', () => {
    const view = ownQuestionView({ published: 8, withQuestion: 3, questions: QUESTIONS }, 50)
    expect(view.published).toBe(8)
    expect(view.withQuestion).toBe(3)
  })

  it('con menos preguntas que el tramo, las muestra todas en orden y sin «Ver más»', () => {
    expect(ownQuestionView({ published: 8, withQuestion: 3, questions: QUESTIONS }, 50)).toEqual({
      published: 8,
      withQuestion: 3,
      items: [
        { id: 'pregunta-1', question: '¿Tenés patio cerrado?' },
        { id: 'pregunta-2', question: '¿Vivís en casa o en apartamento?' },
        { id: 'pregunta-3', question: 'Toma una pastilla.' },
      ],
      hasMore: false,
    })
  })

  it('con tantas como el tramo, las muestra todas sin «Ver más»', () => {
    const view = ownQuestionView({ published: 3, withQuestion: 3, questions: QUESTIONS }, 3)
    expect(view.items).toHaveLength(3)
    expect(view.hasMore).toBe(false)
  })

  it('con más que el tramo, muestra el tramo y ofrece «Ver más»', () => {
    const view = ownQuestionView({ published: 9, withQuestion: 3, questions: QUESTIONS }, 2)
    expect(view.items).toEqual([
      { id: 'pregunta-1', question: '¿Tenés patio cerrado?' },
      { id: 'pregunta-2', question: '¿Vivís en casa o en apartamento?' },
    ])
    expect(view.hasMore).toBe(true)
  })

  it('sin preguntas, ninguna y sin «Ver más»', () => {
    expect(ownQuestionView({ published: 5, withQuestion: 0, questions: [] }, 50)).toEqual({
      published: 5,
      withQuestion: 0,
      items: [],
      hasMore: false,
    })
  })
})
