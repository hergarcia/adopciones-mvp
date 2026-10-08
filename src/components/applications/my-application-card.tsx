import type { ApplicationTone } from '@/lib/applications/application-view'
import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationStamp } from './application-stamp'
import { PastedApplicationCard } from './pasted-application-card'

type Props = {
  href: string
  cover: PetPhotoData | null
  /** Su lugar en la pared: alterna el lado de la inclinación. */
  index: number
  /** El sello sobre la foto; en el límite van sin él, porque las tres están enviadas. */
  tone: ApplicationTone | null
  /** Ya traducidos: el nombre, «Enviada el 6 de octubre», el sello, de una cerrada el motivo y, de
   *  la elegida con el compromiso sin aceptar, «Compromiso pendiente» (historia #67) y, con el
   *  seguimiento pedido, «Contá cómo va» (historia #69). */
  texts: {
    name: string
    photoAlt: string
    sentOn: string
    stamp: string
    reason: string | null
    pending?: string | null
    followUp?: string | null
  }
  /** Lo que va debajo de la card: «Retirar», en el límite. */
  below?: React.ReactNode
}

// Una solicitud como el animal pegado en la pared: el sello del estado sobre la foto, y debajo cuándo
// se mandó y, de una cerrada, por qué. La card entera lleva a Mi solicitud.
export function MyApplicationCard({ href, cover, index, tone, texts, below }: Props) {
  return (
    <PastedApplicationCard
      href={href}
      cover={cover}
      index={index}
      stamp={tone === null ? null : <ApplicationStamp tone={tone} label={texts.stamp} />}
      texts={{
        name: texts.name,
        photoAlt: texts.photoAlt,
        alerts: [texts.pending ?? null, texts.followUp ?? null],
        lines: [texts.sentOn, texts.reason],
      }}
      below={below}
    />
  )
}
