'use client'

import type { ComponentProps } from 'react'
import { RetryNotice } from '@/components/ui/retry-notice'
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
}

export function LazyPublishFlow({ waiting, ...props }: Props) {
  const flow = useAfterOpenWithRetry(loadFlow)
  if (flow.value !== null) return <flow.value {...props} />
  if (flow.hasFailed) {
    return (
      <>
        <h1 className="afiche text-2xl text-ink">{props.titles.litter}</h1>
        <div className="mt-6">
          <RetryNotice texts={props.petTexts.fieldsFailed} onRetry={flow.retry} />
        </div>
      </>
    )
  }
  return waiting
}
