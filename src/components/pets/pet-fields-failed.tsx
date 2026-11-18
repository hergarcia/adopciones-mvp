'use client'

import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'

type Props = {
  texts: { message: string; retry: string }
  onRetry: () => void
}

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
