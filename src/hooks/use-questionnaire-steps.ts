'use client'

import { useEffect, useRef, useState } from 'react'
import { afterOpenModule } from '@/hooks/use-after-open'
import { useAfterOpenOrTap } from '@/hooks/use-after-open-or-tap'
import {
  FORM_QUESTION_IDS,
  formQuestions,
  stepOf,
  type FormAnswers,
  type FormPet,
  type FormQuestionId,
} from '@/lib/applications/questionnaire'
import type { ApplicationErrors, ApplicationValidation } from '@/lib/schemas/application'

// El schema del cuestionario trae zod, 23 KB: llega después de abrir, y el toque que llega antes lo
// espera trabajando, hasta 10 s (historias #304 y #336). Hasta entonces el paso de arranque es la
// primera pregunta sin contestar, que es lo mismo que dice el schema para todo lo que no viene de un
// borrador.
export const loadApplicationRules = afterOpenModule(() => import('@/lib/schemas/application'))

function firstUnanswered(answers: FormAnswers, questions: ReturnType<typeof formQuestions>) {
  return questions.find((question) => (answers[question.id] ?? '').trim() === '')
}

function focusQuestion(id: FormQuestionId) {
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
export function useQuestionnaireSteps(answers: FormAnswers, pet: FormPet) {
  const [chosen, setChosen] = useState<FormQuestionId | null>(null)
  const [errors, setErrors] = useState<ApplicationErrors>({})
  const [revising, setRevising] = useState(false)
  const moved = useRef(false)
  const questions = formQuestions(answers, pet)
  const loaded = useAfterOpenOrTap(loadApplicationRules)
  const rules = loaded.value
  const validation = rules === null ? null : rules.validateApplication(answers, pet)
  const firstMissing =
    validation === null
      ? firstUnanswered(answers, questions)
      : validation.ok
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

  function go(id: FormQuestionId) {
    moved.current = true
    setChosen(id)
  }

  function answered(id: FormQuestionId) {
    setChosen(id)
    if (errors[id] !== undefined) setErrors((current) => ({ ...current, [id]: undefined }))
  }

  // Lo que falta se marca en su pregunta y se vuelve a la primera de las marcadas.
  function mark(found: ApplicationErrors) {
    setErrors(found)
    // En el orden del cuestionario, también la que todavía no se dibujó porque llega con el refresh.
    const id = FORM_QUESTION_IDS.find((candidate) => found[candidate] !== undefined)
    if (id === undefined) return
    if (id === question?.id) focusQuestion(id)
    else go(id)
  }

  async function validate(): Promise<ApplicationValidation> {
    return validation ?? (await loadApplicationRules()).validateApplication(answers, pet)
  }

  async function next() {
    if (question === undefined) return
    const checked = await validate()
    const error = checked.ok ? undefined : checked.errors[question.id]
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

  function revise(id: FormQuestionId) {
    setRevising(true)
    go(id)
  }

  function reset() {
    setErrors({})
    setChosen(null)
    setRevising(false)
  }

  // Lo que tocó antes de que lleguen las reglas sigue solo cuando llegan; si no llegan, `onFail`.
  function whenReady(run: () => void, onFail: () => void) {
    if (rules === null) loaded.wait(run, onFail)
    else run()
  }

  return {
    validate,
    whenReady,
    isWaiting: loaded.isWaiting,
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
    goTo: go,
  }
}
