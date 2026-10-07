'use client'

import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup } from '@/components/ui/radio-group'
import { ZoneFields } from '@/components/zones/zone-fields'
import type { PetFormValues } from '@/lib/pets/types'
import type { PetField } from '@/lib/schemas/pet'
import { AgeField } from './age-field'
import { PetDescriptionField } from './pet-description-field'
import { PetFieldGroup } from './pet-field-group'
import { PetNameField } from './pet-name-field'
import { PET_FORM_COLUMN, PET_FORM_COLUMNS } from './pet-form-layout'
import { RequiredLevelField } from './required-level-field'
import type { PetFieldTexts } from './pet-form-types'

type Props = {
  texts: PetFieldTexts
  values: PetFormValues
  departments: { value: string; label: string }[]
  localities: readonly string[]
  /** Ya traducido, uno por campo. */
  errorFor: (field: PetField) => string | undefined
  /** El id del control de cada campo, para llevarle el foco al primero con error. */
  idFor: (field: PetField) => string
  onChange: <K extends keyof PetFormValues>(key: K, value: PetFormValues[K]) => void
  /** Lo que cierra el formulario: al final de la segunda columna, donde termina de leerse. */
  footer: React.ReactNode
}

// Qué se pide, separado de qué pasa al guardar (como `ProfileFields`): cuatro grupos y, al pie, la
// descripción con su aviso de contacto antes de escribir, la marca de urgente y quién puede solicitar. Desde 1024 el
// animal y su salud van a la izquierda; con quién convive, dónde está y lo que se agrega, a la
// derecha, que así termina a la altura de la primera.
export function PetFields({
  texts,
  values,
  departments,
  localities,
  errorFor,
  idFor,
  onChange,
  footer,
}: Props) {
  const transitHint = useId()
  const counts = { left: texts.charsLeft, over: texts.charsOver }
  const choice = (
    field: PetField & keyof PetFormValues,
    legend: string,
    options: typeof texts.options.yesNo,
  ) => (
    <RadioGroup
      id={idFor(field)}
      legend={legend}
      name={field}
      options={options}
      value={values[field]}
      error={errorFor(field)}
      onChange={(value) => onChange(field, value)}
    />
  )

  return (
    <div className={PET_FORM_COLUMNS}>
      <div className={PET_FORM_COLUMN}>
        <PetFieldGroup legend={texts.groups.animal}>
          <PetNameField
            texts={{ label: texts.name, counts }}
            value={values.name}
            error={errorFor('name')}
            id={idFor('name')}
            onChange={(value) => onChange('name', value)}
          />
          {choice('species', texts.species, texts.options.species)}
          {choice('sex', texts.sex, texts.options.sex)}
          <AgeField
            texts={{ label: texts.age, value: texts.ageValue, unit: texts.ageUnit }}
            units={texts.options.ageUnit}
            value={values.ageValue}
            unit={values.ageUnit}
            error={errorFor('age')}
            inputId={idFor('age')}
            onValueChange={(value) => onChange('ageValue', value)}
            onUnitChange={(unit) => onChange('ageUnit', unit)}
          />
          {choice('size', texts.size, texts.options.size)}
        </PetFieldGroup>

        <PetFieldGroup legend={texts.groups.health}>
          {choice('isNeutered', texts.neutered, texts.options.yesNo)}
          {choice('vaccines', texts.vaccines, texts.options.vaccines)}
          {choice('hasChip', texts.chip, texts.options.yesNo)}
        </PetFieldGroup>
      </div>

      <div className={PET_FORM_COLUMN}>
        <PetFieldGroup legend={texts.groups.livesWith}>
          {choice('goodWithKids', texts.kids, texts.options.goodWith)}
          {choice('goodWithDogs', texts.dogs, texts.options.goodWith)}
          {choice('goodWithCats', texts.cats, texts.options.goodWith)}
        </PetFieldGroup>

        <PetFieldGroup legend={texts.groups.where}>
          <ZoneFields
            texts={texts.zone}
            departments={departments}
            localities={localities}
            department={values.department}
            locality={values.locality}
            errors={{ department: errorFor('department'), locality: errorFor('locality') }}
            ids={{ department: idFor('department'), locality: idFor('locality') }}
            onDepartmentChange={(value) => onChange('department', value)}
            onLocalityChange={(value) => onChange('locality', value)}
          />
          <p id={transitHint} className="-mt-4 text-sm text-ink-muted">
            {texts.transitHint}
          </p>
        </PetFieldGroup>

        <PetDescriptionField
          texts={{ label: texts.description, hint: texts.descriptionHint, counts }}
          value={values.description}
          error={errorFor('description')}
          id={idFor('description')}
          onChange={(value) => onChange('description', value)}
        />

        <Checkbox
          label={texts.urgent}
          checked={values.isUrgent}
          onChange={(event) => onChange('isUrgent', event.target.checked)}
        />
        <RequiredLevelField
          texts={texts.requiredLevel}
          value={values.requiredLevel}
          id={idFor('requiredLevel')}
          error={errorFor('requiredLevel')}
          onChange={(value) => onChange('requiredLevel', value)}
        />
        {footer}
      </div>
    </div>
  )
}
