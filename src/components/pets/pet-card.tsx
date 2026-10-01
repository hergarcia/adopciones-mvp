import Link from 'next/link'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import type { ListedCardView } from '@/lib/pets/types'
import { PetPhoto } from './pet-photo'
import { PetStatusStamp } from './pet-status-stamp'
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
  /** La card ya armada en el servidor, con sus textos traducidos y su foto firmada. */
  view: ListedCardView
  /** Su lugar en la pared: alterna el lado de la inclinación y decide si carga de entrada. */
  index: number
  sizes: string
  /** El listado no adelanta la ficha: pedirla antes de tiempo la contaría como vista. */
  prefetch?: boolean
  onOpen?: () => void
}

// Una foto pegada al poste, y el nombre, la edad y la zona debajo (docs/10, `PetCard`). La card
// entera es el enlace, con `.lift` directo: no es un `Card`, porque el borde de tinta sobre la cinta
// y la inclinación serían recursos apilados. El `.lift` no gira: la foto ya está inclinada, y el giro
// sumado pasaría de `--tilt` en un lado y la enderezaría en el otro. La cinta va en el contenedor y
// el zoom en la foto, que recorta. El sello del estado va sobre la foto, el único recurso que se le
// apoya encima. Sin imports de servidor: la dibujan la página y el controlador.
export function PetCard({ view, index, sizes, prefetch, onOpen }: Props) {
  return (
    <Link
      href={view.href}
      prefetch={prefetch}
      onClick={onOpen}
      className="lift group flex flex-col gap-2 p-1 [--lift-tilt:0deg]"
    >
      <div className={pasted({ side: index % 2 === 0 ? 'left' : 'right' })}>
        <PetPhoto
          source={view.photo}
          alt={view.alt}
          sizes={sizes}
          eager={index < 4}
          className={cn(WALL_PHOTO_FRAME, '[&>img]:group-hover:scale-[1.03]')}
        />
        {view.stamp ? (
          <span className="absolute top-2 left-2">
            <PetStatusStamp state={view.stamp.state} label={view.stamp.label} />
          </span>
        ) : null}
      </div>
      <p className="afiche mt-1 text-lg break-words text-ink">{view.name}</p>
      {view.ageText ? <p className="text-sm text-ink">{view.ageText}</p> : null}
      <ZoneLabel text={view.zoneText} />
      {view.urgentText ? <UrgencyTag label={view.urgentText} /> : null}
    </Link>
  )
}
