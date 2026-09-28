'use client'

import { Select } from '@/components/ui/select'
import { MONTEVIDEO } from '@/lib/zones/departments'
import { LocalityField, type LocalityTexts } from './locality-field'

export type ZoneTexts = {
  departmentLabel: string
  departmentPlaceholder: string
  localityLabel: string
  localityLabelMontevideo: string
  locality: LocalityTexts
}

type Props = {
  texts: ZoneTexts
  departments: { value: string; label: string }[]
  localities: readonly string[]
  department: string
  locality: string
  errors: { department?: string; locality?: string }
  /** Para llevar el foco al primer campo con error. */
  ids?: { department?: string; locality?: string }
  onDepartmentChange: (department: string) => void
  onLocalityChange: (locality: string) => void
  /** Ya traducida, solo en el perfil: la localidad la ve cualquiera en el perfil público. */
  localityHint?: string
}

// Departamento de la lista cerrada y localidad con sugerencias, cuya etiqueta cambia: «Barrio» en
// Montevideo, «Localidad» en los otros dieciocho. La misma zona en el perfil y en un animal.
export function ZoneFields({
  texts,
  departments,
  localities,
  department,
  locality,
  errors,
  ids,
  onDepartmentChange,
  onLocalityChange,
  localityHint,
}: Props) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ink-muted">{texts.departmentLabel}</span>
        <Select
          id={ids?.department}
          label={texts.departmentLabel}
          options={departments}
          placeholder={texts.departmentPlaceholder}
          value={department}
          error={errors.department}
          onValueChange={(value) => {
            // Radix vuelve a avisar el valor que ya tiene cuando se lo restaura desde el borrador:
            // eso no es un cambio, y borrar la localidad por eso la perdía al recargar (KL-024).
            if (value === department) return
            onDepartmentChange(value)
            // Cambiar de departamento invalida la localidad: «Pocitos» no existe en Salto.
            onLocalityChange('')
          }}
        />
      </div>

      <LocalityField
        id={ids?.locality}
        texts={{
          ...texts.locality,
          label: department === MONTEVIDEO ? texts.localityLabelMontevideo : texts.localityLabel,
        }}
        localities={localities}
        value={locality}
        error={errors.locality}
        onChange={onLocalityChange}
        publicHint={localityHint}
      />
    </>
  )
}
