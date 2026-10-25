import { useId } from 'react'
import { Input } from '@/components/ui/input'

type Props = {
  /** Ya traducidos. */
  texts: { label: string; hint: string }
  /** `AAAA-MM-DD`, o vacío. */
  value: string
  /** El día de hoy en Uruguay: el calendario no ofrece días pasados (FR-013). */
  min: string
  error?: string
  id: string
  onChange: (value: string) => void
}

// «Desde cuándo se entregan», opcional: el calendario del teléfono, sin librería. Una fecha pasada
// igual se puede escribir a mano, y la rechaza el schema.
export function DeliveryDateField({ texts, value, min, error, id, onChange }: Props) {
  const hint = useId()
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-ink-muted">
        {texts.label}
      </label>
      <p id={hint} className="text-sm text-ink-muted">
        {texts.hint}
      </p>
      <Input
        id={id}
        type="date"
        name="deliversFrom"
        value={value}
        min={min}
        error={error}
        aria-describedby={hint}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
