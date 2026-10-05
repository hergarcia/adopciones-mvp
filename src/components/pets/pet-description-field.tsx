import { useId } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { DESCRIPTION_COUNTER_FROM, DESCRIPTION_MAX } from '@/lib/pets/rules'
import { CharacterCount } from '@/components/forms/character-count'
import type { CountForms } from './pet-form-types'

type Props = {
  /** Ya traducidos. */
  texts: { label: string; hint: string; counts: { left: CountForms; over: CountForms } }
  value: string
  error?: string
  id: string
  onChange: (value: string) => void
}

// El aviso de no poner contacto va antes de escribir, no después, y el campo lo lee junto con el
// contador.
export function PetDescriptionField({ texts, value, error, id, onChange }: Props) {
  const hint = useId()
  const count = useId()

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-ink-muted">
        {texts.label}
      </label>
      <p id={hint} className="text-sm text-ink-muted">
        {texts.hint}
      </p>
      <Textarea
        id={id}
        name="description"
        rows={5}
        value={value}
        error={error}
        aria-describedby={`${hint} ${count}`}
        onChange={(event) => onChange(event.target.value)}
      />
      <CharacterCount
        id={count}
        value={value}
        max={DESCRIPTION_MAX}
        from={DESCRIPTION_COUNTER_FROM}
        texts={texts.counts}
      />
    </div>
  )
}
