import { Stamp } from '@/components/ui/stamp'
import type { PetPhotoData } from '@/lib/pets/types'
import { PastedApplicationCard } from './pasted-application-card'

type Props = {
  href: string
  cover: PetPhotoData | null
  /** Su lugar en la pared: alterna el lado de la inclinación. */
  index: number
  /** Ya traducidos: el nombre, «2 nuevas» solo si hay, y «3 esperan respuesta». */
  texts: { name: string; photoAlt: string; fresh: string | null; waiting: string }
}

// Un animal del poste de la rescatista (plan §Diseño): la foto pegada como en la pared, con el sello
// de tinta «N nuevas» encima —lo único que llama la atención en Solicitudes recibidas— y debajo el
// nombre y cuántas esperan. Sin prefetch: abrir las de un animal las da por vistas (research R6).
export function InboxPetCard({ href, cover, index, texts }: Props) {
  return (
    <PastedApplicationCard
      href={href}
      cover={cover}
      index={index}
      prefetch={false}
      stamp={texts.fresh === null ? null : <Stamp tone="ink">{texts.fresh}</Stamp>}
      texts={{ name: texts.name, photoAlt: texts.photoAlt, lines: [texts.waiting] }}
    />
  )
}
