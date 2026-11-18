'use client'

import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'

type Props = {
  texts: { message: string; retry: string }
  onRetry: () => void
}

// En lugar de los campos de un animal cuando no llegaron después de abrir: lo elegido y lo escrito
// siguen en el formulario, y «Reintentar» los vuelve a pedir (historia #304).
export function PetFieldsFailed({ texts, onRetry }: Props) {
  return (
    <div className="flex max-w-[var(--measure)] flex-col items-start gap-3">
      <ErrorText announce>{texts.message}</ErrorText>
      <Button variant="secondary" onClick={onRetry}>
        {texts.retry}
      </Button>
    </div>
  )
}
