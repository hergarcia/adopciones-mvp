'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { CountForms } from '@/components/forms/character-count'
import { useAbandonBeacon } from '@/hooks/use-abandon-beacon'
import { useApplicationDraft } from '@/hooks/use-application-draft'
import { useApplicationSubmit } from '@/hooks/use-application-submit'
import type { ApplyAfter } from '@/lib/analytics/events'
import { MY_APPLICATIONS_PATH, applySentPath, myApplicationPath } from '@/lib/applications/paths'
import {
  QUESTION_IDS,
  lastAnswered,
  stepOf,
  visibleQuestions,
  type Answers,
  type QuestionId,
} from '@/lib/applications/questionnaire'
import type { SubmitResult } from '@/lib/applications/submit-outcome'
import { LISTING_PATH } from '@/lib/pets/paths'
import {
  formErrorKey,
  validateApplication,
  type ApplicationErrors,
} from '@/lib/schemas/application'
import type { FieldError } from '@/lib/schemas/field-error'
import { QuestionField, type QuestionTexts } from './question-field'
import { RestoredDraftNote } from './restored-draft-note'
import { StepActions } from './step-actions'
import { SubmitFailed } from './submit-failed'

export type ApplicationFormTexts = {
  questions: Partial<Record<QuestionId, QuestionTexts>>
  /** Por clave de i18n; los de contacto traen `{fragment}` sin reemplazar. */
  errors: Record<string, string>
  counts: { left: CountForms; over: CountForms }
  submit: string
  /** «{step} de {total}», sin reemplazar. */
  progress: string
  next: string
  back: string
  restored: string
  startOver: string
  links: { toMine: string; seeMine: string; toListing: string }
}

type Props = {
  code: string
  accountId: string
  isNeutered: boolean
  /** Lo que arranca escrito sin borrador: las respuestas propuestas, o null (FR-025). */
  proposed: Answers | null
  after: ApplyAfter | null
  /** La nota de en proceso arriba, la de las propuestas mientras se usan y la del contacto. */
  intro: React.ReactNode
  proposedNote: React.ReactNode
  contactNote: React.ReactNode
  texts: ApplicationFormTexts
}

type Banner = { key: string; link: { href: string; label: string } | null; attempt: number }

function fieldErrorText(error: FieldError, texts: Record<string, string>): string {
  const text = texts[error.key] ?? error.key
  return error.values === undefined ? text : text.replace('{fragment}', error.values.fragment)
}

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

function bannerLink(result: SubmitResult, links: Props['texts']['links']): Banner['link'] {
  if (result.ok) return null
  if (result.error === 'applications.errors.has_active' && result.detail?.id !== undefined) {
    return { href: myApplicationPath(result.detail.id), label: links.seeMine }
  }
  if (result.error === 'applications.errors.limit') {
    return { href: MY_APPLICATIONS_PATH, label: links.toMine }
  }
  if (
    result.error === 'applications.errors.not_receiving' ||
    result.error === 'applications.errors.unavailable'
  ) {
    return { href: LISTING_PATH, label: links.toListing }
  }
  return null
}

