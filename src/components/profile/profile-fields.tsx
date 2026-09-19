'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { MONTEVIDEO } from '@/lib/zones/departments'
import type { ProfileFieldErrors } from '@/lib/schemas/profile'
import { LocalityField } from './locality-field'
import type { ProfileFormTexts, ProfileFormValues } from './profile-form-types'

type Props = {
  texts: ProfileFormTexts
  departments: { value: string; label: string }[]
  localities: readonly string[]
  values: ProfileFormValues
  errorFor: (field: keyof ProfileFieldErrors) => string | undefined
  onChange: <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => void
}

// Los cuatro campos del perfil, separados del formulario que los coordina: acá está el qué se
// pide, allá el qué pasa al guardar.
export function ProfileFields({
  texts,
  departments,
  localities,
  values,
  errorFor,
  onChange,
}: Props) {
  const isMontevideo = values.department === MONTEVIDEO

  return (
    <>
      <label className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">{texts.nameLabel}</span>
        <Input
          name="displayName"
          autoComplete="name"
          placeholder={texts.namePlaceholder}
          value={values.displayName}
          error={errorFor('displayName')}
          onChange={(event) => onChange('displayName', event.target.value)}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">{texts.departmentLabel}</span>
        <Select
          label={texts.departmentLabel}
          options={departments}
          placeholder={texts.departmentPlaceholder}
          value={values.department}
          error={errorFor('department')}
          onValueChange={(value) => {
            onChange('department', value)
            // Cambiar de departamento invalida la localidad: «Pocitos» no existe en Salto.
            onChange('locality', '')
          }}
        />
      </div>

      <LocalityField
        texts={{
          ...texts.locality,
          label: isMontevideo ? texts.localityLabelMontevideo : texts.localityLabel,
        }}
        localities={localities}
        value={values.locality}
        error={errorFor('locality')}
        onChange={(value) => onChange('locality', value)}
      />

      <Checkbox
        label={texts.rescuerLabel}
        checked={values.isRescuer}
        onChange={(event) => onChange('isRescuer', event.target.checked)}
      />
    </>
  )
}
