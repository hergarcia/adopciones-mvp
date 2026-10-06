'use client'

import { useId } from 'react'
import { CharacterCount, type CountForms } from '@/components/forms/character-count'
import { RadioGroup } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { ANSWER_COUNTER_FROM, ANSWER_MAX_LENGTH } from '@/lib/applications/rules'
import type { Question } from '@/lib/applications/questionnaire'

export type QuestionTexts = {
  label: string
  help?: string
  /** Las opciones en palabras, por clave. */
  options?: Record<string, string>
}

type Props = {
  /** El id del campo: el formulario lleva el foco a la primera que falta. */
  id: string
  question: Question
  value: string
  onChange: (value: string) => void
  texts: QuestionTexts
  error: string | undefined
  disabled: boolean
  counts: { left: CountForms; over: CountForms }
}

// Una pregunta del cuestionario como un renglón del formulario de papel: casillas para las de
// opciones —en columna la del patio, que tiene cuatro largas— y texto con cuánto queda para las
// demás (FR-021). El campo no deja escribir más de 500.
export function QuestionField({
  id,
  question,
  value,
  onChange,
  texts,
  error,
  disabled,
  counts,
}: Props) {
  const helpId = useId()
  const countId = useId()

  if (question.kind === 'choice') {
    return (
      <RadioGroup
        id={id}
        name={question.id}
        legend={texts.label}
        options={question.options.map((option) => ({
          value: option,
          label: texts.options?.[option] ?? option,
        }))}
        value={value}
        onChange={onChange}
        error={error}
        disabled={disabled}
        orientation={question.orientation}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-ink-muted">
        {texts.label}
      </label>
      {texts.help ? (
        <p id={helpId} className="text-sm text-ink-muted">
          {texts.help}
        </p>
      ) : null}
      <Textarea
        id={id}
        name={question.id}
        rows={3}
        value={value}
        maxLength={ANSWER_MAX_LENGTH}
        error={error}
        aria-describedby={texts.help ? `${helpId} ${countId}` : countId}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <CharacterCount
        id={countId}
        value={value}
        max={ANSWER_MAX_LENGTH}
        from={ANSWER_COUNTER_FROM}
        texts={counts}
      />
    </div>
  )
}
