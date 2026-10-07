import Link from 'next/link'
import type { ApplicationTone } from '@/lib/applications/application-view'
import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationPetPhoto } from './application-pet-photo'
import { ApplicationStamp } from './application-stamp'

export const APPLICATION_CARD_SIZES = '(min-width: 1024px) 320px, (min-width: 768px) 30vw, 45vw'

type Props = {
  href: string
  cover: PetPhotoData | null
  /** Su lugar en la pared: alterna el lado de la inclinación. */
  index: number
  /** El sello sobre la foto; en el límite van sin él, porque las tres están enviadas. */
  tone: ApplicationTone | null
  /** Ya traducidos: el nombre, «Enviada el 6 de octubre», el sello y, de una cerrada, el motivo. */
  texts: { name: string; photoAlt: string; sentOn: string; stamp: string; reason: string | null }
  /** Lo que va debajo de la card: «Retirar», en el límite. */
  below?: React.ReactNode
}

// Una solicitud como el animal pegado en la pared (docs/10, `PetCard`): la foto manda, el sello del
// estado apoyado encima y el nombre debajo. La card entera lleva a Mi solicitud.
export function MyApplicationCard({ href, cover, index, tone, texts, below }: Props) {
  return (
    <li className="flex flex-col items-start gap-1">
      <Link href={href} className="lift group flex w-full flex-col gap-2 p-1 [--lift-tilt:0deg]">
        <ApplicationPetPhoto
          cover={cover}
          alt={texts.photoAlt}
          side={index % 2 === 0 ? 'left' : 'right'}
          sizes={APPLICATION_CARD_SIZES}
          eager={index < 4}
          photoClassName="[&>img]:group-hover:scale-[1.03]"
          stamp={tone === null ? null : <ApplicationStamp tone={tone} label={texts.stamp} />}
        />
        <p className="afiche mt-1 text-lg break-words text-ink">{texts.name}</p>
        <p className="text-sm text-ink-muted tabular-nums">{texts.sentOn}</p>
        {texts.reason === null ? null : <p className="text-sm text-ink-muted">{texts.reason}</p>}
      </Link>
      {below}
    </li>
  )
}
