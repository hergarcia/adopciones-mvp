'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { NextCodeHint } from '@/components/verification/next-code-hint'
import { requestLoginLink } from '@/actions/auth'
import { useCountdown } from '@/hooks/use-countdown'
import { inSeconds, type SecondForms } from '@/lib/i18n/plural'

export type ResendTexts = {
  resend: string
  /** La cuenta regresiva se arma acá, no en el servidor: el número lo tiene el navegador. */
  resendIn: SecondForms
  resent: string
  sendFailed: string
  rateLimited: SecondForms
}

type Props = {
  texts: ResendTexts
  email: string
  initialWaitSeconds: number
}

// La cuenta regresiva sale de los pedidos de ESTE navegador y no de la dirección: decir «faltan
// 45 segundos» para un correo ajeno delataría que esa dirección pidió algo hace poco (FR-006a).
export function ResendLinkButton({ texts, email, initialWaitSeconds }: Props) {
  const [waitSeconds, setWaitSeconds] = useCountdown(initialWaitSeconds)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function resend() {
    // Los dos estados se apagan juntos: son excluyentes, y dejar la confirmación anterior debajo
    // de un error diría dos cosas opuestas a la vez.
    setSent(false)
    setError(null)

    startTransition(async () => {
      const result = await requestLoginLink(email)
      if (result.ok) {
        setWaitSeconds(result.data.waitSeconds)
        setSent(true)
        return
      }

      // «Te mandamos otro» solo cuando salió algo: decirlo con el cupo agotado sería mandar a la
      // persona a mirar un buzón donde no va a llegar nada.
      if (result.seconds !== undefined) setWaitSeconds(result.seconds)
      setError(
        result.seconds === undefined
          ? texts.sendFailed
          : inSeconds(result.seconds, texts.rateLimited),
      )
    })
  }

  const waiting = waitSeconds > 0

  return (
    <div className="mt-8 flex flex-col items-start gap-2">
      <Button variant="ghost" onClick={resend} disabled={waiting} loading={pending}>
        {texts.resend}
      </Button>

      <NextCodeHint text={waiting ? inSeconds(waitSeconds, texts.resendIn) : null} />

      {/* Esto sí se anuncia: cambia una vez, cuando la persona acaba de tocar el botón. */}
      {sent ? <output className="text-sm text-ink-muted">{texts.resent}</output> : null}

      {/* Un error es un error: en acento y anunciado, no una ayuda gris que nadie escucha
          (docs/10 §Color). */}
      {error ? <ErrorText announce>{error}</ErrorText> : null}
    </div>
  )
}
