'use client'

import { useEffect, useRef, useState } from 'react'
import {
  QUESTION_IDS,
  stepOf,
  visibleQuestions,
  type Answers,
  type QuestionId,
} from '@/lib/applications/questionnaire'
import { validateApplication, type ApplicationErrors } from '@/lib/schemas/application'

function focusQuestion(id: QuestionId) {
  const field = document.getElementById(`question-${id}`)
  if (field === null) return
  const target =
    field instanceof HTMLTextAreaElement
      ? field
      : (field.querySelector<HTMLElement>('input:checked') ??
        field.querySelector<HTMLElement>('input'))
  target?.focus()
}

// Un paso por pantalla (docs/10 §Layout): en qué pregunta está, qué le falta a cada una y adónde
// lleva «Siguiente». Arranca en la primera que falta —con un borrador, donde se dejó; con
// respuestas propuestas, en «¿Por qué?», la única vacía—. Una respuesta cambiada desde el repaso de
// las propuestas vuelve a lo que falta y no recorre las demás (FR-025).
export function useQuestionnaireSteps(answers: Answers, pet: { isNeutered: boolean }) {
  const [chosen, setChosen] = useState<QuestionId | null>(null)
  const [errors, setErrors] = useState<ApplicationErrors>({})
  const [revising, setRevising] = useState(false)
  const moved = useRef(false)
  const questions = visibleQuestions(answers, pet)
  const validation = validateApplication(answers, pet)
  const firstMissing = validation.ok
    ? undefined
    : questions.find((question) => validation.errors[question.id] !== undefined)
  const start = firstMissing ?? questions.at(-1)
  const index = stepOf(questions, chosen ?? start?.id ?? 'housing_type')
  const question = questions[index]
  const isLast = index === questions.length - 1

  // El foco va a la pregunta nueva después de dibujarla, no al montar.
  useEffect(() => {
    if (!moved.current || question === undefined) return
    moved.current = false
    focusQuestion(question.id)
  }, [question])

  function go(id: QuestionId) {
    moved.current = true
    setChosen(id)
  }

  function answered(id: QuestionId) {
    setChosen(id)
    if (errors[id] !== undefined) setErrors((current) => ({ ...current, [id]: undefined }))
  }

  // Lo que falta se marca en su pregunta y se vuelve a la primera de las marcadas.
  function mark(found: ApplicationErrors) {
    setErrors(found)
    // En el orden del cuestionario, también la que todavía no se dibujó porque llega con el refresh.
    const id = QUESTION_IDS.find((candidate) => found[candidate] !== undefined)
    if (id === undefined) return
    if (id === question?.id) focusQuestion(id)
    else go(id)
  }

  function next() {
    if (question === undefined) return
    const error = validation.ok ? undefined : validation.errors[question.id]
    if (error !== undefined) {
      setErrors((current) => ({ ...current, [question.id]: error }))
      focusQuestion(question.id)
      return
    }
    const following = revising ? start : questions[index + 1]
    if (following !== undefined) go(following.id)
  }

  function back() {
    const previous = questions[index - 1]
    if (previous !== undefined) go(previous.id)
  }

  function revise(id: QuestionId) {
    setRevising(true)
    go(id)
  }

  function reset() {
    setErrors({})
    setChosen(null)
    setRevising(false)
  }

  return {
    validation,
    errors,
    clearErrors: () => setErrors({}),
    index,
    total: questions.length,
    question,
    isLast,
    answered,
    mark,
    next,
    back,
    revise,
    reset,
  }
}
