'use client'

import { RadioGroup, type RadioOption } from '@/components/ui/radio-group'

export type RequiredLevelTexts = {
  legend: string
  options: RadioOption[]
  /** Por valor: qué quiere decir la opción elegida. */
  help: Record<string, string>
  /** Solo al editar: el cambio no toca lo que ya llegó. */
  editNote: string | null
}

type Props = {
  texts: RequiredLevelTexts
  value: string
  id: string
  error?: string
  onChange: (value: string) => void
}

// «Quién puede solicitar» (research R9): arranca en teléfono verificado; debajo, qué significa lo
// elegido y, al editar, que vale para las solicitudes nuevas (FR-013).
export function RequiredLevelField({ texts, value, id, error, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        id={id}
        legend={texts.legend}
        name="requiredLevel"
        orientation="column"
        options={texts.options}
        value={value}
        error={error}
        onChange={onChange}
      />
      <p className="text-sm text-ink-muted">{texts.help[value]}</p>
      {texts.editNote === null ? null : <p className="text-sm text-ink-muted">{texts.editNote}</p>}
    </div>
  )
}
