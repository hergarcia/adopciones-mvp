'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestLoginLink } from '@/actions/auth'
import { inSeconds, type SecondForms } from '@/lib/i18n/plural'

export type EmailLinkFormTexts = {
  emailLabel: string
  emailPlaceholder: string
  submit: string
  errors: Record<string, string>
  /** Aparte del resto: es el único con un número adentro, y el número decide la forma. */
  rateLimited: SecondForms
}

type Props = {
  texts: EmailLinkFormTexts
  next?: string
  /** Lo decide quien lo monta: depende de si hay un botón de Google, y docs/10 admite una sola
   * tirita por pantalla. */
  isPrimary: boolean
}

// Recibe los textos ya traducidos por props: al navegador no le baja `messages/es.json`, solo lo
// que esta pantalla muestra (constitución §VII).
export function EmailLinkForm({ texts, next, isPrimary }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await requestLoginLink(email, next)
      if (result.ok) {
        router.push('/entrar/revisa-tu-correo')
        return
      }

      setError(
        result.seconds === undefined
          ? (texts.errors[result.error] ?? result.error)
          : inSeconds(result.seconds, texts.rateLimited),
      )
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">{texts.emailLabel}</span>
        {/* Sin `name` a propósito: si el formulario se envía antes de hidratar, el navegador hace
            un GET nativo y un campo con nombre dejaría la dirección en la URL —en el historial, en
            los registros y en el `Referer`—, que es exactamente lo que la cookie existe para
            evitar (constitución §V). */}
        <Input
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={texts.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error ?? undefined}
        />
      </label>

      <Button
        type="submit"
        variant={isPrimary ? 'tirita' : 'secondary'}
        size="lg"
        loading={pending}
      >
        {texts.submit}
      </Button>
    </form>
  )
}