// El cuestionario, la única hoja cliente de la pantalla (plan §Diseño), un paso por pantalla con el
// progreso en texto (docs/10 §Layout): valida con el mismo schema que la acción, no deja pasar de
// una pregunta sin contestarla y, si al enviar falta alguna, vuelve a la primera (FR-024); un envío
// que no llega deja todo escrito (FR-031), y uno que frena por el nivel lleva a resolverlo con el
// borrador guardado (FR-014). Arranca en la primera que falta: con un borrador, donde se dejó; con
// respuestas propuestas, en la primera, para revisarlas.
export function ApplicationForm({
  code,
  accountId,
  isNeutered,
  proposed,
  after,
  intro,
  proposedNote,
  contactNote,
  texts,
}: Props) {
  const router = useRouter()
  const draft = useApplicationDraft({ code, accountId, proposed })
  const { busy, submit } = useApplicationSubmit()
  const beacon = useAbandonBeacon(() => lastAnswered(draft.answers, { isNeutered }))
  const [errors, setErrors] = useState<ApplicationErrors>({})
  const [banner, setBanner] = useState<Banner | null>(null)
  const [chosen, setChosen] = useState<QuestionId | null>(null)
  const moved = useRef(false)
  const pet = { isNeutered }
  const questions = visibleQuestions(draft.answers, pet)
  const validation = validateApplication(draft.answers, pet)
  const firstMissing = validation.ok
    ? undefined
    : questions.find((question) => validation.errors[question.id] !== undefined)
  const start = draft.proposed ? questions[0] : (firstMissing ?? questions.at(-1))
  const index = stepOf(questions, chosen ?? start?.id ?? 'housing_type')
  const question = questions[index]
  const isLast = index === questions.length - 1

  // El foco va a la pregunta nueva después de dibujarla, no al montar.
  useEffect(() => {
    if (!moved.current || question === undefined) return
    moved.current = false
    focusQuestion(question.id)
  }, [question])

  function show(key: string, link: Banner['link']) {
    setBanner((current) => ({ key, link, attempt: (current?.attempt ?? 0) + 1 }))
  }

  function go(id: QuestionId) {
    moved.current = true
    setChosen(id)
  }

  function answer(id: QuestionId, value: string) {
    setChosen(id)
    draft.change({ ...draft.answers, [id]: value })
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
    const following = questions[index + 1]
    if (following !== undefined) go(following.id)
  }

  function startOver() {
    draft.startOver()
    setErrors({})
    setChosen(null)
  }

  async function send() {
    if (!validation.ok) {
      mark(validation.errors)
      show(formErrorKey(validation.errors), null)
      return
    }
    setErrors({})
    const result = await submit({
      code,
      attemptId: draft.attemptId(),
      startedAt: draft.startedAt(),
      proposedUsed: proposed !== null,
      after,
      answers: validation.data,
    })
    if (result === null) return
    if (result.ok) {
      beacon.done()
      draft.finish()
      router.push(applySentPath(code, result.data.id))
      return
    }
    const redirect = result.detail?.redirect
    if (redirect !== undefined) {
      beacon.done()
      router.push(redirect)
      return
    }
    // La base miró el animal de ahora: si cambió de castrado, la pantalla se vuelve a dibujar con
    // la pregunta que ahora corresponde, marcada como una que falta, y lo escrito sigue (spec
    // §Edge Cases).
    const found = result.detail?.errors
    if (found !== undefined) {
      router.refresh()
      mark(found)
    }
    show(result.error, bannerLink(result, texts.links))
  }

  const error = question === undefined ? undefined : errors[question.id]
  return (
    <form
      noValidate
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault()
        if (isLast) void send()
        else next()
      }}
    >
      {index === 0 ? intro : null}
      {index === 0 && draft.proposed ? proposedNote : null}
      {draft.restored ? (
        <RestoredDraftNote
          texts={{ restored: texts.restored, startOver: texts.startOver }}
          onStartOver={startOver}
        />
      ) : null}
      <div className="flex flex-col gap-4">
        <p aria-live="polite" className="text-sm text-ink-muted tabular-nums">
          {texts.progress
            .replace('{step}', String(index + 1))
            .replace('{total}', String(questions.length))}
        </p>
        {question === undefined ? null : (
          <div key={question.id} className="animate-[fade-in_var(--dur-base)_var(--ease-out)]">
            <QuestionField
              id={`question-${question.id}`}
              question={question}
              value={draft.answers[question.id] ?? ''}
              onChange={(value) => answer(question.id, value)}
              texts={texts.questions[question.id] ?? { label: question.id }}
              error={error === undefined ? undefined : fieldErrorText(error, texts.errors)}
              disabled={busy || !draft.ready}
              counts={texts.counts}
            />
          </div>
        )}
      </div>
      {isLast ? contactNote : null}
      <div className="flex flex-col gap-3">
        {banner === null ? null : (
          <SubmitFailed
            message={texts.errors[banner.key] ?? texts.errors['applications.errors.failed'] ?? ''}
            attempt={banner.attempt}
            link={banner.link}
          />
        )}
        <StepActions
          isLast={isLast}
          canGoBack={index > 0}
          busy={busy}
          disabled={!draft.ready}
          onBack={() => {
            const previous = questions[index - 1]
            if (previous !== undefined) go(previous.id)
          }}
          texts={texts}
        />
      </div>
    </form>
  )
}
