'use client'

import { useId } from 'react'
import { CharacterCount, type CountForms } from '@/components/forms/character-count'
import { Textarea } from '@/components/ui/textarea'
import { REPORT_DETAILS_MAX } from '@/lib/moderation/rules'

// El contador aparece cuando faltan 100 para el tope: antes no hace falta mirarlo.
const COUNTER_FROM = REPORT_DETAILS_MAX - 100

type Props = {
  value: string
  onChange: (value: string) => void
  /** Ya traducida: cambia con «Otro», que lo hace obligatorio. */
  label: string
  error: string | undefined
  disabled: boolean
  counts: { left: CountForms; over: CountForms }
}

// El texto del reporte, con cuánto queda (FR-003).
export function ReportDetailsField({ value, onChange, label, error, disabled, counts }: Props) {
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
      <CharacterCount
        id={countId}
        value={value}
        max={REPORT_DETAILS_MAX}
        from={COUNTER_FROM}
        texts={counts}
      />
    </div>
  )
}
