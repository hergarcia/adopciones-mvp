'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { requestLoginLink } from '@/actions/auth'

export type ResendTexts = {
  resend: string
  /** Con `{seconds}` adentro: la cuenta regresiva se arma acá, no en el servidor. */
  resendIn: string
  resent: string
  sendFailed: string
}

type Props = {
  texts: ResendTexts
  email: string
  initialWaitSeconds: number
}

// La cuenta regresiva sale de los pedidos de ESTE navegador y no de la dirección: decir «faltan
// 45 segundos» para un correo ajeno delataría que esa dirección pidió algo hace poco (FR-006a).
export function ResendLinkButton({ texts, email, initialWaitSeconds }: Props) {
  const [waitSeconds, setWaitSeconds] = useState(initialWaitSeconds)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (waitSeconds <= 0) return undefined
    const timer = setTimeout(() => setWaitSeconds((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [waitSeconds])

  function resend() {
    setNotice(null)
    startTransition(async () => {
      const result = await requestLoginLink(email)
      if (result.ok) {
        setWaitSeconds(result.data.waitSeconds)
        setNotice(texts.resent)
      } else {
        setNotice(texts.sendFailed)
      }
    })
  }

  const waiting = waitSeconds > 0

  return (
    <div className="mt-8 flex flex-col items-start gap-2">
      <Button variant="ghost" onClick={resend} disabled={waiting} loading={pending}>
        {waiting ? texts.resendIn.replace('{seconds}', String(waitSeconds)) : texts.resend}
      </Button>
      {notice ? (
        <p aria-live="polite" className="text-sm text-ink-muted">
          {notice}
        </p>
      ) : null}
    </div>
  )
}
