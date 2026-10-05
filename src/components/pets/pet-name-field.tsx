import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { NAME_COUNTER_FROM, NAME_MAX } from '@/lib/pets/rules'
import { CharacterCount } from '@/components/forms/character-count'
import type { CountForms } from './pet-form-types'

type Props = {
  /** Ya traducidos. */
  texts: { label: string; counts: { left: CountForms; over: CountForms } }
  value: string
  error?: string
  id: string
  onChange: (value: string) => void
}

export function PetNameField({ texts, value, error, id, onChange }: Props) {
  const count = useId()

  return (
    <>
      <label className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">{texts.label}</span>
        <Input
          id={id}
          name="name"
          autoComplete="off"
          value={value}
          error={error}
          aria-describedby={count}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <CharacterCount
        id={count}
        value={value}
        max={NAME_MAX}
        from={NAME_COUNTER_FROM}
        texts={texts.counts}
      />
    </>
  )
}
