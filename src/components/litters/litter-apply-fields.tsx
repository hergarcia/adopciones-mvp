'use client'

import { DeliveryDateField } from '@/components/forms/delivery-date-field'
import { OwnQuestionField, type OwnQuestionTexts } from '@/components/pets/own-question-field'
import type { CountForms } from '@/components/pets/pet-form-types'
import { RequiredLevelField, type RequiredLevelTexts } from '@/components/pets/required-level-field'
import type { OwnQuestionSuggestion } from '@/lib/pets/own-question-suggestions'

type ApplyField = 'requiredLevel' | 'deliversFrom' | 'ownQuestion'

type Props = {
  /** Ya traducidos. */
  texts: {
    group: string
    requiredLevel: RequiredLevelTexts
    deliversFrom: { label: string; hint: string }
    ownQuestion: OwnQuestionTexts & { counts: { left: CountForms; over: CountForms } }
  }
  values: Record<ApplyField, string>
  /** Ya traducidos. */
  errors: Partial<Record<ApplyField, string>>
  ids: Record<ApplyField, string>
  /** El día de hoy en Uruguay. */
  today: string
  ownQuestions: readonly OwnQuestionSuggestion[]
  onChange: (key: ApplyField, value: string) => void
  /** La tirita y lo que no es de ningún campo. */
  footer: React.ReactNode
}

// El pie de la camada: quién puede pedir una cría (FR-014), desde cuándo se entregan (FR-013) y qué
// le pregunta a quien la solicite (historia #292). Valen para todas las crías.
export function LitterApplyFields({
  texts,
  values,
  errors,
  ids,
  today,
  ownQuestions,
  onChange,
  footer,
}: Props) {
  return (
    <section className="flex max-w-[var(--measure)] flex-col gap-6">
      <h2 className="text-xl font-bold text-ink">{texts.group}</h2>
      <RequiredLevelField
        texts={texts.requiredLevel}
        value={values.requiredLevel}
        id={ids.requiredLevel}
        error={errors.requiredLevel}
        onChange={(value) => onChange('requiredLevel', value)}
      />
      <DeliveryDateField
        texts={texts.deliversFrom}
        value={values.deliversFrom}
        min={today}
        error={errors.deliversFrom}
        id={ids.deliversFrom}
        onChange={(value) => onChange('deliversFrom', value)}
      />
      <OwnQuestionField
        texts={texts.ownQuestion}
        value={values.ownQuestion}
        error={errors.ownQuestion}
        id={ids.ownQuestion}
        suggestions={ownQuestions}
        onChange={(value) => onChange('ownQuestion', value)}
      />
      {footer}
    </section>
  )
}
