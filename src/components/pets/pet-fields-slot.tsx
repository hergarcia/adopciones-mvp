'use client'

import { RetryNotice } from '@/components/ui/retry-notice'
import { useAfterOpenWithRetry } from '@/hooks/use-after-open-with-retry'
import { PetFieldsSkeleton } from './pet-fields-skeleton'

type Props<M> = {
  /**
   * Los campos y la tirita de un animal o de una camada. No los dibuja el servidor: despiertos
   * después, perdían el toque y lo escrito antes de despertar, y al abrir no entran en los 150 KB
   * (historias #304 y #338). Llegan apenas abre la pantalla.
   */
  load: () => Promise<M>
  failedTexts: { message: string; retry: string }
  children: (fields: M) => React.ReactNode
}

export function PetFieldsSlot<M>({ load, failedTexts, children }: Props<M>) {
  const fields = useAfterOpenWithRetry(load)
  if (fields.value !== null) return children(fields.value)
  if (fields.hasFailed) return <RetryNotice texts={failedTexts} onRetry={fields.retry} />
  return <PetFieldsSkeleton />
}
