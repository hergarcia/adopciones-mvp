'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { confirmPhoneClaim, readPhoneClaim } from '@/actions/phone-claim'
import { useExpireClaim } from './claim-deadline'

type Props = {
  /** El número de la prueba, en formato de pantalla: con él se lee el estado real (FR-011). */
  number: string
  texts: { confirm: string; checkFailed: string; unknown: string }
  gate: { para?: string; next?: string; desde?: string }
  signInHref: string
}

const SESSION = 'verification.errors.session'
const EXPIRED = 'verification.claim.errors.expired'

// La tirita de confirmar y lo que pasa después. Si confirmar falla por la red o la base, nunca se
// dice que el teléfono quedó verificado sin saberlo: se lee el estado real comparando el número de
// la pantalla con el de la cuenta (FR-011).
export function ClaimConfirmForm({ number, texts, gate, signInHref }: Props) {
  const router = useRouter()
  const expire = useExpireClaim()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  // Después de una falla, la prueba pudo haberse usado: una prueba que ya no está puede ser que el
  // número ya es de esta cuenta.
  const failedBefore = useRef(false)

  async function readBack() {
    try {
      const read = await readPhoneClaim(number, gate)
      if (!read.ok) {
        if (read.error === SESSION) router.push(signInHref)
        else setError(texts.unknown)
        return
      }
      if (read.data.state === 'owned') router.replace(read.data.destination)
      else if (read.data.state === 'pending') setError(texts.checkFailed)
      else expire()
    } catch {
      setError(texts.unknown)
    }
  }

  function confirm(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const result = await confirmPhoneClaim(gate)
        if (result.ok) {
          router.replace(result.data.destination)
          return
        }
        if (result.error === SESSION) {
          router.push(signInHref)
          return
        }
        if (result.error === EXPIRED && !failedBefore.current) {
          expire()
          return
        }
      } catch {
        // La red: no se sabe si llegó. Se mira cómo quedó.
      }
      failedBefore.current = true
      await readBack()
    })
  }

  return (
    <form onSubmit={confirm} noValidate className="flex flex-col gap-2">
      <Button type="submit" variant="tirita" size="lg" loading={pending}>
        {texts.confirm}
      </Button>
      {error ? <ErrorText announce>{error}</ErrorText> : null}
    </form>
  )
}
