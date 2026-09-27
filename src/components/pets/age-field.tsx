import { useId } from 'react'
import { ErrorText } from '@/components/ui/error-text'
import { Input } from '@/components/ui/input'
import { RadioGroup, type RadioOption } from '@/components/ui/radio-group'

type Props = {
  texts: { label: string; value: string; unit: string }
  units: RadioOption[]
  value: string
  unit: string
  /** Ya traducido: uno solo para la fila, debajo de las dos partes. */
  error?: string
  inputId: string
  onValueChange: (value: string) => void
  onUnitChange: (unit: string) => void
}

// La edad aproximada: el número y, aparte, la unidad, en una fila (FR-010).
export function AgeField({
  texts,
  units,
  value,
  unit,
  error,
  inputId,
  onValueChange,
  onUnitChange,
}: Props) {
  const errorId = useId()

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-ink-muted">{texts.label}</span>
      <div className="flex flex-wrap items-end gap-4">
        <Input
          id={inputId}
          aria-label={texts.value}
          inputMode="numeric"
          autoComplete="off"
          className="w-20"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onValueChange(event.target.value)}
        />
        <RadioGroup
          legend={texts.unit}
          name="ageUnit"
          options={units}
          value={unit}
          onChange={onUnitChange}
          className="[&>legend]:sr-only"
        />
      </div>
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  )
}
