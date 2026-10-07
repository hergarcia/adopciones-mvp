import { PetPastedPhoto } from '@/components/pets/pet-pasted-photo'
import { PetPhotoView } from '@/components/pets/pet-photo-view'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { cn } from '@/lib/cn'
import { signedPhotoSource } from '@/lib/pets/photo-source'
import type { PetPhotoData } from '@/lib/pets/types'

type Props = {
  cover: PetPhotoData | null
  /** Ya traducido. */
  alt: string
  /** El sello de la solicitud apoyado sobre la foto, o nada. */
  stamp?: React.ReactNode
  side?: 'left' | 'right'
  sizes: string
  eager?: boolean
  /** Lo que haga la foto al pasar el puntero, cuando la card entera es un enlace. */
  photoClassName?: string
}

// El animal por el que se escribe, pegado en la pared como en el listado: 4:5, con cinta y apenas
// inclinado. Sin foto —un animal que ya no se muestra, FR-065— queda el hueco de piedra en el mismo
// lugar, sin cinta porque no hay nada pegado, y el sello encima igual.
export function ApplicationPetPhoto({
  cover,
  alt,
  stamp,
  side = 'left',
  sizes,
  eager = false,
  photoClassName,
}: Props) {
  if (cover === null) {
    return (
      <div className={cn('relative bg-surface', WALL_PHOTO_FRAME)}>
        {stamp ? <span className="absolute top-2 left-2">{stamp}</span> : null}
      </div>
    )
  }
  return (
    <PetPastedPhoto
      view={{ photo: signedPhotoSource(cover), alt }}
      stamp={stamp}
      side={side}
      sizes={sizes}
      eager={eager}
      photo={PetPhotoView}
      photoClassName={cn(WALL_PHOTO_FRAME, photoClassName)}
    />
  )
}
