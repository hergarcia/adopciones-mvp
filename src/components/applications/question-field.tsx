'use client'

import type { CountForms } from '@/components/forms/character-count'
import { CountedTextarea } from '@/components/forms/counted-textarea'
import { RadioGroup } from '@/components/ui/radio-group'
import { ANSWER_COUNTER_FROM, ANSWER_MAX_LENGTH } from '@/lib/applications/rules'
import type { FormQuestion } from '@/lib/applications/questionnaire'

export type QuestionTexts = {
  /** De la pregunta propia, «La pregunta de Carla»: la pregunta la escribió quien publicó. */
  label: string
  help?: string
  /** Las opciones en palabras, por clave. */
  options?: Record<string, string>
}

type Props = {
  /** El id del campo: el formulario lleva el foco a la primera que falta. */
  id: string
  question: FormQuestion
  value: string
  onChange: (value: string) => void
  texts: QuestionTexts
  error: string | undefined
  disabled: boolean
  counts: { left: CountForms; over: CountForms }
}

// Una pregunta del cuestionario como un renglón del formulario de papel: casillas para las de
// opciones —en columna la del patio, que tiene cuatro largas— y texto con cuánto queda para las
// demás (FR-021). El campo no deja escribir más de 500. Con un paso por pantalla, la pregunta es
// el contenido del paso, así que va en --text-lg y en tinta. La pregunta propia de quien publicó
// (historia #292) es una abierta más, con su nombre arriba, chico y apagado.
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
        legendSize="lg"
      />
    )
  }

  const field = (
    <CountedTextarea
      id={id}
      name={question.id}
      label={question.kind === 'own' ? question.text : texts.label}
      help={texts.help}
      rows={3}
      value={value}
      max={ANSWER_MAX_LENGTH}
      maxLength={ANSWER_MAX_LENGTH}
      from={ANSWER_COUNTER_FROM}
      error={error}
      disabled={disabled}
      onChange={onChange}
      counts={counts}
      labelSize="lg"
    />
  )
  if (question.kind !== 'own') return field
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-ink-muted">{texts.label}</p>
      {field}
    </div>
  )
}
