// El cuestionario estándar, en el orden de FR-020 (research R4). La única lista: la usan el
// formulario, el schema, Mi solicitud, la medición y, por paridad, la base. Los textos viven en
// `messages/es.json` bajo `applications.questions.<id>`: cambiar uno no toca lo enviado (docs/06).
export const QUESTION_IDS = [
  'housing_type',
  'housing_tenure',
  'rental_allows_pets',
  'outdoor_space',
  'household',
  'other_pets',
  'hours_alone',
  'moving_plan',
  'experience',
  'neuter_commitment',
  'vet_budget',
  'why_this_pet',
] as const

export type QuestionId = (typeof QUESTION_IDS)[number]

export type ChoiceQuestion = {
  id: QuestionId
  kind: 'choice'
  options: readonly string[]
  orientation: 'row' | 'column'
}
export type TextQuestion = { id: QuestionId; kind: 'text' }
export type Question = ChoiceQuestion | TextQuestion

const choice = (
  id: QuestionId,
  options: readonly string[],
  orientation: 'row' | 'column' = 'row',
): ChoiceQuestion => ({ id, kind: 'choice', options, orientation })
const text = (id: QuestionId): TextQuestion => ({ id, kind: 'text' })

export const QUESTIONS: readonly Question[] = [
  choice('housing_type', ['house', 'apartment', 'other']),
  choice('housing_tenure', ['owned', 'rented', 'other']),
  choice('rental_allows_pets', ['yes', 'no', 'unsure']),
  choice('outdoor_space', ['yard', 'netted_balcony', 'open_balcony', 'none'], 'column'),
  text('household'),
  text('other_pets'),
  choice('hours_alone', ['under_4', '4_to_8', 'over_8']),
  text('moving_plan'),
  text('experience'),
  choice('neuter_commitment', ['yes', 'no']),
  choice('vet_budget', ['yes', 'tight', 'no']),
  text('why_this_pet'),
]

export type Answers = Partial<Record<QuestionId, string>>

// Las dos que dependen de otra cosa (FR-022): el permiso del dueño solo con vivienda alquilada, y
// el compromiso de castración solo con un animal sin castrar.
function applies(id: QuestionId, answers: Answers, pet: { isNeutered: boolean }): boolean {
  if (id === 'rental_allows_pets') return answers.housing_tenure === 'rented'
  if (id === 'neuter_commitment') return !pet.isNeutered
  return true
}

export function visibleQuestions(answers: Answers, pet: { isNeutered: boolean }): Question[] {
  return QUESTIONS.filter((question) => applies(question.id, answers, pet))
}

export function isQuestionId(value: unknown): value is QuestionId {
  return QUESTION_IDS.some((id) => id === value)
}

/** La última pregunta contestada, en el orden del cuestionario: dónde se dejó (FR-090). */
export function lastAnswered(answers: Answers, pet: { isNeutered: boolean }): QuestionId | null {
  const answered = visibleQuestions(answers, pet).filter(
    (question) => (answers[question.id] ?? '').trim() !== '',
  )
  return answered.at(-1)?.id ?? null
}
