'use client'

import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup } from '@/components/ui/radio-group'
import { ZoneFields } from '@/components/zones/zone-fields'
import type { PetFormValues, PetTraitKey } from '@/lib/pets/types'
import type { PetField } from '@/lib/schemas/pet'
import { AgeField } from './age-field'
import { PetDescriptionField } from './pet-description-field'
import { PetFieldGroup } from './pet-field-group'
import { PET_FORM_COLUMN, PET_FORM_COLUMNS } from './pet-form-layout'
import type { PetFieldTexts } from './pet-form-types'

export type TraitField = Exclude<PetField, 'name' | 'sex' | 'requiredLevel'>
export type TraitValues = Pick<PetFormValues, PetTraitKey>

type ChoiceField = Exclude<TraitField, 'age' | 'description' | 'department' | 'locality'>

type Props = {
  texts: PetFieldTexts
  values: TraitValues
  departments: { value: string; label: string }[]
  localities: readonly string[]
  /** Ya traducido, uno por campo. */
  errorFor: (field: TraitField) => string | undefined
  /** El id del control de cada campo, para llevarle el foco al primero con error. */
  idFor: (field: TraitField) => string
  onChange: <K extends PetTraitKey>(key: K, value: PetFormValues[K]) => void
  /** El nombre, primero del primer grupo. */
  name: React.ReactNode
  /** El sexo de un animal, después de la especie; una camada no lo tiene: es de cada cría. */
  sex?: React.ReactNode
  /** Lo que cierra la segunda columna, donde termina de leerse. */
  end?: React.ReactNode
}

// Lo que comparten un animal y una camada (#205): especie, edad, tamaño, salud, convivencia, zona,
// descripción y urgente, en cuatro grupos. Desde 1024 el animal y su salud van a la izquierda; con
// quién convive, dónde está y lo que se agrega, a la derecha, que así termina a la altura de la
// primera.
export function PetTraitsFields({
  texts,
  values,
  departments,
  localities,
  errorFor,
  idFor,
  onChange,
  name,
  sex,
  end,
}: Props) {
  const transitHint = useId()
  const counts = { left: texts.charsLeft, over: texts.charsOver }
  const choice = (field: ChoiceField, legend: string, options: typeof texts.options.yesNo) => (
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
          {name}
          {choice('species', texts.species, texts.options.species)}
          {sex}
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
        {end}
      </div>
    </div>
  )
}
