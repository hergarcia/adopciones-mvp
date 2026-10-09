'use client'

import { useState } from 'react'
import type { ActionResult } from '@/actions/result'
import type { CountForms } from '@/components/forms/character-count'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { SupportReply } from '@/components/support/support-whatsapp-link'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { paperStrip } from '@/components/ui/paper-strip'
import { RadioGroup } from '@/components/ui/radio-group'
import { cn } from '@/lib/cn'
import { fillFragment } from '@/lib/forms/fill-fragment'
import { surveyAnswerSchema } from '@/lib/schemas/survey'
import { toFieldError } from '@/lib/schemas/field-error'
import { SURVEY_COUNTER_FROM, SURVEY_TEXT_MAX, type SurveyMoment } from '@/lib/surveys/types'

export type SurveyCardTexts = {
  question: string
  options: { value: string; label: string }[]
  openQuestion: string
  anonymous: string
  send: string
  dismiss: string
  thanks: string
  /** Lo que se dice cuando el envío no llegó: lo elegido y lo escrito siguen ahí. */
  unsent: string
  counts: { left: CountForms; over: CountForms }
  /** Por clave de `surveys.errors`; el de contacto, crudo con `{fragment}`. */
  errors: Record<string, string>
  /** «Si querés que te respondan, <link>escribinos por WhatsApp</link>.», crudo. */
  supportReply: string
}

type Action = (input: unknown) => Promise<ActionResult<null>>

type Props = {
  offerId: string
  moment: SurveyMoment
  texts: SurveyCardTexts
  answer: Action
  dismiss: Action
  /** El WhatsApp de soporte, o null sin número: entonces el error de contacto no lo ofrece. */
  supportUrl: string | null
}

type Errors = { option?: string; body?: string; form?: string; contact?: boolean }

const FAILED = 'surveys.errors.failed'
const CONTACT = 'surveys.errors.contact'

// La encuesta pegada al pie del desenlace (plan §Diseño La encuesta): la pregunta del momento, sus
// tres opciones y la respuesta libre. Nunca un modal ni lo primero de la pantalla: «Enviar» es
// `secondary`. Lo elegido y lo escrito quedan ante cualquier error. Enviada, el agradecimiento
// ocupa su lugar; cerrada, desaparece.
export function SurveyCard({ offerId, moment, texts, answer, dismiss, supportUrl }: Props) {
  const [option, setOption] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState<'answer' | 'dismiss' | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [unsent, setUnsent] = useState(0)
  const [done, setDone] = useState<'answered' | 'dismissed' | null>(null)

  function message(key: string, fragment?: string): string {
    return fillFragment(texts.errors[key] ?? texts.errors[FAILED] ?? '', fragment)
  }

  async function run(kind: 'answer' | 'dismiss', input: Record<string, string>) {
    setErrors({})
    setBusy(kind)
    const result = await (kind === 'answer' ? answer : dismiss)(input).catch(() => null)
    setBusy(null)
    if (result === null) {
      setUnsent((attempt) => attempt + 1)
      return
    }
    setUnsent(0)
    if (result.ok) setDone(kind === 'answer' ? 'answered' : 'dismissed')
    else setErrors({ form: message(result.error), contact: result.error === CONTACT })
  }

  function send() {
    const input = { offerId, moment, option, body }
    const issue = surveyAnswerSchema.safeParse(input).error?.issues[0]
    if (issue === undefined) {
      void run('answer', input)
      return
    }
    const { key, values } = toFieldError(issue)
    const field = issue.path[0] === 'body' ? 'body' : issue.path[0] === 'option' ? 'option' : 'form'
    setErrors({ [field]: message(key, values?.fragment), contact: key === CONTACT })
  }

  if (done === 'dismissed') return null
  if (done === 'answered') {
    return (
      <output
        className={cn(
          paperStrip({ band: 'success' }),
          'animate-[fade-in_var(--dur-base)_var(--ease-out)]',
        )}
      >
        {texts.thanks}
      </output>
    )
  }

  const disabled = busy !== null
  return (
    <section
      aria-label={texts.question}
      className="flex flex-col gap-4 border-2 border-ink p-4 md:p-6"
    >
      <RadioGroup
        legend={texts.question}
        legendSize="lg"
        name={`encuesta-${offerId}`}
        options={texts.options}
        value={option}
        onChange={setOption}
        error={errors.option}
        disabled={disabled}
      />
      <CountedTextarea
        value={body}
        onChange={setBody}
        label={texts.openQuestion}
        error={errors.body}
        disabled={disabled}
        max={SURVEY_TEXT_MAX}
        from={SURVEY_COUNTER_FROM}
        counts={texts.counts}
        rows={3}
      />
      {supportUrl !== null && errors.contact === true ? (
        <p className="text-sm text-ink">
          <SupportReply href={supportUrl} template={texts.supportReply} />
        </p>
      ) : null}
      <p className="text-sm text-ink-muted">{texts.anonymous}</p>
      {errors.form === undefined ? null : <ErrorText announce>{errors.form}</ErrorText>}
      {unsent === 0 ? null : <SaveFailedStrip message={texts.unsent} attempt={unsent} />}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Button variant="secondary" loading={busy === 'answer'} disabled={disabled} onClick={send}>
          {texts.send}
        </Button>
        <Button
          variant="ghost"
          loading={busy === 'dismiss'}
          disabled={disabled}
          onClick={() => void run('dismiss', { offerId, moment })}
        >
          {texts.dismiss}
        </Button>
      </div>
    </section>
  )
}
