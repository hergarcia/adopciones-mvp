'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { confirmPhoneCode, resendPhoneCode } from '@/actions/phone'
import { useFieldFocus } from '@/hooks/use-field-focus'
import { useRetryCountdown } from '@/hooks/use-retry-countdown'
import { inAttempts, type AttemptForms } from '@/lib/i18n/plural'
import type { ConfirmResult } from '@/lib/verification/code-check'
import type { RetryDisplay, RetryTexts } from '@/lib/verification/retry-at'
import { CodeField } from './code-field'
import { ResendCode, type ResendNote } from './resend-code'

export type PhoneCodeFormTexts = {
  label: string
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
  header: React.ReactNode
  texts: PhoneCodeFormTexts
  /** La puerta tal como llegó en la URL; la acción la vuelve a validar. */
  gate: { para?: string; next?: string; desde?: string }
  available: RetryDisplay
  /** «Ese número está en otra cuenta» con la misma puerta. */
  inUseHref: string
  signInHref: string
}

type Problem = { message: string; attempts: string | null }

const SESSION = 'verification.errors.session'
const CHECK_FAILED = 'verification.errors.check_failed'
const IN_USE = 'verification.errors.number_in_use'

// Una sola hoja para el renglón, la tirita y el reenvío: al pedir otro hay que vaciar el renglón,
// decir a qué número salió y volver a contar la espera y los intentos, y eso es estado de un mismo
// formulario (FR-007d).
export function PhoneCodeForm({ header, texts, gate, available, inUseHref, signInHref }: Props) {
  const router = useRouter()
  const [inputId, focusInput] = useFieldFocus()
  const [code, setCode] = useState('')
  const [problem, setProblem] = useState<Problem | null>(null)
  const [resendNote, setResendNote] = useState<ResendNote | null>(null)
  const { waiting, hint, waitFor } = useRetryCountdown(available, texts.retry)
  const [verifying, startVerifying] = useTransition()
  const [resending, startResending] = useTransition()

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

  function verify(event: React.FormEvent) {
    event.preventDefault()
    setProblem(null)
    setResendNote(null)

    startVerifying(async () => {
      try {
        const result = await confirmPhoneCode(code, gate)
        if (result.ok) {
          router.replace(result.data.destination)
          return
        }
        if (result.error === SESSION) {
          router.push(signInHref)
          return
        }
        // Ya no hay nada a medias: los caminos viven en su propia ruta, a la que la confirmación
        // puede volver (FR-006 de la #25).
        if (result.error === IN_USE) {
          router.replace(inUseHref)
          return
        }
        explain(result)
      } catch {
        // La red, no el código: no cuenta como intento y lo escrito queda (FR-007c).
        explain({ ok: false, error: CHECK_FAILED, detail: { clearInput: false } })
      }
    })
  }

  function resend() {
    setProblem(null)
    setResendNote(null)

    startResending(async () => {
      try {
        const result = await resendPhoneCode()
        if (result.ok) {
          setCode('')
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
      {header}
      <form onSubmit={verify} noValidate className="mt-8 flex flex-col gap-6">
        <CodeField
          id={inputId}
          label={texts.label}
          value={code}
          onChange={setCode}
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
