import Link from 'next/link'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { editPetPath } from '@/lib/pets/paths'
import { signedPhotoSource } from '@/lib/pets/photo-source'
import type { PetSummary } from '@/lib/pets/types'
import { PetPhoto } from './pet-photo'
import { UrgencyTag } from './urgency-tag'
import { WALL_PHOTO_FRAME } from './wall-photo-frame'
import { ZoneLabel } from '@/components/zones/zone-label'

const pasted = cva('cinta-esquinas', {
  variants: {
    side: {
      left: 'rotate-[calc(var(--tilt)*-1)]',
      right: 'rotate-(--tilt)',
    },
  },
})

type Props = {
  pet: PetSummary
  /** Ya traducidos. */
  texts: { alt: string; urgent: string }
  /** Su lugar en la pared: alterna el lado de la inclinación y decide si carga de entrada. */
  index: number
}

// Una foto pegada al poste, y el nombre y la zona debajo (docs/10, `PetCard`). La card entera es el
// enlace, con `.lift` directo: no es un `Card`, porque el borde de tinta sobre la cinta y la
// inclinación serían recursos apilados. El `.lift` no gira: la foto ya está inclinada, y el giro
// sumado pasaría de `--tilt` en un lado y la enderezaría en el otro. La cinta va en el contenedor
// y el zoom en la foto, que recorta.
export function PetCard({ pet, texts, index }: Props) {
  return (
    <Link
      href={editPetPath(pet.id)}
      className="lift group flex flex-col gap-2 p-1 [--lift-tilt:0deg]"
    >
      <div className={pasted({ side: index % 2 === 0 ? 'left' : 'right' })}>
        <PetPhoto
          source={signedPhotoSource(pet.cover)}
          alt={texts.alt}
          sizes="(min-width: 1024px) 240px, (min-width: 768px) 30vw, 45vw"
          eager={index < 4}
          className={cn(WALL_PHOTO_FRAME, '[&>img]:group-hover:scale-[1.03]')}
        />
      </div>
      <p className="afiche mt-1 text-lg text-ink">{pet.name}</p>
      <ZoneLabel zone={pet.zone} />
      {pet.isUrgent ? <UrgencyTag label={texts.urgent} /> : null}
    </Link>
  )
}
