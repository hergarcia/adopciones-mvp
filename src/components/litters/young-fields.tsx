'use client'

import { CountedTextarea } from '@/components/forms/counted-textarea'
import { PetNameField } from '@/components/pets/pet-name-field'
import { PetPhotosField } from '@/components/pets/pet-photos-field'
import { Button } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import type { PetPhotoList } from '@/hooks/use-pet-photos'
import { YOUNG_DESCRIPTION_COUNTER_FROM, YOUNG_DESCRIPTION_MAX } from '@/lib/litters/rules'
import type { YoungFormValues } from '@/lib/litters/types'
import type { YoungField } from '@/lib/schemas/litter'
import type { YoungTexts } from './litter-form-types'

type Props = {
  texts: YoungTexts
  young: YoungFormValues
  photos: PetPhotoList
  /** Por clave de error, en crudo: el motivo de cada foto que no entró. */
  photoErrors: Record<string, string>
  /** Ya traducido, uno por campo. */
  errorFor: (field: YoungField) => string | undefined
  idFor: (field: YoungField | 'photos') => string
  disabled: boolean
  onChange: (key: 'name' | 'sex' | 'description', value: string) => void
  onPickPhotos: (files: File[]) => void
  onMovePhoto: (key: string, step: -1 | 1) => void
  onMakeCover: (key: string) => void
  onRemovePhoto: (key: string) => void
  onRemove: () => void
}

// Lo propio de una cría (FR-006): nombre, sexo, una descripción corta y sus fotos, si tiene. El
// título es su nombre, así el error que se marca en una cría dice en cuál. Quitarla es inmediato en
// pantalla; al editar, guardar avisa antes si eso cierra solicitudes (`RemoveYoungDialog`).
export function YoungFields({
  texts,
  young,
  photos,
  photoErrors,
  errorFor,
  idFor,
  disabled,
  onChange,
  onPickPhotos,
  onMovePhoto,
  onMakeCover,
  onRemovePhoto,
  onRemove,
}: Props) {
  const title = young.name.trim() === '' ? texts.unnamed : young.name.trim()
  const counts = { left: texts.charsLeft, over: texts.charsOver }
  return (
    <fieldset className="flex min-w-0 flex-col gap-6 border-2 border-line p-4">
      <legend className="px-1 text-lg font-bold break-words text-ink">{title}</legend>
      <PetNameField
        texts={{ label: texts.name, counts }}
        value={young.name}
        error={errorFor('name')}
        id={idFor('name')}
        onChange={(value) => onChange('name', value)}
      />
      <RadioGroup
        id={idFor('sex')}
        legend={texts.sex}
        name={`sex-${young.key}`}
        options={texts.sexOptions}
        value={young.sex}
        error={errorFor('sex')}
        onChange={(value) => onChange('sex', value)}
      />
      <CountedTextarea
        id={idFor('description')}
        label={texts.description}
        value={young.description}
        error={errorFor('description')}
        disabled={disabled}
        max={YOUNG_DESCRIPTION_MAX}
        from={YOUNG_DESCRIPTION_COUNTER_FROM}
        counts={counts}
        rows={3}
        onChange={(value) => onChange('description', value)}
      />
      <div className="flex flex-col gap-2">
        <p className="text-sm text-ink-muted">{texts.photosHint}</p>
        <PetPhotosField
          compact
          texts={{ ...texts.photos, legend: texts.photos.legend.replace('{name}', title) }}
          list={photos}
          errors={photoErrors}
          inputId={idFor('photos')}
          disabled={disabled}
          onPick={onPickPhotos}
          onMove={onMovePhoto}
          onMakeCover={onMakeCover}
          onRemove={onRemovePhoto}
        />
      </div>
      <Button
        variant="ghost-danger"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={onRemove}
      >
        {texts.remove}
      </Button>
    </fieldset>
  )
}
