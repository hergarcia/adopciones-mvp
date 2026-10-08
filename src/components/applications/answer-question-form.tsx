'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { answerQuestion } from '@/actions/applications'
import type { CountForms } from '@/components/forms/character-count'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { useResponseErrors } from '@/hooks/use-response-errors'
import { ANSWER_COUNTER_FROM, QUESTION_MAX_LENGTH } from '@/lib/applications/rules'
import { answerSchema } from '@/lib/schemas/application-response'
import { toFieldError } from '@/lib/schemas/field-error'
import { ContactLaterNote } from './contact-later-note'

export type AnswerQuestionTexts = {
  label: string
  contactLater: string
  submit: string
  /** Lo que se dice cuando la respuesta no llegó: lo escrito sigue ahí. */
  unsent: string
  counts: { left: CountForms; over: CountForms }
  /** Por clave de `applications.answer.errors`; los de contacto, crudos con `{fragment}`. */
  errors: Record<string, string>
}

type Props = {
  questionId: string
  /** Adónde va al contestar: Mi solicitud con el aviso de «Respuesta enviada». */
  doneHref: string
  texts: AnswerQuestionTexts
}

const FAILED = 'applications.answer.errors.failed'
const NOT_ACTIVE = 'applications.answer.errors.not_active'

// Contestar la pregunta del publicador, una sola vez (FR-030). Un teléfono, un correo o un enlace se
// marcan y se explica que el contacto se da al aceptar, con lo escrito en pantalla (US3-AS5). Si no
// llegó, la tira de papel arriba de la tirita, que vuelve a mandar lo mismo. Si la solicitud se cerró
// mientras escribía, lo dice y lo escrito queda en pantalla, ya sin poder mandarse: refrescar se
// llevaría el formulario y el texto con él (FR-032).
export function AnswerQuestionForm({ questionId, doneHref, texts }: Props) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<{ text?: string; form?: string }>({})
  const [unsent, setUnsent] = useState(0)
  const [closed, setClosed] = useState(false)

  const { message, failure } = useResponseErrors(texts.errors, FAILED, { keep: [NOT_ACTIVE] })

  async function submit() {
    const input = { questionId, text }
    const issue = answerSchema.safeParse(input).error?.issues[0]
    if (issue !== undefined) {
      const { key, values } = toFieldError(issue)
      setErrors({ text: message(key, values?.fragment) ?? message(FAILED) })
      return
    }
    setErrors({})
    setBusy(true)
    const result = await answerQuestion(input).catch(() => null)
    setBusy(false)
    if (result === null) {
      setUnsent((attempt) => attempt + 1)
      return
    }
    setUnsent(0)
    if (result.ok) {
      router.push(doneHref)
      return
    }
    if (result.error === NOT_ACTIVE) setClosed(true)
    setErrors({ form: failure(result.error) })
  }

  return (
    <div className="flex flex-col gap-4">
      <CountedTextarea
        value={text}
        onChange={setText}
        label={texts.label}
        error={errors.text}
        disabled={busy || closed}
        max={QUESTION_MAX_LENGTH}
        from={ANSWER_COUNTER_FROM}
        counts={texts.counts}
        rows={3}
      />
      <ContactLaterNote text={texts.contactLater} />
      {errors.form === undefined ? null : <ErrorText announce>{errors.form}</ErrorText>}
      {unsent === 0 ? null : <SaveFailedStrip message={texts.unsent} attempt={unsent} />}
      {closed ? null : (
        <Button
          variant="tirita"
          size="lg"
          className="w-full md:w-auto"
          loading={busy}
          onClick={() => void submit()}
        >
          {texts.submit}
        </Button>
      )}
    </div>
  )
}
