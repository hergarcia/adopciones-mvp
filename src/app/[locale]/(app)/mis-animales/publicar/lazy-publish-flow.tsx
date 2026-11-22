'use client'

import type { ComponentProps } from 'react'
import { PetFormTitle } from '@/components/pets/pet-form-title'
import { RetryNotice, type RetryTexts } from '@/components/ui/retry-notice'
import { useAfterOpenWithRetry } from '@/hooks/use-after-open-with-retry'
import type { PublishFlow } from './publish-flow'

// La camada y lo de abajo de su formulario bajan juntos y recién después de abrir: pedidos al
// despertar, a veces entraban antes de que la pantalla terminara de abrir y «Publicar una camada»
// pasaba los 150 KB (historia #338).
const loadFlow = () =>
  Promise.all([import('./publish-flow'), import('@/components/litters/litter-form-body')]).then(
    ([module]) => module.PublishFlow,
  )

type Props = ComponentProps<typeof PublishFlow> & {
  /** La espera, con el título de verdad, dibujada por el servidor: viaja en el HTML. */
  waiting: React.ReactNode
  /** Si no llegó: todavía no hay nada cargado, así que no es el aviso de los campos. */
  failedTexts: RetryTexts
}

export function LazyPublishFlow({ waiting, failedTexts, ...props }: Props) {
  const flow = useAfterOpenWithRetry(loadFlow)
  if (flow.value !== null) return <flow.value {...props} />
  if (flow.hasFailed) {
    return (
      <>
        <PetFormTitle>{props.titles.litter}</PetFormTitle>
        <div className="mt-6">
          <RetryNotice texts={failedTexts} onRetry={flow.retry} />
        </div>
      </>
    )
  }
  return waiting
}
