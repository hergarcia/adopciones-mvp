import {
  OWN_QUESTION_ID,
  QUESTIONS,
  type Answers,
  type FormQuestionId,
  type Question,
  type QuestionId,
} from './questionnaire'

export type QuestionWords = { label: string; options?: Record<string, string> }

export type AnswerWords = {
  id: FormQuestionId
  question: string
  answer: string
  /** La respuesta es un aviso y no algo que la persona escribió: «Llegó antes de tu pregunta». */
  muted?: true
}

/** La pregunta propia tal como se contestó y la respuesta (historia #292). */
export type OwnAnswerWords = { question: string; answer: string }

function ownRowOf(own: OwnAnswerWords | null, before: OwnAnswerWords | null): AnswerWords | null {
  if (own !== null) return { id: OWN_QUESTION_ID, ...own }
  if (before !== null) return { id: OWN_QUESTION_ID, ...before, muted: true }
  return null
}

/**
 * Lo contestado en palabras (FR-072): la opción con su texto y lo escrito tal cual, en el orden del
 * cuestionario y solo lo que se contestó. Sin `questions`, todas; el repaso pasa las que hoy
 * corresponden. La respuesta propia va justo antes de «¿Por qué?», con la pregunta que se contestó
 * como etiqueta, aunque hoy sea otra (research R6). `before` es el renglón de quien publicó cuando
 * hoy pregunta y esta solicitud no la contestó; va en el mismo lugar y solo si no hay respuesta.
 */
export function answerWords(
  answers: Answers,
  words: Partial<Record<QuestionId, QuestionWords>>,
  questions: readonly Question[] = QUESTIONS,
  own: OwnAnswerWords | null = null,
  before: OwnAnswerWords | null = null,
): AnswerWords[] {
  const rows: AnswerWords[] = questions.flatMap((question) => {
    const answer = answers[question.id]
    if (answer === undefined) return []
    const texts = words[question.id]
    return [
      {
        id: question.id,
        question: texts?.label ?? question.id,
        answer: texts?.options?.[answer] ?? answer,
      },
    ]
  })
  const ownRow = ownRowOf(own, before)
  if (ownRow === null) return rows
  // «¿Por qué?» es la última: sin ella en la lista, la propia cierra.
  const at = rows.findIndex((row) => row.id === 'why_this_pet')
  return at === -1 ? [...rows, ownRow] : [...rows.slice(0, at), ownRow, ...rows.slice(at)]
}
