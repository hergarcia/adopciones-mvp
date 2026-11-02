import type { ApplicationTone } from '@/lib/applications/application-view'
import type { PetPhotoData } from '@/lib/pets/types'
import { ApplicationStamp } from './application-stamp'
import { PastedApplicationCard } from './pasted-application-card'

type Props = {
  /** Null para una que se dejó escrita: no tiene pantalla propia (historia #289, FR-016). */
  href: string | null
  cover: PetPhotoData | null
  /** Su lugar en la pared: alterna el lado de la inclinación. */
  index: number
  /** El sello sobre la foto; en el límite, solo el de la que espera la identidad. */
  tone: ApplicationTone | null
  /** Ya traducidos: el nombre, «Enviada el 6 de octubre», el sello, de una cerrada el motivo y, de
   *  la elegida con el compromiso sin aceptar, «Compromiso pendiente» (historia #67) y, con el
   *  seguimiento pedido, «Contar cómo va» (historia #69). */
  texts: {
    name: string
    /** De una cría, el nombre de su camada, debajo del suyo (historia #206). */
    litter?: string | null
    photoAlt: string
    sentOn: string
    /** De una que se dejó escrita, cuándo sale: «Sale cuando Tobi vuelva a recibir…» (#289). */
    note?: string | null
    /** De una que se dejó escrita sin pedido en revisión, hasta qué día espera las fotos (#289). */
    deadline?: string | null
    stamp: string
    reason: string | null
    pending?: string | null
    followUp?: string | null
  }
  /** Lo que va debajo de la card: «Retirar» y, de una que espera las fotos, «Verificar mi identidad». */
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
        alerts: [texts.pending ?? null, texts.followUp ?? null, texts.deadline ?? null],
        lines: [texts.litter ?? null, texts.sentOn, texts.note ?? null, texts.reason],
      }}
      below={below}
    />
  )
}
