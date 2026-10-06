import { PetPhotoView } from '@/components/pets/pet-photo-view'
import { cn } from '@/lib/cn'
import { signedPhotoSource } from '@/lib/pets/photo-source'
import type { PetPhotoData } from '@/lib/pets/types'

type Props = {
  cover: PetPhotoData | null
  /** Ya traducido. */
  alt: string
  size: 'sm' | 'md'
}

// La foto chica del animal por el que se escribe, 4:5 como en la pared; sin foto —un animal que ya
// no está publicado, FR-065—, el hueco de piedra en el mismo lugar, así la fila no salta.
export function ApplicationPetPhoto({ cover, alt, size }: Props) {
  const box = cn('aspect-[4/5] shrink-0', size === 'sm' ? 'w-14' : 'w-16')
  if (cover === null) return <div aria-hidden className={cn(box, 'bg-surface')} />
  return (
    <PetPhotoView
      source={signedPhotoSource(cover)}
      alt={alt}
      sizes={size === 'sm' ? '56px' : '64px'}
      className={box}
    />
  )
}
