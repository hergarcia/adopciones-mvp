'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { askQuestion } from '@/actions/application-responses'
import type { CountForms } from '@/components/forms/character-count'
import { Button } from '@/components/ui/button'
import { deferred } from '@/components/ui/deferred'
import { Sheet } from '@/components/ui/sheet'
import { useResponseErrors } from '@/hooks/use-response-errors'
import { afterOpenModule } from '@/hooks/use-after-open'
import { toFieldError } from '@/lib/schemas/field-error'

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

const AskQuestionBody = deferred(() =>
  import('./ask-question-body').then((module) => module.AskQuestionBody),
)

// El schema llega después de abrir y lo espera el toque que llega antes (historia #304).
const loadSchemas = afterOpenModule(() => import('@/lib/schemas/application-response'))

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

  const { message, failure } = useResponseErrors(texts.errors, FAILED)

  async function send() {
    if (busy) return
    const input = { id, attemptId, text }
    setBusy(true)
    const schemas = await loadSchemas().catch(() => null)
    if (schemas === null) {
      setBusy(false)
      setErrors({ form: failure(undefined) })
      return
    }
    const issue = schemas.questionSchema.safeParse(input).error?.issues[0]
    if (issue !== undefined) {
      setBusy(false)
      const { key, values } = toFieldError(issue)
      setErrors({ text: message(key, values?.fragment) ?? message(FAILED) })
      return
    }
    setErrors({})
    const result = await askQuestion(input).catch(() => null)
    setBusy(false)
    if (result?.ok) {
      setOpen(false)
      setText('')
      router.push(doneHref)
      return
    }
    setErrors({ form: failure(result?.error) })
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
      <AskQuestionBody
        text={text}
        onText={setText}
        errors={errors}
        busy={busy}
        onSend={() => void send()}
        texts={texts}
      />
    </Sheet>
  )
}
