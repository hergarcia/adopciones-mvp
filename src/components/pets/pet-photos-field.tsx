'use client'

import { ErrorText } from '@/components/ui/error-text'
import { Skeleton } from '@/components/ui/skeleton'
import type { PetPhotoList } from '@/hooks/use-pet-photos'
import { ACCEPTED_PHOTO_TYPES } from '@/lib/images/photo-file'
import { MAX_PHOTOS } from '@/lib/pets/rules'
import { cn } from '@/lib/cn'
import { countText, type PetPhotosTexts } from './pet-form-types'
import { PetPhotoTile } from './pet-photo-tile'

type Props = {
  texts: PetPhotosTexts
  list: PetPhotoList
  /** Por clave de error, en crudo: el motivo de cada foto que no entró. */
  errors: Record<string, string>
  /** Ya traducido: el del campo entero, como «Agregá al menos una foto». */
  error?: string
  inputId: string
  disabled: boolean
  onPick: (files: File[]) => void
  onMove: (key: string, step: -1 | 1) => void
  onMakeCover: (key: string) => void
  onRemove: (key: string) => void
}

function PickInput({
  id,
  onPick,
  disabled,
}: {
  id: string
  onPick: (files: File[]) => void
  disabled: boolean
}) {
  return (
    <input
      id={id}
      type="file"
      multiple
      accept={ACCEPTED_PHOTO_TYPES.join(',')}
      disabled={disabled}
      className="sr-only"
      onChange={(event) => {
        onPick(Array.from(event.target.files ?? []))
        event.target.value = ''
      }}
    />
  )
}

const ADD =
  'flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 border-2 border-ink bg-surface p-4 text-center transition-colors duration-[var(--dur-fast)] ease-out hover:bg-canvas has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus'

// Las fotos en el orden en que se van a publicar, en 1:1 como se ordenan y se comparan (docs/10:
// thumbs 1:1). Vacía, la invitación a la primera foto ocupa el ancho; con fotos, el casillero para
// agregar cierra la grilla mientras haya lugar. Una rechazada no ocupa casillero: su motivo va
// debajo, con el nombre del archivo, que se muestra acá y nunca se manda.
export function PetPhotosField({
  texts,
  list,
  errors,
  error,
  inputId,
  disabled,
  onPick,
  onMove,
  onMakeCover,
  onRemove,
}: Props) {
  const { slots } = list
  const shown = slots.flatMap((slot) => (slot.state === 'preparing' ? [] : [slot]))

  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="sr-only">{texts.legend}</legend>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {slots.map((slot) =>
          slot.state === 'preparing' ? (
            <li key={slot.key}>
              <Skeleton className="aspect-square w-full" />
            </li>
          ) : (
            <PetPhotoTile
              key={slot.key}
              slot={slot}
              index={shown.indexOf(slot)}
              total={shown.length}
              texts={texts}
              disabled={disabled}
              onMove={(step) => onMove(slot.key, step)}
              onMakeCover={() => onMakeCover(slot.key)}
              onRemove={() => onRemove(slot.key)}
            />
          ),
        )}
        {slots.length < MAX_PHOTOS ? (
          <li className={cn(slots.length === 0 && 'col-span-2')}>
            <label className={ADD}>
              <PickInput id={inputId} onPick={onPick} disabled={disabled} />
              <span className={cn('afiche text-ink', slots.length === 0 ? 'text-2xl' : 'text-lg')}>
                {texts.add}
              </span>
              {slots.length === 0 ? (
                <span className="text-sm text-ink-muted">{texts.addHint}</span>
              ) : null}
            </label>
          </li>
        ) : null}
      </ul>

      {slots.length > 0 ? (
        <output className="text-sm text-ink-muted">
          {texts.count.replace('{count}', String(slots.length))}
        </output>
      ) : null}
      {list.overflow > 0 ? (
        <ErrorText announce>{countText(list.overflow, texts.overflow)}</ErrorText>
      ) : null}
      {list.rejections.map((rejection) => (
        <ErrorText key={rejection.key} announce>
          {texts.rejected
            .replace('{file}', rejection.fileName)
            .replace('{reason}', errors[rejection.error] ?? rejection.error)}
        </ErrorText>
      ))}
      {error ? <ErrorText announce>{error}</ErrorText> : null}
    </fieldset>
  )
}
