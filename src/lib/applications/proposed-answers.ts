import { visibleQuestions, type Answers } from './questionnaire'

// Desde la segunda solicitud, lo contestado la última vez (FR-025): lo de la casa, la familia y la
// plata no cambia de un animal a otro; «por qué este animal» sí, y arranca vacía. Una pregunta que
// no corresponde al animal nuevo no se propone, y una opción que ya no existe tampoco.
export function proposedAnswers(
  last: Answers | null,
  pet: { isNeutered: boolean },
): Answers | null {
  if (last === null) return null
  const proposed: Answers = {}
  for (const question of visibleQuestions(last, pet)) {
    const value = last[question.id]
    if (question.id === 'why_this_pet' || value === undefined) continue
    if (question.kind === 'choice' && !question.options.includes(value)) continue
    proposed[question.id] = value
  }
  return Object.keys(proposed).length === 0 ? null : proposed
}

export type StartingAnswers = { answers: Answers; from: 'draft' | 'proposed' | 'blank' }

/** Con qué arranca el cuestionario: el borrador de ese animal gana sobre las propuestas (FR-042). */
export function startingAnswers(draft: Answers | null, proposed: Answers | null): StartingAnswers {
  if (draft !== null) return { answers: draft, from: 'draft' }
  if (proposed !== null) return { answers: proposed, from: 'proposed' }
  return { answers: {}, from: 'blank' }
}

export type ProposedNote = 'own' | 'usual' | null

/**
 * La nota de las propuestas (#296): con pregunta propia, quien tiene propuestas entra directo en
 * ella, y ahí la nota dice qué le falta; si no, va al abrir y en el repaso, como siempre.
 */
export function proposedNoteKind(input: {
  proposed: boolean
  onOwnQuestion: boolean
  opening: boolean
}): ProposedNote {
  if (!input.proposed) return null
  if (input.onOwnQuestion) return 'own'
  return input.opening ? 'usual' : null
}
