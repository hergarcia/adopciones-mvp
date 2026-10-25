'use client'

import { ErrorText } from '@/components/ui/error-text'
import type { LitterPhotos } from '@/hooks/use-litter-photos'
import { YOUNG_MAX } from '@/lib/litters/rules'
import type { YoungFormValues } from '@/lib/litters/types'
import type { YoungField } from '@/lib/schemas/litter'
import { AddYoungButton } from './add-young-button'
import type { YoungTexts } from './litter-form-types'
import { YoungFields } from './young-fields'

type Props = {
  texts: YoungTexts
  young: YoungFormValues[]
  photos: LitterPhotos
  photoErrors: Record<string, string>
  /** Ya traducido: el error de una cría en un campo. */
  errorFor: (key: string, field: YoungField) => string | undefined
  /** Ya traducido: menos crías de las que hacen falta, o más de 10. */
  countError?: string
  idFor: (key: string, field: YoungField | 'photos') => string
  listId: string
  disabled: boolean
  onChange: (key: string, field: 'name' | 'sex' | 'description', value: string) => void
  onPickPhotos: (key: string, files: File[]) => void
  onAdd: () => void
  onRemove: (key: string) => void
}

export function YoungList({
  texts,
  young,
  photos,
  photoErrors,
  errorFor,
  countError,
  idFor,
  listId,
  disabled,
  onChange,
  onPickPhotos,
  onAdd,
  onRemove,
}: Props) {
  return (
    <section aria-labelledby={listId} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 id={listId} tabIndex={-1} className="text-xl font-bold text-ink">
          {texts.group}
        </h2>
        <p className="text-sm text-ink-muted">
          {texts.count.replace('{count}', String(young.length))}
        </p>
      </div>
      {countError ? <ErrorText announce>{countError}</ErrorText> : null}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {young.map((one) => (
          <YoungFields
            key={one.key}
            texts={texts}
            young={one}
            photos={photos.listOf(one.key)}
            photoErrors={photoErrors}
            errorFor={(field) => errorFor(one.key, field)}
            idFor={(field) => idFor(one.key, field)}
            disabled={disabled}
            onChange={(field, value) => onChange(one.key, field, value)}
            onPickPhotos={(files) => onPickPhotos(one.key, files)}
            onMovePhoto={(key, step) => photos.move(one.key, key, step)}
            onMakeCover={(key) => photos.makeCover(one.key, key)}
            onRemovePhoto={(key) => photos.remove(one.key, key)}
            onRemove={() => onRemove(one.key)}
          />
        ))}
      </div>
      <AddYoungButton
        texts={texts}
        full={young.length >= YOUNG_MAX}
        disabled={disabled}
        onAdd={onAdd}
      />
    </section>
  )
}
