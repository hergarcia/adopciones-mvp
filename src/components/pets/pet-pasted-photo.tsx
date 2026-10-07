import { cva } from 'class-variance-authority'
import type { ListedCardView } from '@/lib/pets/types'
import type { PhotoComponent } from './pet-photo-view'

const pasted = cva('cinta-esquinas', {
  variants: {
    side: {
      left: 'rotate-[calc(var(--tilt)*-1)]',
      right: 'rotate-(--tilt)',
    },
  },
})

type Props = {
  /** La foto firmada y su `alt`, ya armados en el servidor. */
  view: Pick<ListedCardView, 'photo' | 'alt'>
  /** El sello apoyado sobre la foto: el del animal o el de una solicitud. */
  stamp: React.ReactNode
  /** El lado hacia el que se inclina: en la pared se alterna. */
  side: 'left' | 'right'
  sizes: string
  eager: boolean
  photo: PhotoComponent
  /** La caja que recorta la foto, con su proporción y lo que haga al pasar el puntero. */
  photoClassName: string
}

// Una foto pegada al poste con dos trozos de cinta, apenas inclinada, y el sello del estado encima:
// el único recurso que se le apoya (docs/10, `PetCard`). La cinta va en el contenedor y la foto, que
// recorta, adentro. La usan la card de la pared, la pantalla de un animal en «Mis animales» y las
// solicitudes, que apoyan el sello de la solicitud.
export function PetPastedPhoto({
  view,
  stamp,
  side,
  sizes,
  eager,
  photo: Photo,
  photoClassName,
}: Props) {
  return (
    <div className={pasted({ side })}>
      <Photo
        source={view.photo}
        alt={view.alt}
        sizes={sizes}
        eager={eager}
        className={photoClassName}
      />
      {stamp ? <span className="absolute top-2 left-2">{stamp}</span> : null}
    </div>
  )
}
