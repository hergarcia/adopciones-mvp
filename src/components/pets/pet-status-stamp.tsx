import { Stamp, type StampTone } from '@/components/ui/stamp'
import type { ListedCardView, PetState } from '@/lib/pets/types'

// En proceso en tinta, adoptado en yerba porque salió bien, lo que nadie más ve en gris (docs/10,
// `PetCard`). Ninguno en acento: en el listado habría varios. Disponible no lleva sello.
const TONES: Record<PetState, StampTone | null> = {
  available: null,
  in_process: 'ink',
  adopted: 'primary',
  paused: 'muted',
  expired: 'muted',
  taken_down: 'muted',
}

type Props = {
  state: PetState
  /** Ya traducido y concordado con el animal: «Adoptada», «Pausado». */
  label: string
  /** `lg` solo sobre la foto de la ficha adoptada, cuyo estado es el logro. */
  size?: 'md' | 'lg'
}

export function PetStatusStamp({ state, label, size }: Props) {
  const tone = TONES[state]
  return tone === null ? null : (
    <Stamp tone={tone} size={size}>
      {label}
    </Stamp>
  )
}

/** El sello de una card ya armada, o nada si el animal está disponible. */
export function CardStamp({ stamp }: { stamp: ListedCardView['stamp'] }) {
  return stamp ? <PetStatusStamp state={stamp.state} label={stamp.label} /> : null
}
