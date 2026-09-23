'use client'

import { useState } from 'react'
import {
  retryText,
  secondsUntil,
  type RetryDisplay,
  type RetryTexts,
} from '@/lib/verification/retry-at'
import { useCountdown } from './use-countdown'

// La espera para pedir otro código, desde lo que decidió el servidor: si el botón se puede tocar y
// qué decir mientras tanto. `waitFor` la vuelve a arrancar con lo que responde un pedido.
export function useRetryCountdown(
  available: RetryDisplay,
  texts: RetryTexts,
): { waiting: boolean; hint: string | null; waitFor: (display: RetryDisplay) => void } {
  const [retry, setRetry] = useState(available)
  const [secondsLeft, restart] = useCountdown(secondsUntil(available))

  function waitFor(display: RetryDisplay) {
    setRetry(display)
    restart(secondsUntil(display))
  }

  const waiting = secondsLeft > 0
  return { waiting, hint: waiting ? retryText(retry, secondsLeft, texts) : null, waitFor }
}
