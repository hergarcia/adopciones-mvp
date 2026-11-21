'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { resendPhoneCode } from '@/actions/phone'
import { useFieldFocus } from '@/hooks/use-field-focus'
import { usePhoneCodeCheck } from '@/hooks/use-phone-code-check'
import { useRetryCountdown } from '@/hooks/use-retry-countdown'
import { inAttempts, type AttemptForms } from '@/lib/i18n/plural'
import type { ConfirmResult } from '@/lib/verification/code-check'
import type { RetryDisplay, RetryTexts } from '@/lib/verification/retry-at'
import { CodeField } from './code-field'
import { ResendCode, type ResendNote } from './resend-code'

export type PhoneCodeFormTexts = {
  label: string
  autoCheck: string
  submit: string
  help: string
  resend: string
  /** Con `{number}` adentro. */
  resent: string
  attempts: AttemptForms
  /** Por clave de `verification.errors`; el de "reemplazado" trae `{number}`. */
  errors: Record<string, string>
  retry: RetryTexts
}

type Props = {
  texts: PhoneCodeFormTexts
  /** La puerta tal como llegó en la URL; la acción la vuelve a validar. */
  gate: { para?: string; next?: string; desde?: string }
  available: RetryDisplay
  /** «Ese número está en otra cuenta» con la misma puerta. */
  inUseHref: string
  /** «Ese número no se puede usar» con la misma puerta. */
  withheldHref: string
  signInHref: string
}

type Problem = { message: string; attempts: string | null }

const SESSION = 'verification.errors.session'

// Una sola hoja para el renglón, la tirita y el reenvío: al pedir otro hay que vaciar el renglón,
// decir a qué número salió y volver a contar la espera y los intentos, y eso es estado de un mismo
// formulario (FR-007d).
export function PhoneCodeForm({
  texts,
  gate,
  available,
  inUseHref,
  withheldHref,
  signInHref,
}: Props) {
  const router = useRouter()
  const [inputId, focusInput] = useFieldFocus()
  const [code, setCode] = useState('')
  const [problem, setProblem] = useState<Problem | null>(null)
  const [resendNote, setResendNote] = useState<ResendNote | null>(null)
  const { waiting, hint, waitFor } = useRetryCountdown(available, texts.retry)
  const [resending, startResending] = useTransition()
  const { verifying, check, changed, forget } = usePhoneCodeCheck({
    gate,
    hrefs: { inUse: inUseHref, withheld: withheldHref, signIn: signInHref },
    onStart: () => {
      setProblem(null)
      setResendNote(null)
    },
    onRefused: explain,
  })

  function explain(result: Exclude<ConfirmResult, { ok: true }>) {
    const detail = result.detail
    const template = texts.errors[result.error] ?? result.error
    setProblem({
      message: detail?.number ? template.replace('{number}', detail.number) : template,
      attempts:
        detail?.attemptsLeft === undefined ? null : inAttempts(detail.attemptsLeft, texts.attempts),
    })
    if (detail?.clearInput) setCode('')
    focusInput()
  }

  function changeCode(value: string) {
    setCode(value)
    changed(value)
  }

  function verify(event: React.FormEvent) {
    event.preventDefault()
    check(code)
  }

  function resend() {
    setProblem(null)
    setResendNote(null)

    startResending(async () => {
      try {
        const result = await resendPhoneCode()
        if (result.ok) {
          setCode('')
          forget()
          setResendNote({ ok: true, text: texts.resent.replace('{number}', result.data.number) })
          waitFor(result.data.next)
          return
        }
        if (result.error === SESSION) {
          router.push(signInHref)
          return
        }
        if (result.detail?.retry) waitFor(result.detail.retry)
        setResendNote({ ok: false, text: texts.errors[result.error] ?? result.error })
      } catch {
        setResendNote({
          ok: false,
          text: texts.errors['verification.errors.request_unknown'] ?? '',
        })
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col">
      <form onSubmit={verify} noValidate className="flex flex-col gap-6">
        <CodeField
          id={inputId}
          label={texts.label}
          hint={texts.autoCheck}
          value={code}
          onChange={changeCode}
          error={problem?.message}
          attempts={problem?.attempts ?? null}
        />

        <Button type="submit" variant="tirita" size="lg" loading={verifying}>
          {texts.submit}
        </Button>
      </form>

      <div className="mt-10">
        <ResendCode
          texts={texts}
          onResend={resend}
          resending={resending}
          waiting={waiting}
          hint={hint}
          note={resendNote}
        />
      </div>
    </div>
  )
}
