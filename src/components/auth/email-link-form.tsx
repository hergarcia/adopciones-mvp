'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestLoginLink } from '@/actions/auth'

export type EmailLinkFormTexts = {
  emailLabel: string
  emailPlaceholder: string
  submit: string
  errors: Record<string, string>
}

type Props = {
  texts: EmailLinkFormTexts
  next?: string
}

// Recibe los textos ya traducidos por props: el layout deja fuera el provider de i18n a propósito,
// para no mandarle al navegador los mensajes de todos los dominios (constitución §VII).
export function EmailLinkForm({ texts, next }: Props) {
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

      const message = texts.errors[result.error] ?? result.error
      setError(
        result.seconds === undefined
          ? message
          : message.replace('{seconds}', String(result.seconds)),
      )
    })
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">{texts.emailLabel}</span>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder={texts.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error ?? undefined}
        />
      </label>

      <Button type="submit" variant="tirita" size="lg" loading={pending}>
        {texts.submit}
      </Button>
    </form>
  )
}
