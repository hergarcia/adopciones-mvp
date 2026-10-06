'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { CountForms } from '@/components/forms/character-count'
import { Button } from '@/components/ui/button'
import { useAbandonBeacon } from '@/hooks/use-abandon-beacon'
import { useApplicationDraft } from '@/hooks/use-application-draft'
import { useApplicationSubmit } from '@/hooks/use-application-submit'
import type { ApplyAfter } from '@/lib/analytics/events'
import { MY_APPLICATIONS_PATH, applySentPath, myApplicationPath } from '@/lib/applications/paths'
import {
  lastAnswered,
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
import { SubmitFailed } from './submit-failed'

export type ApplicationFormTexts = {
  questions: Partial<Record<QuestionId, QuestionTexts>>
  /** Por clave de i18n; los de contacto traen `{fragment}` sin reemplazar. */
  errors: Record<string, string>
  counts: { left: CountForms; over: CountForms }
  submit: string
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

// Las preguntas que dependen de otra entran con un fundido; nada se mueve con movimiento reducido.
const CONDITIONAL: readonly QuestionId[] = ['rental_allows_pets', 'neuter_commitment']

function fieldErrorText(error: FieldError, texts: Record<string, string>): string {
  const text = texts[error.key] ?? error.key
  return error.values === undefined ? text : text.replace('{fragment}', error.values.fragment)
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

// El cuestionario, la única hoja cliente de la pantalla (plan §Diseño): valida con el mismo schema
// que la acción, marca cada pregunta que falta y lleva el foco a la primera (FR-024); un envío que
// no llega deja todo escrito (FR-031), y uno que frena por el nivel lleva a resolverlo con el
// borrador guardado (FR-014).
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
  const pet = { isNeutered }
  const questions = visibleQuestions(draft.answers, pet)

  function show(key: string, link: Banner['link']) {
    setBanner((current) => ({ key, link, attempt: (current?.attempt ?? 0) + 1 }))
  }

  function focusFirst(found: ApplicationErrors) {
    const first = questions.find((question) => found[question.id] !== undefined)
    if (first === undefined) return
    document
      .querySelector<HTMLElement>(`#question-${first.id} input, #question-${first.id}`)
      ?.focus()
  }

  function answer(id: QuestionId, value: string) {
    draft.change({ ...draft.answers, [id]: value })
    if (errors[id] !== undefined) setErrors((current) => ({ ...current, [id]: undefined }))
  }

  async function send() {
    const validation = validateApplication(draft.answers, pet)
    if (!validation.ok) {
      setErrors(validation.errors)
      show(formErrorKey(validation.errors), null)
      focusFirst(validation.errors)
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
    // la pregunta que ahora corresponde, y lo escrito sigue (spec §Edge Cases).
    if (result.detail?.fields !== undefined) router.refresh()
    show(result.error, bannerLink(result, texts.links))
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault()
        void send()
      }}
    >
      {intro}
      {draft.proposed ? proposedNote : null}
      {draft.restored ? (
        <RestoredDraftNote
          texts={{ restored: texts.restored, startOver: texts.startOver }}
          onStartOver={draft.startOver}
        />
      ) : null}
      <div className="flex flex-col gap-6">
        {questions.map((question) => {
          const error = errors[question.id]
          return (
            <div
              key={question.id}
              className={
                CONDITIONAL.includes(question.id)
                  ? 'animate-[fade-in_var(--dur-base)_var(--ease-out)] border-b-2 border-line pb-6'
                  : 'border-b-2 border-line pb-6'
              }
            >
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
          )
        })}
      </div>
      {contactNote}
      <div className="flex flex-col gap-3">
        {banner === null ? null : (
          <SubmitFailed
            message={texts.errors[banner.key] ?? texts.errors['applications.errors.failed'] ?? ''}
            attempt={banner.attempt}
            link={banner.link}
          />
        )}
        <Button
          type="submit"
          variant="tirita"
          size="lg"
          loading={busy}
          disabled={!draft.ready}
          className="md:w-auto md:self-start"
        >
          {texts.submit}
        </Button>
      </div>
    </form>
  )
}
