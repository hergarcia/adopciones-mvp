import Link from 'next/link'
import { cva } from 'class-variance-authority'
import { editPetPath } from '@/lib/pets/paths'
import { signedPhotoSource } from '@/lib/pets/photo-source'
import type { PetSummary } from '@/lib/pets/types'
import { PetPhoto } from './pet-photo'
import { UrgencyTag } from './urgency-tag'
import { ZoneLabel } from './zone-label'

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
// inclinación serían recursos apilados. La cinta va en el contenedor y el zoom en la foto, que
// recorta.
export function PetCard({ pet, texts, index }: Props) {
  return (
    <Link href={editPetPath(pet.id)} className="lift group flex flex-col gap-2 p-1">
      <div className={pasted({ side: index % 2 === 0 ? 'left' : 'right' })}>
        <PetPhoto
          source={signedPhotoSource(pet.cover)}
          alt={texts.alt}
          sizes="(min-width: 1024px) 240px, (min-width: 768px) 30vw, 45vw"
          eager={index < 4}
          className="aspect-[4/5] [&>img]:group-hover:scale-[1.03]"
        />
      </div>
      <p className="afiche mt-1 text-lg text-ink">{pet.name}</p>
      <ZoneLabel zone={pet.zone} />
      {pet.isUrgent ? <UrgencyTag label={texts.urgent} /> : null}
    </Link>
  )
}
