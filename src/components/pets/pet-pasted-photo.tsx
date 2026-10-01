import { cva } from 'class-variance-authority'
import type { ListedCardView } from '@/lib/pets/types'
import { PetPhoto } from './pet-photo'
import { PetStatusStamp } from './pet-status-stamp'

const pasted = cva('cinta-esquinas', {
  variants: {
    side: {
      left: 'rotate-[calc(var(--tilt)*-1)]',
      right: 'rotate-(--tilt)',
    },
  },
})

type Props = {
  /** La foto firmada, su `alt` y el sello del estado, ya armados en el servidor. */
  view: Pick<ListedCardView, 'photo' | 'alt' | 'stamp'>
  /** El lado hacia el que se inclina: en la pared se alterna. */
  side: 'left' | 'right'
  sizes: string
  eager: boolean
  /** La caja que recorta la foto, con su proporción y lo que haga al pasar el puntero. */
  photoClassName: string
}

// Una foto pegada al poste con dos trozos de cinta, apenas inclinada, y el sello del estado encima:
// el único recurso que se le apoya (docs/10, `PetCard`). La cinta va en el contenedor y la foto, que
// recorta, adentro. La usan la card de la pared y la pantalla de un animal en «Mis animales».
export function PetPastedPhoto({ view, side, sizes, eager, photoClassName }: Props) {
  return (
    <div className={pasted({ side })}>
      <PetPhoto
        source={view.photo}
        alt={view.alt}
        sizes={sizes}
        eager={eager}
        className={photoClassName}
      />
      {view.stamp ? (
        <span className="absolute top-2 left-2">
          <PetStatusStamp state={view.stamp.state} label={view.stamp.label} />
        </span>
      ) : null}
    </div>
  )
}
