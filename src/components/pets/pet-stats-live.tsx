'use client'

import { useId, useState, useTransition } from 'react'
import { readPetStats } from '@/actions/pet-stats'
import type { ActionResult } from '@/actions/result'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import type { PublicationKind } from '@/lib/pet-stats/types'
import { PetStatsBlock, PetStatsHeading } from './pet-stats-block'
import type { PetStatsView } from './pet-stats-texts'

type Props = {
  request: { kind: PublicationKind; id: string }
  initial: ActionResult<PetStatsView>
  /** Ya traducidos, para cuando los números no llegaron. */
  texts: { title: string; error: string; retry: string }
}

type Retried = { over: ActionResult<PetStatsView>; result: ActionResult<PetStatsView> }

// La única parte viva del bloque: «Probar de nuevo» vuelve a pedir solo los números, sin recargar la
// página, y si vuelve a fallar deja el mismo aviso (FR-019). Los números no cambian solos (FR-020).
// Un reintento vale sobre el `initial` que reemplazó: cuando una acción de la página vuelve a dibujar
// el bloque desde el servidor, manda lo nuevo.
export function PetStatsLive({ request, initial, texts }: Props) {
  const titleId = useId()
  const [retried, setRetried] = useState<Retried | null>(null)
  const [retrying, startRetry] = useTransition()
  const result = retried !== null && retried.over === initial ? retried.result : initial

  function retry() {
    startRetry(async () => {
      setRetried({ over: initial, result: await readPetStats(request) })
    })
  }

  return (
    <div aria-live="polite">
      {result.ok ? (
        <PetStatsBlock view={result.data} titleId={titleId} />
      ) : (
        <section aria-labelledby={titleId} className="flex flex-col items-start gap-4">
          <PetStatsHeading id={titleId} title={texts.title} />
          <ErrorText>{texts.error}</ErrorText>
          <Button variant="secondary" size="sm" loading={retrying} onClick={retry}>
            {texts.retry}
          </Button>
        </section>
      )}
    </div>
  )
}
