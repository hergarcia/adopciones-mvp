'use client'

import { useState } from 'react'
import {
  retryText,
  secondsUntil,
  type RetryDisplay,
  type RetryTexts,
} from '@/lib/verification/retry-at'
import { useCountdown } from './use-countdown'

// Arranca de lo que decidió el servidor y no del reloj del teléfono, que puede estar corrido.
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
