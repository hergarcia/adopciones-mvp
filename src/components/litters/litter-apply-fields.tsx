'use client'

import { DeliveryDateField } from '@/components/forms/delivery-date-field'
import { RequiredLevelField, type RequiredLevelTexts } from '@/components/pets/required-level-field'

type Props = {
  /** Ya traducidos. */
  texts: {
    group: string
    requiredLevel: RequiredLevelTexts
    deliversFrom: { label: string; hint: string }
  }
  values: { requiredLevel: string; deliversFrom: string }
  /** Ya traducidos. */
  errors: { requiredLevel?: string; deliversFrom?: string }
  ids: { requiredLevel: string; deliversFrom: string }
  /** El día de hoy en Uruguay. */
  today: string
  onChange: (key: 'requiredLevel' | 'deliversFrom', value: string) => void
  /** La tirita y lo que no es de ningún campo. */
  footer: React.ReactNode
}

// El pie de la camada: quién puede pedir una cría (FR-014) y desde cuándo se entregan (FR-013).
// Valen para todas las crías.
export function LitterApplyFields({ texts, values, errors, ids, today, onChange, footer }: Props) {
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
      {footer}
    </section>
  )
}
