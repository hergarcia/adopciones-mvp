'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { resendLinkFor } from '@/actions/auth'

export type ResendFromLinkTexts = {
  /** Por clave de error, ya traducidos; `rate_limited` lleva `{seconds}` adentro. */
  errors: Record<string, string>
}

type Props = {
  linkId: string
  label: string
  texts: ResendFromLinkTexts
}

// Manda el **id del enlace**, no una dirección: el servidor resuelve el correo y la pantalla nunca
// lo conoce, así que no lo puede mostrar (FR-005b). Un enlace se abre por reenvío o desde un buzón
// compartido, y quien lo mira puede no ser su dueña.
export function ResendFromLinkButton({ linkId, label, texts }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function resend() {
    setError(null)
    startTransition(async () => {
      const result = await resendLinkFor(linkId)
      if (result.ok) {
        router.push('/entrar/revisa-tu-correo')
        return
      }

      // El mensaje que corresponde al motivo: decirle «tu enlace es muy viejo» a quien tocó dos
      // veces en un minuto no le explica nada ni le dice cuánto falta.
      const message = texts.errors[result.error] ?? result.error
      setError(
        result.seconds === undefined
          ? message
          : message.replace('{seconds}', String(result.seconds)),
      )
    })
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button variant="secondary" onClick={resend} loading={pending}>
        {label}
      </Button>
      {/* Un error es un error: en acento y anunciado, no una ayuda gris que nadie escucha
          (docs/10 §Componentes). */}
      {error ? (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      ) : null}
    </div>
  )
}
