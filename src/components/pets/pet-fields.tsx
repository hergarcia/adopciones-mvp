'use client'

import { RadioGroup } from '@/components/ui/radio-group'
import type { PetFormValues } from '@/lib/pets/types'
import type { PetField } from '@/lib/schemas/pet'
import { PetNameField } from './pet-name-field'
import { PetTraitsFields } from './pet-traits-fields'
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

// Qué se pide de un animal, separado de qué pasa al guardar (como `ProfileFields`): lo que comparte
// con una camada, más su nombre, su sexo y, al pie, quién puede solicitarlo.
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
  const counts = { left: texts.charsLeft, over: texts.charsOver }
  return (
    <PetTraitsFields
      texts={texts}
      values={values}
      departments={departments}
      localities={localities}
      errorFor={errorFor}
      idFor={idFor}
      onChange={onChange}
      name={
        <PetNameField
          texts={{ label: texts.name, counts }}
          value={values.name}
          error={errorFor('name')}
          id={idFor('name')}
          onChange={(value) => onChange('name', value)}
        />
      }
      sex={
        <RadioGroup
          id={idFor('sex')}
          legend={texts.sex}
          name="sex"
          options={texts.options.sex}
          value={values.sex}
          error={errorFor('sex')}
          onChange={(value) => onChange('sex', value)}
        />
      }
      end={
        <>
          <RequiredLevelField
            texts={texts.requiredLevel}
            value={values.requiredLevel}
            id={idFor('requiredLevel')}
            error={errorFor('requiredLevel')}
            onChange={(value) => onChange('requiredLevel', value)}
          />
          {footer}
        </>
      }
    />
  )
}
