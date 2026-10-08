import { PetPhoto } from '@/components/pets/pet-photo'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { signedPhotoSource } from '@/lib/pets/photo-source'
import type { PetPhotoData } from '@/lib/pets/types'

type Props = {
  photos: PetPhotoData[]
  /** Ya traducidos, uno por foto: «Foto de Tobi que mandó Ana, 1 de 2». */
  alts: string[]
}

// Las fotos que vuelven pegadas al cartel (plan §Diseño): 4:5 como en la pared, sin inclinar porque
// son pruebas y no adorno, la primera con la cinta. Cada una abre su tamaño grande sola, sin visor.
export function FollowUpPhotos({ photos, alts }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {photos.map((photo, index) => (
        <li key={photo.id} className={cn(index === 0 && 'cinta-esquinas')}>
          <a href={photo.urls.full} target="_blank" rel="noreferrer" className="block">
            <PetPhoto
              source={signedPhotoSource(photo)}
              alt={alts[index] ?? ''}
              sizes="(min-width: 640px) 220px, 45vw"
              className={WALL_PHOTO_FRAME}
            />
          </a>
        </li>
      ))}
    </ul>
  )
}

/** Con la forma de las fotos de una respuesta, para la pantalla que carga. */
export function FollowUpPhotosSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className={WALL_PHOTO_FRAME} />
      ))}
    </div>
  )
}
