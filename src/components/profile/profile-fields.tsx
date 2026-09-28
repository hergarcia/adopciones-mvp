'use client'

import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ZoneFields } from '@/components/zones/zone-fields'
import type { ProfileFieldErrors } from '@/lib/schemas/profile'
import type { ProfileFormTexts, ProfileFormValues } from './profile-form-types'

type Props = {
  texts: ProfileFormTexts
  departments: { value: string; label: string }[]
  localities: readonly string[]
  values: ProfileFormValues
  /** Ya traducido: de dónde salió el nombre, mientras siga siendo ese. */
  nameHint?: string
  /** Ya traducido: que el nombre y la localidad los ve cualquiera y no llevan contacto (FR-021). */
  publicHint: string
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
  nameHint,
  publicHint,
  errorFor,
  onChange,
}: Props) {
  const nameHintId = useId()
  const publicHintId = useId()
  // De dónde salió el nombre primero, porque habla del valor que ya está; lo público después. Lo
  // público se escribe una sola vez, bajo el nombre, y la localidad lo toma de ahí.
  const nameDescribedBy = nameHint ? `${nameHintId} ${publicHintId}` : publicHintId

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-ink-muted">{texts.nameLabel}</span>
          <Input
            name="displayName"
            autoComplete="name"
            placeholder={texts.namePlaceholder}
            value={values.displayName}
            error={errorFor('displayName')}
            aria-describedby={nameDescribedBy}
            onChange={(event) => onChange('displayName', event.target.value)}
          />
        </label>
        {nameHint ? (
          <p id={nameHintId} className="text-sm text-ink-muted">
            {nameHint}
          </p>
        ) : null}
        <p id={publicHintId} className="text-sm text-ink-muted">
          {publicHint}
        </p>
      </div>

      <ZoneFields
        texts={texts}
        departments={departments}
        localities={localities}
        department={values.department}
        locality={values.locality}
        errors={{ department: errorFor('department'), locality: errorFor('locality') }}
        onDepartmentChange={(value) => onChange('department', value)}
        onLocalityChange={(value) => onChange('locality', value)}
        localityDescribedBy={publicHintId}
      />

      <Checkbox
        label={texts.rescuerLabel}
        checked={values.isRescuer}
        onChange={(event) => onChange('isRescuer', event.target.checked)}
      />
    </>
  )
}
