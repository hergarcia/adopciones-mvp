'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { askQuestion } from '@/actions/application-responses'
import type { CountForms } from '@/components/forms/character-count'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { Sheet, SheetClose } from '@/components/ui/sheet'
import { ANSWER_COUNTER_FROM, QUESTION_MAX_LENGTH } from '@/lib/applications/rules'
import { questionSchema } from '@/lib/schemas/application-response'
import { toFieldError } from '@/lib/schemas/field-error'
import { ContactLaterNote } from './contact-later-note'

export type AskQuestionTexts = {
  trigger: string
  title: string
  label: string
  /** «Te quedan 2 preguntas», ya con el número. */
  remaining: string
  contactLater: string
  confirm: string
  cancel: string
  close: string
  counts: { left: CountForms; over: CountForms }
  /** Por clave de `inbox.errors`; los de contacto, crudos con `{fragment}`. */
  errors: Record<string, string>
}

type Props = {
  id: string
  /** Adónde va al enviarla: la misma solicitud con el aviso. */
  doneHref: string
  texts: AskQuestionTexts
}

const FAILED = 'inbox.errors.failed'

// Pedir más información (FR-030): una pregunta de hasta 500 caracteres, sin un contacto (FR-034).
// Cada apertura es un intento nuevo, así un doble toque de «Enviar pregunta» pregunta una sola vez
// (FR-064). Lo escrito queda si algo no pasa; si la solicitud cambió mientras tanto, lo dice adentro y
// la pantalla de atrás se refresca con el estado real (FR-044).
export function AskQuestionSheet({ id, doneHref, texts }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [attemptId, setAttemptId] = useState('')
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<{ text?: string; form?: string }>({})

  function message(key: string, fragment?: string): string | undefined {
    const value = texts.errors[key]
    return fragment === undefined ? value : value?.replace('{fragment}', fragment)
  }

  async function send() {
    const input = { id, attemptId, text }
    const issue = questionSchema.safeParse(input).error?.issues[0]
    if (issue !== undefined) {
      const { key, values } = toFieldError(issue)
      setErrors({ text: message(key, values?.fragment) ?? message(FAILED) })
      return
    }
    setErrors({})
    setBusy(true)
    const result = await askQuestion(input).catch(() => null)
    setBusy(false)
    if (result?.ok) {
      setOpen(false)
      setText('')
      router.push(doneHref)
      return
    }
    const key = result?.error ?? FAILED
    if (key !== FAILED) router.refresh()
    setErrors({ form: message(key) ?? message(FAILED) })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (busy) return
        setOpen(next)
        if (next) {
          setAttemptId(crypto.randomUUID())
          setErrors({})
        }
      }}
      title={texts.title}
      closeLabel={texts.close}
      trigger={
        <Button variant="secondary" className="w-full md:w-auto">
          {texts.trigger}
        </Button>
      }
    >
      <div className="flex w-full flex-col gap-4">
        <CountedTextarea
          value={text}
          onChange={setText}
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
    </Sheet>
  )
}
