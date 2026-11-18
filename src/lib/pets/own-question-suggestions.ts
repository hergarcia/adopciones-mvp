/** Una publicación propia con pregunta: un animal suelto o una camada. */
export type OwnQuestionSource = {
  id: string
  name: string
  question: string
  publishedAt: Date
}

export type OwnQuestionSuggestion = { question: string; name: string }

export const OWN_QUESTION_SUGGESTIONS_MAX = 3

// Dos preguntas que se leen igual son la misma aunque cambien mayúsculas o espacios.
function sameKey(question: string): string {
  // Stryker disable next-line MethodExpression: pasar todo a mayúsculas también iguala las dos.
  return question.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
}

/**
 * Las preguntas que se le ofrecen a quien publica (historia #300): hasta 3, distintas, de la
 * publicación más nueva a la más vieja, nunca la de la publicación que se edita (`exceptId`). Una
 * repetida queda con el nombre de la publicación más nueva que la usó.
 */
export function ownQuestionSuggestions(
  sources: readonly OwnQuestionSource[],
  exceptId: string | null,
): OwnQuestionSuggestion[] {
  const newest = sources.toSorted((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
  const seen = new Set<string>()
  const suggestions: OwnQuestionSuggestion[] = []
  for (const source of newest) {
    if (suggestions.length === OWN_QUESTION_SUGGESTIONS_MAX) break
    const key = sameKey(source.question)
    if (source.id === exceptId || seen.has(key)) continue
    seen.add(key)
    suggestions.push({ question: source.question, name: source.name })
  }
  return suggestions
}

/** Se ofrecen solo con el campo vacío: lo que la persona escribe nunca compite con una propuesta. */
export function shownOwnQuestionSuggestions(
  value: string,
  suggestions: readonly OwnQuestionSuggestion[],
): readonly OwnQuestionSuggestion[] {
  return value.trim() === '' ? suggestions : []
}
