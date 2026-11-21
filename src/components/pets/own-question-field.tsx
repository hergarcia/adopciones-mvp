import { useId } from 'react'
import { CharacterCount } from '@/components/forms/character-count'
import { drawnOnly } from '@/components/ui/deferred'
import { Textarea } from '@/components/ui/textarea'
import { OWN_QUESTION_COUNTER_FROM, OWN_QUESTION_MAX_LENGTH } from '@/lib/applications/rules'
import {
  shownOwnQuestionSuggestions,
  type OwnQuestionSuggestion,
} from '@/lib/pets/own-question-suggestions'
import type { OwnQuestionSuggestionTexts } from './own-question-suggestions'
import type { CountForms } from './pet-form-types'

// Solo quien ya escribió preguntas propias tiene sugerencias (historia #304).
const OwnQuestionSuggestions = drawnOnly(() =>
  import('./own-question-suggestions').then((module) => module.OwnQuestionSuggestions),
)

export type OwnQuestionTexts = {
  label: string
  hint: string
  placeholder: string
  suggestions: OwnQuestionSuggestionTexts
}

type Props = {
  /** Ya traducidos. */
  texts: OwnQuestionTexts & { counts: { left: CountForms; over: CountForms } }
  value: string
  error?: string
  id: string
  /** Las de otras publicaciones de quien publica (historia #300). */
  suggestions: readonly OwnQuestionSuggestion[]
  onChange: (value: string) => void
}

// La pregunta propia de quien publica (historia #292): optativa, sin destacar, con el ejemplo
// adentro y la aclaración de que la ficha no la muestra. Pasarse no corta: el contador dice cuánto
// sobra, como en la descripción.
export function OwnQuestionField({ texts, value, error, id, suggestions, onChange }: Props) {
  const hint = useId()
  const count = useId()

  // La elegida queda en el campo con el foco al final, lista para corregirla; el botón tocado se va.
  function choose(question: string) {
    onChange(question)
    requestAnimationFrame(() => {
      const field = document.getElementById(id)
      if (!(field instanceof HTMLTextAreaElement)) return
      field.focus()
      field.setSelectionRange(question.length, question.length)
    })
  }

  const shown = shownOwnQuestionSuggestions(value, suggestions)
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
      {shown.length === 0 ? null : (
        <OwnQuestionSuggestions texts={texts.suggestions} suggestions={shown} onChoose={choose} />
      )}
    </div>
  )
}
