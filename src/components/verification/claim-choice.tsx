'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { startPhoneClaim } from '@/actions/phone-claim'
import { useExpireClaim } from './claim-deadline'

type Props = {
  texts: { choose: string; deadline: string; failed: string }
  /** La puerta tal como llegó en la URL; la acción la vuelve a validar. */
  gate: { para?: string; next?: string; desde?: string }
  signInHref: string
}

// «Es mío y no puedo entrar a esa cuenta» es un desvío deliberado, no el próximo paso de la
// mayoría: va en `secondary`. La prueba se comprueba antes de navegar, así que si ya no vale la
// pantalla pide un código nuevo con el número que ya tiene (FR-008).
export function ClaimChoice({ texts, gate, signInHref }: Props) {
  const router = useRouter()
  const expire = useExpireClaim()
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()
  const deadlineId = useId()

  function choose() {
    setFailed(false)
    startTransition(async () => {
      try {
        const result = await startPhoneClaim(gate)
        if (result.ok) {
          router.push(result.data.path)
          return
        }
        if (result.error === 'verification.errors.session') {
          router.push(signInHref)
          return
        }
        expire()
      } catch {
        setFailed(true)
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secondary"
        onClick={choose}
        loading={pending}
        aria-describedby={deadlineId}
        className="text-left"
      >
        {texts.choose}
      </Button>
      <p id={deadlineId} className="text-sm text-ink-muted">
        {texts.deadline}
      </p>
      {failed ? <ErrorText announce>{texts.failed}</ErrorText> : null}
    </div>
  )
}
