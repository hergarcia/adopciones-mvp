'use client'

import { RetryNotice } from '@/components/ui/retry-notice'
import { useAfterOpenWithRetry } from '@/hooks/use-after-open'
import { PetFieldsSkeleton } from './pet-fields-skeleton'

type Fields = typeof import('./pet-form-fields')

// Los campos y la tirita no los dibuja el servidor: despiertos después, perdían el toque y lo escrito
// antes de despertar, y al abrir no entran en los 150 KB (historia #304). Llegan apenas abre la
// pantalla.
const loadFields = () => import('./pet-form-fields')

type Props = {
  failedTexts: { message: string; retry: string }
  children: (fields: Fields) => React.ReactNode
}

export function PetFieldsSlot({ failedTexts, children }: Props) {
  const fields = useAfterOpenWithRetry(loadFields)
  if (fields.value !== null) return children(fields.value)
  if (fields.hasFailed) return <RetryNotice texts={failedTexts} onRetry={fields.retry} />
  return <PetFieldsSkeleton />
}
