import Link from 'next/link'
import { Stamp } from '@/components/ui/stamp'
import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationPetPhoto } from './application-pet-photo'
import { APPLICATION_CARD_SIZES } from './my-application-card'

type Props = {
  href: string
  cover: PetPhotoData | null
  /** Su lugar en la pared: alterna el lado de la inclinación. */
  index: number
  /** Ya traducidos: el nombre, «2 nuevas» solo si hay, y «3 esperan respuesta». */
  texts: { name: string; photoAlt: string; fresh: string | null; waiting: string }
}

// Un animal del poste de la rescatista (plan §Diseño): la foto pegada como en la pared, con el sello
// de tinta «N nuevas» encima —lo único que llama la atención en Solicitudes— y debajo el nombre y
// cuántas esperan. Sin prefetch: abrir las de un animal las da por vistas (research R6).
export function InboxPetCard({ href, cover, index, texts }: Props) {
  return (
    <li className="flex flex-col items-start gap-1">
      <Link
        href={href}
        prefetch={false}
        className="lift group flex w-full flex-col gap-2 p-1 [--lift-tilt:0deg]"
      >
        <ApplicationPetPhoto
          cover={cover}
          alt={texts.photoAlt}
          side={index % 2 === 0 ? 'left' : 'right'}
          sizes={APPLICATION_CARD_SIZES}
          eager={index < 4}
          photoClassName="[&>img]:group-hover:scale-[1.03]"
          stamp={texts.fresh === null ? null : <Stamp tone="ink">{texts.fresh}</Stamp>}
        />
        <p className="afiche mt-1 text-lg break-words text-ink">{texts.name}</p>
        <p className="text-sm text-ink-muted tabular-nums">{texts.waiting}</p>
      </Link>
    </li>
  )
}
