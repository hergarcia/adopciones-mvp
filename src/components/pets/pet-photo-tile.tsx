import { Button } from '@/components/ui/button'
import { ChevronDownIcon, CloseIcon } from '@/components/ui/icons'
import type { PetPhotoSlot } from '@/hooks/use-pet-photos'
import { cn } from '@/lib/cn'
import type { PetPhotosTexts } from './pet-form-types'
import { PetPhoto } from './pet-photo'
import { WALL_PHOTO_FRAME } from './wall-photo-frame'

type Props = {
  slot: Extract<PetPhotoSlot, { state: 'ready' | 'uploaded' }>
  index: number
  total: number
  texts: PetPhotosTexts
  disabled: boolean
  onMove: (step: -1 | 1) => void
  onMakeCover: () => void
  onRemove: () => void
}

const ICON_BUTTON = 'min-w-11 no-underline'

// Una foto con su lugar en texto y sus tres acciones, cada una de un toque, sin arrastrar y sin
// abrir nada (FR-006). Nada se apoya sobre la foto (docs/10 §Fotos). En 4:5, como en la pared: la
// portada se elige viendo el recorte con el que la van a ver. La portada lleva la cinta de `PetCard`:
// es la foto que va a la pared, y se ve pegada como allá. Sacar no pide confirmación:
// se deshace eligiéndola otra vez.
export function PetPhotoTile({
  slot,
  index,
  total,
  texts,
  disabled,
  onMove,
  onMakeCover,
  onRemove,
}: Props) {
  return (
    <li className="flex flex-col gap-1">
      <div className={cn(index === 0 && 'cinta-esquinas')}>
        <PetPhoto
          source={slot.preview}
          alt={texts.alt.replace('{position}', String(index + 1))}
          sizes="(min-width: 640px) 200px, 45vw"
          eager={index === 0}
          className={WALL_PHOTO_FRAME}
        />
      </div>
      {index === 0 ? (
        <p className="flex min-h-11 items-center text-base font-medium text-ink">{texts.cover}</p>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          disabled={disabled}
          onClick={onMakeCover}
        >
          {texts.makeCover}
        </Button>
      )}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          aria-label={texts.moveBefore}
          className={ICON_BUTTON}
          disabled={disabled || index === 0}
          onClick={() => onMove(-1)}
        >
          <ChevronDownIcon className="size-5 rotate-90" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={texts.moveAfter}
          className={ICON_BUTTON}
          disabled={disabled || index === total - 1}
          onClick={() => onMove(1)}
        >
          <ChevronDownIcon className="size-5 -rotate-90" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={texts.remove}
          className={ICON_BUTTON}
          disabled={disabled}
          onClick={onRemove}
        >
          <CloseIcon className="size-5" />
        </Button>
      </div>
    </li>
  )
}
