'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { CountForms } from '@/components/forms/character-count'
import { useAbandonBeacon } from '@/hooks/use-abandon-beacon'
import { useApplicationDraft } from '@/hooks/use-application-draft'
import { useApplicationSubmit } from '@/hooks/use-application-submit'
import { useQuestionnaireSteps } from '@/hooks/use-questionnaire-steps'
import type { ApplyAfter } from '@/lib/analytics/events'
import { MY_APPLICATIONS_PATH, applySentPath, myApplicationPath } from '@/lib/applications/paths'
import { answerWords } from '@/lib/applications/answer-words'
import {
  lastAnswered,
  visibleQuestions,
  type Answers,
  type QuestionId,
} from '@/lib/applications/questionnaire'
import type { SubmitResult } from '@/lib/applications/submit-outcome'
import { LISTING_PATH } from '@/lib/pets/paths'
import { formErrorKey } from '@/lib/schemas/application'
import type { FieldError } from '@/lib/schemas/field-error'
import { ProposedAnswersReview } from './proposed-answers-review'
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
  /** El repaso de las propuestas; `changeLabel` trae `{question}` sin reemplazar. */
  review: { title: string; change: string; changeLabel: string }
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
// progreso en texto (docs/10 §Layout; los pasos, en `useQuestionnaireSteps`): valida con el mismo
// schema que la acción y, si al enviar falta alguna, vuelve a la primera (FR-024); un envío que no
// llega deja todo escrito (FR-031), y uno que frena por el nivel lleva a resolverlo con el borrador
// guardado (FR-014). Con respuestas propuestas arranca en «¿Por qué?», con las demás a la vista
// para cambiarlas (FR-025).
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
  const steps = useQuestionnaireSteps(draft.answers, { isNeutered })
  const [banner, setBanner] = useState<Banner | null>(null)
  const { question, index, isLast } = steps
  const reviewing = draft.proposed && isLast
  const opening = index === 0 || reviewing

  function show(key: string, link: Banner['link']) {
    setBanner((current) => ({ key, link, attempt: (current?.attempt ?? 0) + 1 }))
  }

  function answer(id: QuestionId, value: string) {
    steps.answered(id)
    draft.change({ ...draft.answers, [id]: value })
  }

  function startOver() {
    draft.startOver()
    steps.reset()
  }

  async function send() {
    const { validation } = steps
    if (!validation.ok) {
      steps.mark(validation.errors)
      show(formErrorKey(validation.errors), null)
      return
    }
    steps.clearErrors()
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
      steps.mark(found)
    }
    show(result.error, bannerLink(result, texts.links))
  }

  const error = question === undefined ? undefined : steps.errors[question.id]
  return (
    <form
      noValidate
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault()
        if (isLast) void send()
        else steps.next()
      }}
    >
      {opening ? intro : null}
      {opening && draft.proposed ? proposedNote : null}
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
            .replace('{total}', String(steps.total))}
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
      {reviewing ? (
        <ProposedAnswersReview
          items={answerWords(
            draft.answers,
            texts.questions,
            visibleQuestions(draft.answers, { isNeutered }).filter(
              (candidate) => candidate.id !== question?.id,
            ),
          )}
          disabled={busy || !draft.ready}
          onRevise={steps.revise}
          texts={texts.review}
        />
      ) : null}
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
          onBack={steps.back}
          texts={texts}
        />
      </div>
    </form>
  )
}
