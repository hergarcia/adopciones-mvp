'use client'

import { cva } from 'class-variance-authority'
import { ErrorText } from '@/components/ui/error-text'
import { Skeleton } from '@/components/ui/skeleton'
import type { PetPhotoList } from '@/hooks/use-pet-photos'
import { ACCEPTED_PHOTO_TYPES } from '@/lib/images/photo-file'
import { MAX_PHOTOS } from '@/lib/pets/rules'
import { cn } from '@/lib/cn'
import { countText, type PetPhotosTexts, type PlainPhotosTexts } from './pet-form-types'
import { PetPhotoTile, type PhotoTileArrange } from './pet-photo-tile'
import { PET_PHOTO_GRID, PET_PHOTOS_WIDTH } from './pet-form-layout'
import { EMPTY_INVITATION_FRAME, WALL_PHOTO_FRAME } from './wall-photo-frame'

type Common = {
  list: PetPhotoList
  /** Por clave de error, en crudo: el motivo de cada foto que no entró. */
  errors: Record<string, string>
  /** Ya traducido: el del campo entero, como «Agregá al menos una foto». */
  error?: string
  inputId: string
  disabled: boolean
  onPick: (files: File[]) => void
  onRemove: (key: string) => void
  /** Cuántas entran: 5 en la ficha, 3 en el seguimiento. */
  max?: number
}

// `arrange` es la ficha: portada y orden. `plain` es el seguimiento: solo agregar y sacar.
type Props = Common &
  (
    | {
        variant?: 'arrange'
        texts: PetPhotosTexts
        onMove: (key: string, step: -1 | 1) => void
        onMakeCover: (key: string) => void
      }
    | { variant: 'plain'; texts: PlainPhotosTexts }
  )

function arrangeFor(props: Props, key: string): PhotoTileArrange | undefined {
  if (props.variant === 'plain') return undefined
  return {
    texts: props.texts,
    onMove: (step) => props.onMove(key, step),
    onMakeCover: () => props.onMakeCover(key),
  }
}

// El input transparente cubre el casillero, como el radio en `RadioGroup`: el toque, el puntero y el
// foco son del casillero entero.
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
      className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      onChange={(event) => {
        onPick(Array.from(event.target.files ?? []))
        event.target.value = ''
      }}
    />
  )
}

const invitation = cva(
  'relative flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-ink bg-surface p-4 text-center transition-colors duration-[var(--dur-fast)] ease-out hover:bg-canvas has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
  {
    variants: {
      // Con fotos, es un casillero más.
      empty: { true: EMPTY_INVITATION_FRAME, false: WALL_PHOTO_FRAME },
    },
  },
)

// Las fotos en el orden en que se van a publicar, en el 4:5 de la pared: cualquiera pasa a portada
// con un toque, y se elige viendo cómo va a quedar pegada (docs/10, `PetPhotosField`). Vacía, la invitación a la primera foto ocupa el ancho, con la cinta esperando la foto
// que se va a pegar ahí; con fotos, el casillero para agregar cierra la grilla mientras haya lugar.
// Desde 1024 la grilla sale de la medida de lectura y gana columnas: las cinco entran en una fila.
// Una rechazada no ocupa casillero: su motivo va debajo, con el nombre del archivo, que se muestra
// acá y nunca se manda.
export function PetPhotosField(props: Props) {
  const { texts, list, errors, error, inputId, disabled, onPick, onRemove } = props
  const max = props.max ?? MAX_PHOTOS
  const { slots } = list
  const empty = slots.length === 0
  const shown = slots.flatMap((slot) => (slot.state === 'preparing' ? [] : [slot]))

  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-3', PET_PHOTOS_WIDTH)}>
      <legend className="sr-only">{texts.legend}</legend>
      <ul className={PET_PHOTO_GRID}>
        {slots.map((slot) =>
          slot.state === 'preparing' ? (
            <li key={slot.key}>
              <Skeleton className={cn(WALL_PHOTO_FRAME, 'w-full')} />
            </li>
          ) : (
            <PetPhotoTile
              key={slot.key}
              slot={slot}
              index={shown.indexOf(slot)}
              total={shown.length}
              texts={texts}
              disabled={disabled}
              arrange={arrangeFor(props, slot.key)}
              onRemove={() => onRemove(slot.key)}
            />
          ),
        )}
        {slots.length < max ? (
          <li className={cn(empty && 'cinta-esquinas col-span-full')}>
            <label className={invitation({ empty })}>
              <PickInput id={inputId} onPick={onPick} disabled={disabled} />
              <span className={cn('afiche text-ink', empty ? 'text-2xl' : 'text-lg')}>
                {texts.add}
              </span>
              {empty ? <span className="text-sm text-ink-muted">{texts.addHint}</span> : null}
            </label>
          </li>
        ) : null}
      </ul>

      {empty ? null : (
        <output className="text-sm text-ink-muted">
          {texts.count.replace('{count}', String(slots.length))}
        </output>
      )}
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
