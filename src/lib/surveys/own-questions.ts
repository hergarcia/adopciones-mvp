/** Lo que devuelve `admin_own_question_summary`: lo publicado hoy y sus preguntas, de la A a la Z. */
export type OwnQuestionSummary = { published: number; withQuestion: number; questions: string[] }

export type OwnQuestionItem = { id: string; question: string }

/** «Lo que preguntan quienes publican»: las cuentas y el tramo de preguntas que se ve. */
export type OwnQuestionView = {
  published: number
  withQuestion: number
  items: OwnQuestionItem[]
  hasMore: boolean
}

// El id va por posición en la lista alfabética, nunca el del animal: sirve de ancla para «Ver más»
// y no une la pregunta con nadie (research R7).
export function ownQuestionView(summary: OwnQuestionSummary, shown: number): OwnQuestionView {
  return {
    published: summary.published,
    withQuestion: summary.withQuestion,
    items: summary.questions
      .slice(0, shown)
      .map((question, index) => ({ id: `pregunta-${index + 1}`, question })),
    hasMore: summary.questions.length > shown,
  }
}
