import { QUESTIONS, type Answers, type Question, type QuestionId } from './questionnaire'

export type QuestionWords = { label: string; options?: Record<string, string> }

export type AnswerWords = { id: QuestionId; question: string; answer: string }

/**
 * Lo contestado en palabras (FR-072): la opción con su texto y lo escrito tal cual, en el orden del
 * cuestionario y solo lo que se contestó. Sin `questions`, todas; el repaso pasa las que hoy
 * corresponden.
 */
export function answerWords(
  answers: Answers,
  words: Partial<Record<QuestionId, QuestionWords>>,
  questions: readonly Question[] = QUESTIONS,
): AnswerWords[] {
  return questions.flatMap((question) => {
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
}
