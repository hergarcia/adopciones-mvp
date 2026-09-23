'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { confirmPhoneCode, resendPhoneCode } from '@/actions/phone'
import { useCountdown } from '@/hooks/use-countdown'
import { inAttempts, type AttemptForms } from '@/lib/i18n/plural'
import type { ConfirmResult } from '@/lib/verification/code-check'
import {
  retryText,
  secondsUntil,
  type RetryDisplay,
  type RetryTexts,
} from '@/lib/verification/retry-at'
import { NumberInUseWays } from './number-in-use-ways'
import { NextCodeHint } from './next-code-hint'

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
  inUseWays: string
  verifyOther: string
  continue: string
  retry: RetryTexts
}

type Props = {
  texts: PhoneCodeFormTexts
  /** La puerta tal como llegó en la URL; la acción la vuelve a validar. */
  gate: { para?: string; next?: string; desde?: string }
  available: RetryDisplay
  /** «Verificar teléfono» con la misma puerta, para verificar otro número. */
  verifyHref: string
  signInHref: string
}

type Problem = { message: string; attempts: string | null; inUse: boolean; continueTo?: string }

const SESSION = 'verification.errors.session'
const CHECK_FAILED = 'verification.errors.check_failed'

// Una sola hoja para el renglón, la tirita y el reenvío: al pedir otro hay que vaciar el renglón,
// decir a qué número salió y volver a contar la espera y los intentos, y eso es estado de un mismo
// formulario (FR-007d).
export function PhoneCodeForm({ texts, gate, available, verifyHref, signInHref }: Props) {
  const router = useRouter()
  const inputId = useId()
  const [code, setCode] = useState('')
  const [problem, setProblem] = useState<Problem | null>(null)
  const [resent, setResent] = useState<string | null>(null)
  const [retry, setRetry] = useState(available)
  const [secondsLeft, restart] = useCountdown(secondsUntil(available))
  const [verifying, startVerifying] = useTransition()
  const [resending, startResending] = useTransition()

  function waitFor(display: RetryDisplay) {
    setRetry(display)
    restart(secondsUntil(display))
  }

  function explain(result: Exclude<ConfirmResult, { ok: true }>) {
    const detail = result.detail
    const template = texts.errors[result.error] ?? result.error
    setProblem({
      message: detail?.number ? template.replace('{number}', detail.number) : template,
      attempts:
        detail?.attemptsLeft === undefined ? null : inAttempts(detail.attemptsLeft, texts.attempts),
      inUse: result.error === 'verification.errors.number_in_use',
      ...(detail?.continueTo ? { continueTo: detail.continueTo } : {}),
    })
    if (detail?.clearInput) setCode('')
    document.getElementById(inputId)?.focus()
  }

  function verify(event: React.FormEvent) {
    event.preventDefault()
    setProblem(null)
    setResent(null)

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
        explain(result)
      } catch {
        // La red, no el código: no cuenta como intento y lo escrito queda (FR-007c).
        explain({ ok: false, error: CHECK_FAILED, detail: { clearInput: false } })
      }
    })
  }

  function resend() {
    setProblem(null)
    setResent(null)

    startResending(async () => {
      try {
        const result = await resendPhoneCode()
        if (result.ok) {
          setCode('')
          setResent(texts.resent.replace('{number}', result.data.number))
          waitFor(result.data.next)
          return
        }
        if (result.error === SESSION) {
          router.push(signInHref)
          return
        }
        if (result.detail?.retry) waitFor(result.detail.retry)
        setProblem({
          message: texts.errors[result.error] ?? result.error,
          attempts: null,
          inUse: false,
        })
      } catch {
        setProblem({
          message: texts.errors['verification.errors.request_unknown'] ?? '',
          attempts: null,
          inUse: false,
        })
        router.refresh()
      }
    })
  }

  const waiting = secondsLeft > 0

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={verify} noValidate className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-ink-muted">{texts.label}</span>
          {/* Un solo campo y no seis casillas: así el teléfono sugiere el código del mensaje y se
              puede pegar entero. */}
          <Input
            id={inputId}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={9}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="text-2xl tabular-nums"
            error={problem?.message}
          />
        </label>

        {problem?.attempts ? <p className="text-sm text-ink">{problem.attempts}</p> : null}
        {problem?.inUse ? (
          <NumberInUseWays texts={texts} verifyHref={verifyHref} continueTo={problem.continueTo} />
        ) : null}
        {resent ? <output className="text-sm text-ink-muted">{resent}</output> : null}

        <Button type="submit" variant="tirita" size="lg" loading={verifying}>
          {texts.submit}
        </Button>
      </form>

      <Card>
        <p className="text-sm text-ink">{texts.help}</p>
      </Card>

      <div className="flex flex-col items-start gap-2">
        <Button variant="ghost" onClick={resend} loading={resending} disabled={waiting}>
          {texts.resend}
        </Button>
        <NextCodeHint text={waiting ? retryText(retry, secondsLeft, texts.retry) : null} />
      </div>
    </div>
  )
}
