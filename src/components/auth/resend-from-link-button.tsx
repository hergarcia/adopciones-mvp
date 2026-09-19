'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { resendLinkFor } from '@/actions/auth'

type Props = {
  linkId: string
  label: string
  unknownLabel: string
}

// Manda el **id del enlace**, no una dirección: el servidor resuelve el correo y la pantalla nunca
// lo conoce, así que no lo puede mostrar (FR-005b). Un enlace se abre por reenvío o desde un buzón
// compartido, y quien lo mira puede no ser su dueña.
export function ResendFromLinkButton({ linkId, label, unknownLabel }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function resend() {
    setError(null)
    startTransition(async () => {
      const result = await resendLinkFor(linkId)
      if (result.ok) router.push('/entrar/revisa-tu-correo')
      else setError(unknownLabel)
    })
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button variant="secondary" onClick={resend} loading={pending}>
        {label}
      </Button>
      {error ? <p className="text-sm text-ink-muted">{error}</p> : null}
    </div>
  )
}
