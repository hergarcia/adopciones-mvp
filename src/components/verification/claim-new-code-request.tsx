'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { requestPhoneCode } from '@/actions/phone'
import { useRetryCountdown } from '@/hooks/use-retry-countdown'
import type { RetryDisplay, RetryTexts } from '@/lib/verification/retry-at'
import { NextCodeHint } from './next-code-hint'

export type ClaimNewCodeRequestTexts = {
  send: string
  /** Por clave de `verification.errors`. */
  errors: Record<string, string>
  retry: RetryTexts
}

type Props = {
  /** El número de la prueba, en formato de pantalla: el que la persona tiene a la vista. */
  number: string
  texts: ClaimNewCodeRequestTexts
  /** Cuándo se puede pedir, ya decidido en el servidor (FR-008). */
  available: RetryDisplay
  codeHref: string
  signInHref: string
}

// Un pedido de código común de la historia #10, sin reescribir el número: cuenta para la espera y
// el tope, y si no se puede pedir ahora el botón se deshabilita y dice cuándo (FR-008).
export function ClaimNewCodeRequest({ number, texts, available, codeHref, signInHref }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { waiting, hint, waitFor } = useRetryCountdown(available, texts.retry)
  const [pending, startTransition] = useTransition()

  function request() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await requestPhoneCode(number)
        if (result.ok) {
          router.push(codeHref)
          return
        }
        if (result.error === 'verification.errors.session') {
          router.push(signInHref)
          return
        }
        if (result.detail?.retry) waitFor(result.detail.retry)
        setError(texts.errors[result.error] ?? result.error)
      } catch {
        setError(texts.errors['verification.errors.request_unknown'] ?? null)
      }
    })
  }

  return (
    <>
      <Button variant="tirita" size="lg" onClick={request} loading={pending} disabled={waiting}>
        {texts.send}
      </Button>
      <NextCodeHint text={hint} />
      {error ? <ErrorText announce>{error}</ErrorText> : null}
    </>
  )
}
