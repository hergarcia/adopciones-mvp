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

// La pregunta propia de quien publica (historia #292, research R4): un paso más del cuestionario,
// justo antes de «¿Por qué?», que no entra en `QUESTION_IDS` porque esa lista tiene paridad con la
// base y la escribe el sitio, no una persona.
export const OWN_QUESTION_ID = 'own_question'
export type FormQuestionId = QuestionId | typeof OWN_QUESTION_ID
export type OwnQuestion = { id: typeof OWN_QUESTION_ID; kind: 'own'; text: string }
export type FormQuestion = Question | OwnQuestion
/** Las del sitio y la respuesta propia, como las tiene el cuestionario en pantalla. */
export type FormAnswers = Partial<Record<FormQuestionId, string>>
/** Sin `ownQuestion`, el cuestionario de siempre. */
export type FormPet = { isNeutered: boolean; ownQuestion?: string | null }

export function isFormQuestionId(value: unknown): value is FormQuestionId {
  return value === OWN_QUESTION_ID || isQuestionId(value)
}

/** Los pasos del cuestionario de este animal: las del sitio y, con pregunta propia, la suya. */
export function formQuestions(answers: Answers, pet: FormPet): FormQuestion[] {
  const questions: FormQuestion[] = visibleQuestions(answers, pet)
  const asked = pet.ownQuestion ?? null
  if (asked === null) return questions
  const own: OwnQuestion = { id: OWN_QUESTION_ID, kind: 'own', text: asked }
  return questions.flatMap((question) =>
    question.id === 'why_this_pet' ? [own, question] : [question],
  )
}

/** Todos los pasos posibles, en el orden del cuestionario. */
export const FORM_QUESTION_IDS: readonly FormQuestionId[] = QUESTION_IDS.flatMap((id) =>
  id === 'why_this_pet' ? [OWN_QUESTION_ID, id] : [id],
)

/** La última pregunta contestada, en el orden del cuestionario: dónde se dejó (FR-090). */
export function lastAnswered(answers: FormAnswers, pet: FormPet): FormQuestionId | null {
  const answered = formQuestions(answers, pet).filter(
    (question) => (answers[question.id] ?? '').trim() !== '',
  )
  return answered.at(-1)?.id ?? null
}

/**
 * En qué paso del cuestionario cae una pregunta (docs/10 §Layout, un paso por pantalla). Si hoy no
 * corresponde —la condicional que se fue, o la que llega cuando la pantalla se vuelve a dibujar—,
 * el paso de la siguiente que sí; después de la última, la última.
 */
export function stepOf(questions: readonly FormQuestion[], id: FormQuestionId): number {
  const order = FORM_QUESTION_IDS.indexOf(id)
  const next = questions.findIndex((question) => FORM_QUESTION_IDS.indexOf(question.id) >= order)
  return next === -1 ? questions.length - 1 : next
}
