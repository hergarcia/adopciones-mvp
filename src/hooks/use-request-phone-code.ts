'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { requestPhoneCode } from '@/actions/phone'
import type { RetryDisplay, RetryTexts } from '@/lib/verification/retry-at'
import { useRetryCountdown } from './use-retry-countdown'

type Options = {
  /** Cuándo se puede pedir, ya decidido en el servidor. */
  available: RetryDisplay
  texts: {
    /** Por clave de `verification.errors`. */
    errors: Record<string, string>
    retry: RetryTexts
  }
  codeHref: string
  signInHref: string
  /** Después de mostrar el error. `unknown`: se cortó la red y no se sabe si el código salió. */
  onError?: (failure: { unknown: boolean }) => void
}

// Pedir un código de la historia #10: con el código pedido, a escribirlo; sin sesión, a entrar; si
// no se puede ahora, el botón espera lo que dijo el servidor.
export function useRequestPhoneCode({ available, texts, codeHref, signInHref, onError }: Options) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { waiting, hint, waitFor } = useRetryCountdown(available, texts.retry)
  const [pending, startTransition] = useTransition()

  function request(number: string) {
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
        onError?.({ unknown: false })
      } catch {
        setError(texts.errors['verification.errors.request_unknown'] ?? null)
        onError?.({ unknown: true })
      }
    })
  }

  return { request, pending, waiting, hint, error }
}
