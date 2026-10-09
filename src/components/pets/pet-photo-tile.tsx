import { Button } from '@/components/ui/button'
import { ChevronDownIcon, CloseIcon } from '@/components/ui/icons'
import type { PetPhotoSlot } from '@/hooks/use-pet-photos'
import { cn } from '@/lib/cn'
import type { ArrangePhotosTexts, PlainPhotosTexts } from './pet-form-types'
import { PetPhoto } from './pet-photo'
import { WALL_PHOTO_FRAME } from './wall-photo-frame'

/** La portada y el orden, solo en la ficha; sin esto, la foto solo se saca (variante `plain`). */
export type PhotoTileArrange = {
  texts: ArrangePhotosTexts
  onMove: (step: -1 | 1) => void
  onMakeCover: () => void
}

type Props = {
  slot: Extract<PetPhotoSlot, { state: 'ready' | 'uploaded' }>
  index: number
  total: number
  texts: Pick<PlainPhotosTexts, 'alt' | 'remove'>
  disabled: boolean
  arrange?: PhotoTileArrange
  onRemove: () => void
}

// Una foto con su lugar en texto y sus tres acciones, cada una de un toque, sin arrastrar y sin
// abrir nada (FR-006). Nada se apoya sobre la foto (docs/10 §Fotos). En 4:5, como en la pared: la
// portada se elige viendo el recorte con el que la van a ver. La portada lleva la cinta de `PetCard`:
// es la foto que va a la pared, y se ve pegada como allá. Sacar no pide confirmación:
// se deshace eligiéndola otra vez. Sin `arrange` (el seguimiento) no hay portada ni orden.
export function PetPhotoTile({ slot, index, total, texts, disabled, arrange, onRemove }: Props) {
  const cover = arrange !== undefined && index === 0
  return (
    <li className="flex flex-col gap-1">
      <div className={cn(cover && 'cinta-esquinas')}>
        <PetPhoto
          source={slot.preview}
          alt={texts.alt.replace('{position}', String(index + 1))}
          sizes="(min-width: 640px) 200px, 45vw"
          eager={index === 0}
          className={WALL_PHOTO_FRAME}
        />
      </div>
      {arrange === undefined ? null : cover ? (
        <p className="flex min-h-11 items-center text-base font-medium text-ink">
          {arrange.texts.cover}
        </p>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          disabled={disabled}
          onClick={arrange.onMakeCover}
        >
          {arrange.texts.makeCover}
        </Button>
      )}
      <div className="flex gap-1">
        {arrange === undefined ? null : (
          <>
            <Button
              variant="icon"
              size="sm"
              aria-label={arrange.texts.moveBefore}
              disabled={disabled || index === 0}
              onClick={() => arrange.onMove(-1)}
            >
              <ChevronDownIcon className="size-5 rotate-90" />
            </Button>
            <Button
              variant="icon"
              size="sm"
              aria-label={arrange.texts.moveAfter}
              disabled={disabled || index === total - 1}
              onClick={() => arrange.onMove(1)}
            >
              <ChevronDownIcon className="size-5 -rotate-90" />
            </Button>
          </>
        )}
        <Button
          variant="icon"
          size="sm"
          aria-label={texts.remove}
          disabled={disabled}
          onClick={onRemove}
        >
          <CloseIcon className="size-5" />
        </Button>
      </div>
    </li>
  )
}
