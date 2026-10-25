'use client'

import { useId } from 'react'
import { Button } from '@/components/ui/button'

type Props = {
  /** Ya traducidos. */
  texts: { add: string; max: string }
  full: boolean
  disabled: boolean
  onAdd: () => void
}

// Con 10 crías no agrega otra y dice por qué, al lado del botón (US1-AS5).
export function AddYoungButton({ texts, full, disabled, onAdd }: Props) {
  const why = useId()
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secondary"
        disabled={disabled || full}
        aria-describedby={full ? why : undefined}
        onClick={onAdd}
      >
        {texts.add}
      </Button>
      {full ? (
        <p id={why} className="text-sm text-ink-muted">
          {texts.max}
        </p>
      ) : null}
    </div>
  )
}
