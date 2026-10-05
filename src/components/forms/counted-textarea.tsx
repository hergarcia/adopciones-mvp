'use client'

import { useId } from 'react'
import { CharacterCount, type CountForms } from './character-count'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  value: string
  onChange: (value: string) => void
  /** Ya traducida. */
  label: string
  error: string | undefined
  disabled: boolean
  max: number
  /** Desde cuántos caracteres aparece la cuenta: antes no hace falta mirarla. */
  from: number
  counts: { left: CountForms; over: CountForms }
}

// Un texto largo con su etiqueta y cuánto queda: el del reporte y el motivo de una suspensión
// (historia #13, Edge Cases «Texto de 1000 caracteres»).
export function CountedTextarea({
  value,
  onChange,
  label,
  error,
  disabled,
  max,
  from,
  counts,
}: Props) {
  const id = useId()
  const countId = useId()
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-ink-muted">
        {label}
      </label>
      <Textarea
        id={id}
        rows={4}
        value={value}
        error={error}
        aria-describedby={countId}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <CharacterCount id={countId} value={value} max={max} from={from} texts={counts} />
    </div>
  )
}
