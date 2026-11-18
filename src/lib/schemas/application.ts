import { z } from 'zod'
import { ANSWER_MAX_LENGTH } from '@/lib/applications/rules'
import {
  OWN_QUESTION_ID,
  QUESTION_IDS,
  formQuestions,
  type Answers,
  type FormPet,
  type FormQuestion,
  type FormQuestionId,
} from '@/lib/applications/questionnaire'
import { addContactIssue, toFieldError, type FieldError } from './field-error'

export type ApplicationErrors = Partial<Record<FormQuestionId, FieldError>>
/** Las del sitio van en `answers`; la respuesta a la pregunta propia, aparte (research R2). */
export type ValidApplication = { answers: Answers; ownAnswer: string | null }
export type ApplicationValidation =
  { ok: true; data: ValidApplication } | { ok: false; errors: ApplicationErrors }

const CONTACT_PREFIX = 'applications.errors.contact_'

// Solo espacios cuenta como sin contestar (FR-021). El largo se cuenta en puntos de código, como
// `char_length` en la base: el campo no deja escribir más, así que solo un borrador viejo lo pasa.
const textAnswer = z
  .string()
  .transform((value) => value.trim())
  .superRefine((value, ctx) => {
    if (value === '') {
      ctx.addIssue('applications.errors.text_required')
      return
    }
    if (Array.from(value).length > ANSWER_MAX_LENGTH) {
      ctx.addIssue('applications.errors.too_long')
      return
    }
    addContactIssue(CONTACT_PREFIX, value, ctx)
  })

function rule(question: FormQuestion) {
  if (question.kind !== 'choice') return textAnswer
  const { options } = question
  return z
    .string()
    .refine((value) => options.includes(value), 'applications.errors.choice_required')
}

function textsOf(input: unknown): Answers {
  if (typeof input !== 'object' || input === null) return {}
  const answers: Answers = {}
  for (const id of QUESTION_IDS) {
    const value: unknown = Reflect.get(input, id)
    if (typeof value === 'string') answers[id] = value
  }
  return answers
}

function ownAnswerOf(input: unknown): string | undefined {
  if (typeof input !== 'object' || input === null) return undefined
  const value: unknown = Reflect.get(input, OWN_QUESTION_ID)
  return typeof value === 'string' ? value : undefined
}

// El mismo schema en el cuestionario y en la acción (docs/08). Valida solo las preguntas que
// corresponden a estas respuestas y a este animal, y devuelve solo esas: una condicional que dejó
// de corresponder no se manda (FR-022). Un error por pregunta, todas a la vez (FR-024). La respuesta
// propia se valida como las abiertas, solo si el animal tiene pregunta (historia #292).
export function validateApplication(input: unknown, pet: FormPet): ApplicationValidation {
  const answers = textsOf(input)
  const questions = formQuestions(answers, pet)
  const given = { ...answers, [OWN_QUESTION_ID]: ownAnswerOf(input) }
  const schema = z.object(
    Object.fromEntries(questions.map((question) => [question.id, rule(question)])),
  )
  const result = schema.safeParse(
    Object.fromEntries(questions.map((question) => [question.id, given[question.id] ?? ''])),
  )
  if (result.success) {
    const own: unknown = Reflect.get(result.data, OWN_QUESTION_ID)
    return {
      ok: true,
      data: { answers: textsOf(result.data), ownAnswer: typeof own === 'string' ? own : null },
    }
  }

  const errors: ApplicationErrors = {}
  for (const question of questions) {
    const issue = result.error.issues.find((candidate) => candidate.path[0] === question.id)
    if (issue !== undefined) errors[question.id] = toFieldError(issue)
  }
  return { ok: false, errors }
}

/** El aviso de arriba de la tirita: un contacto pesa más que una que falta (FR-023). */
export function formErrorKey(errors: ApplicationErrors): string {
  return Object.values(errors).some((error) => error.key.startsWith(CONTACT_PREFIX))
    ? 'applications.errors.contact'
    : 'applications.errors.missing'
}
