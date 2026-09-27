'use client'

import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { RadioGroup } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { ZoneFields } from '@/components/zones/zone-fields'
import {
  DESCRIPTION_COUNTER_FROM,
  DESCRIPTION_MAX,
  NAME_COUNTER_FROM,
  NAME_MAX,
} from '@/lib/pets/rules'
import type { PetFormValues } from '@/lib/pets/types'
import type { PetField } from '@/lib/schemas/pet'
import { AgeField } from './age-field'
import { CharacterCount } from './character-count'
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
}

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-6">
      <legend className="mb-4 text-lg font-bold text-ink">{legend}</legend>
      {children}
    </fieldset>
  )
}

// Qué se pide, separado de qué pasa al guardar (como `ProfileFields`): cuatro grupos y, al pie, la
// descripción con su aviso de contacto antes de escribir y la marca de urgente.
export function PetFields({
  texts,
  values,
  departments,
  localities,
  errorFor,
  idFor,
  onChange,
}: Props) {
  const nameCount = useId()
  const descriptionHint = useId()
  const descriptionCount = useId()
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
    <div className="flex flex-col gap-8">
      <Group legend={texts.groups.animal}>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-ink-muted">{texts.name}</span>
          <Input
            id={idFor('name')}
            name="name"
            autoComplete="off"
            value={values.name}
            error={errorFor('name')}
            aria-describedby={nameCount}
            onChange={(event) => onChange('name', event.target.value)}
          />
        </label>
        <CharacterCount
          id={nameCount}
          value={values.name}
          max={NAME_MAX}
          from={NAME_COUNTER_FROM}
          texts={counts}
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
      </Group>

      <Group legend={texts.groups.health}>
        {choice('isNeutered', texts.neutered, texts.options.yesNo)}
        {choice('vaccines', texts.vaccines, texts.options.vaccines)}
        {choice('hasChip', texts.chip, texts.options.yesNo)}
      </Group>

      <Group legend={texts.groups.livesWith}>
        {choice('goodWithKids', texts.kids, texts.options.goodWith)}
        {choice('goodWithDogs', texts.dogs, texts.options.goodWith)}
        {choice('goodWithCats', texts.cats, texts.options.goodWith)}
      </Group>

      <Group legend={texts.groups.where}>
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
      </Group>

      <div className="flex flex-col gap-2">
        <label htmlFor={idFor('description')} className="text-sm text-ink-muted">
          {texts.description}
        </label>
        <p id={descriptionHint} className="text-sm text-ink-muted">
          {texts.descriptionHint}
        </p>
        <Textarea
          id={idFor('description')}
          name="description"
          rows={5}
          value={values.description}
          error={errorFor('description')}
          aria-describedby={`${descriptionHint} ${descriptionCount}`}
          onChange={(event) => onChange('description', event.target.value)}
        />
        <CharacterCount
          id={descriptionCount}
          value={values.description}
          max={DESCRIPTION_MAX}
          from={DESCRIPTION_COUNTER_FROM}
          texts={counts}
        />
      </div>

      <Checkbox
        label={texts.urgent}
        checked={values.isUrgent}
        onChange={(event) => onChange('isUrgent', event.target.checked)}
      />
    </div>
  )
}
