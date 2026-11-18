'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { askQuestion } from '@/actions/application-responses'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { SheetClose } from '@/components/ui/sheet'
import { afterOpenModule } from '@/hooks/use-after-open'
import { useResponseErrors } from '@/hooks/use-response-errors'
import { ANSWER_COUNTER_FROM, QUESTION_MAX_LENGTH } from '@/lib/applications/rules'
import { toFieldError } from '@/lib/schemas/field-error'
import type { AskQuestionTexts } from './ask-question-sheet'
import { ContactLaterNote } from './contact-later-note'

const FAILED = 'inbox.errors.failed'

// El schema llega después de abrir y lo espera el toque que llega antes (historia #304).
const loadSchemas = afterOpenModule(() => import('@/lib/schemas/application-response'))

type Props = {
  id: string
  doneHref: string
  texts: AskQuestionTexts
  text: string
  onText: (text: string) => void
  busy: boolean
  onBusy: (busy: boolean) => void
  close: () => void
}

// Lo de adentro de pedir más información, que llega después de abrir: una pregunta de hasta 500
// caracteres, sin un contacto (FR-034). Se monta con cada apertura, que es un intento nuevo: un doble
// toque de «Enviar pregunta» pregunta una sola vez (FR-064). Lo escrito queda si algo no pasa; si la
// solicitud cambió mientras tanto, lo dice adentro y la pantalla de atrás se refresca con el estado
// real (FR-044).
export function AskQuestionBody({ id, doneHref, texts, text, onText, busy, onBusy, close }: Props) {
  const router = useRouter()
  const [attemptId] = useState(() => crypto.randomUUID())
  const [errors, setErrors] = useState<{ text?: string; form?: string }>({})
  const { message, failure } = useResponseErrors(texts.errors, FAILED)

  async function send() {
    if (busy) return
    const input = { id, attemptId, text }
    onBusy(true)
    const schemas = await loadSchemas().catch(() => null)
    if (schemas === null) {
      onBusy(false)
      setErrors({ form: failure(undefined) })
      return
    }
    const issue = schemas.questionSchema.safeParse(input).error?.issues[0]
    if (issue !== undefined) {
      onBusy(false)
      const { key, values } = toFieldError(issue)
      setErrors({ text: message(key, values?.fragment) ?? message(FAILED) })
      return
    }
    setErrors({})
    const result = await askQuestion(input).catch(() => null)
    onBusy(false)
    if (result?.ok) {
      close()
      onText('')
      router.push(doneHref)
      return
    }
    setErrors({ form: failure(result?.error) })
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <CountedTextarea
        value={text}
        onChange={onText}
        label={texts.label}
        help={texts.remaining}
        error={errors.text}
        disabled={busy}
        max={QUESTION_MAX_LENGTH}
        from={ANSWER_COUNTER_FROM}
        counts={texts.counts}
        rows={3}
      />
      <ContactLaterNote text={texts.contactLater} />
      {errors.form === undefined ? null : <ErrorText announce>{errors.form}</ErrorText>}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button loading={busy} onClick={() => void send()}>
          {texts.confirm}
        </Button>
        <SheetClose>
          <Button variant="ghost" disabled={busy}>
            {texts.cancel}
          </Button>
        </SheetClose>
      </div>
    </div>
  )
}
