'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestPhoneCode } from '@/actions/phone'
import { useCountdown } from '@/hooks/use-countdown'
import {
  retryText,
  secondsUntil,
  type RetryDisplay,
  type RetryTexts,
} from '@/lib/verification/retry-at'
import { NextCodeHint } from './next-code-hint'

export type PhoneNumberFormTexts = {
  label: string
  hint: string
  submit: string
  /** Por clave de `verification.errors`. */
  errors: Record<string, string>
  retry: RetryTexts
}

type Props = {
  texts: PhoneNumberFormTexts
  /** El número a medias, para corregirlo sin reescribirlo entero (FR-018). */
  initialNumber?: string
  /** Una sola tirita por pantalla: la decide quien lo monta. */
  isPrimary: boolean
  /** Cuándo se puede pedir, ya decidido en el servidor (FR-010a). */
  available: RetryDisplay
  /** Adónde ir con el código pedido, con la puerta en la URL. */
  codeHref: string
  /** Adónde ir si se cerró la sesión, con esta pantalla como destino. */
  signInHref: string
  /** El aviso de privacidad, entre el renglón y el botón (FR-004). */
  children?: React.ReactNode
}

export function PhoneNumberForm({
  texts,
  initialNumber = '',
  isPrimary,
  available,
  codeHref,
  signInHref,
  children,
}: Props) {
  const router = useRouter()
  const [number, setNumber] = useState(initialNumber)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(available)
  const [secondsLeft, restart] = useCountdown(secondsUntil(available))
  const [pending, startTransition] = useTransition()

  function waitFor(display: RetryDisplay) {
    setRetry(display)
    restart(secondsUntil(display))
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
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
        // Se cortó la red: no se sabe si el código salió. La pantalla vuelve a leer el estado real
        // y, si salió, muestra el número a medias (FR-009e).
        setError(texts.errors['verification.errors.request_unknown'] ?? null)
        router.refresh()
      }
    })
  }

  const waiting = secondsLeft > 0

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">{texts.label}</span>
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          error={error ?? undefined}
        />
        <span className="text-sm text-ink-muted">{texts.hint}</span>
      </label>

      {children}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          variant={isPrimary ? 'tirita' : 'secondary'}
          size="lg"
          loading={pending}
          disabled={waiting}
        >
          {texts.submit}
        </Button>
        <NextCodeHint text={waiting ? retryText(retry, secondsLeft, texts.retry) : null} />
      </div>
    </form>
  )
}
