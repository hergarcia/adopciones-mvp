import { useId } from 'react'
import { CharacterCount } from '@/components/forms/character-count'
import { Textarea } from '@/components/ui/textarea'
import { OWN_QUESTION_COUNTER_FROM, OWN_QUESTION_MAX_LENGTH } from '@/lib/applications/rules'
import type { CountForms } from './pet-form-types'

export type OwnQuestionTexts = { label: string; hint: string; placeholder: string }

type Props = {
  /** Ya traducidos. */
  texts: OwnQuestionTexts & { counts: { left: CountForms; over: CountForms } }
  value: string
  error?: string
  id: string
  onChange: (value: string) => void
}

// La pregunta propia de quien publica (historia #292): optativa, sin destacar, con el ejemplo
// adentro y la aclaración de que la ficha no la muestra. Pasarse no corta: el contador dice cuánto
// sobra, como en la descripción.
export function OwnQuestionField({ texts, value, error, id, onChange }: Props) {
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
        name="ownQuestion"
        rows={3}
        value={value}
        placeholder={texts.placeholder}
        error={error}
        aria-describedby={`${hint} ${count}`}
        onChange={(event) => onChange(event.target.value)}
      />
      <CharacterCount
        id={count}
        value={value}
        max={OWN_QUESTION_MAX_LENGTH}
        from={OWN_QUESTION_COUNTER_FROM}
        texts={texts.counts}
      />
    </div>
  )
}
