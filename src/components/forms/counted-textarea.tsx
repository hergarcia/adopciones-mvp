'use client'

import { useId } from 'react'
import { CharacterCount, type CountForms } from './character-count'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  value: string
  onChange: (value: string) => void
  /** Ya traducida. */
  label: string
  /** Ya traducida: lo que hace falta saber para contestar, debajo de la etiqueta. */
  help?: string
  error: string | undefined
  disabled: boolean
  max: number
  /** Desde cuántos caracteres aparece la cuenta: antes no hace falta mirarla. */
  from: number
  counts: { left: CountForms; over: CountForms }
  /** El del campo cuando otro lo busca para llevarle el foco. */
  id?: string
  name?: string
  /** El tope que el campo no deja pasar; sin él se puede escribir de más y la cuenta dice cuánto. */
  maxLength?: number
  rows?: number
}

// Un texto largo con su etiqueta y cuánto queda: el del reporte, el motivo de una suspensión
// (historia #13, Edge Cases «Texto de 1000 caracteres») y las preguntas abiertas del cuestionario.
export function CountedTextarea({
  value,
  onChange,
  label,
  help,
  error,
  disabled,
  max,
  from,
  counts,
  id,
  name,
  maxLength,
  rows = 4,
}: Props) {
  const ownId = useId()
  const helpId = useId()
  const countId = useId()
  const fieldId = id ?? ownId
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="text-sm text-ink-muted">
        {label}
      </label>
      {help ? (
        <p id={helpId} className="text-sm text-ink-muted">
          {help}
        </p>
      ) : null}
      <Textarea
        id={fieldId}
        name={name}
        rows={rows}
        value={value}
        maxLength={maxLength}
        error={error}
        aria-describedby={help ? `${helpId} ${countId}` : countId}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <CharacterCount id={countId} value={value} max={max} from={from} texts={counts} />
    </div>
  )
}
