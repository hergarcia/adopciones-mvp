import Link from 'next/link'
import { cn } from '@/lib/cn'
import type { ListedCardView } from '@/lib/pets/types'
import { PetPastedPhoto } from './pet-pasted-photo'
import type { PhotoComponent } from './pet-photo-view'
import { UrgencyTag } from './urgency-tag'
import { WALL_PHOTO_FRAME } from './wall-photo-frame'
import { ZoneLabel } from '@/components/zones/zone-label'

type Props = {
  /** La card ya armada en el servidor, con sus textos traducidos y su foto firmada. */
  view: ListedCardView
  /** Su lugar en la pared: alterna el lado de la inclinación. */
  index: number
  /** Las primeras de la pared cargan de entrada; el resto, cuando se acercan. */
  eager: boolean
  sizes: string
  /** El listado no adelanta la ficha: pedirla antes de tiempo la contaría como vista. */
  prefetch?: boolean
  photo: PhotoComponent
  onOpen?: () => void
}

// Una foto pegada al poste, y el nombre, la edad y la zona debajo (docs/10, `PetCard`). La card
// entera es el enlace, con `.lift` directo: no es un `Card`, porque el borde de tinta sobre la cinta
// y la inclinación serían recursos apilados. El `.lift` no gira: la foto ya está inclinada, y el giro
// sumado pasaría de `--tilt` en un lado y la enderezaría en el otro. Sin imports de servidor: la
// dibujan la página y el controlador.
export function PetCard({ view, index, eager, sizes, prefetch, photo, onOpen }: Props) {
  return (
    <Link
      href={view.href}
      prefetch={prefetch}
      onClick={onOpen}
      className="lift group flex flex-col gap-2 p-1 [--lift-tilt:0deg]"
    >
      <PetPastedPhoto
        view={view}
        side={index % 2 === 0 ? 'left' : 'right'}
        sizes={sizes}
        eager={eager}
        photo={photo}
        photoClassName={cn(WALL_PHOTO_FRAME, '[&>img]:group-hover:scale-[1.03]')}
      />
      <p className="afiche mt-1 text-lg break-words text-ink">{view.name}</p>
      {view.ageText ? <p className="text-sm text-ink">{view.ageText}</p> : null}
      <ZoneLabel text={view.zoneText} />
      {view.urgentText ? <UrgencyTag label={view.urgentText} /> : null}
    </Link>
  )
}
