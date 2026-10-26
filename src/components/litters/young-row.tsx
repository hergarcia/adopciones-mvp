import { HandoverLine } from '@/components/adoptions/handover-line'
import { PetStatusStamp } from '@/components/pets/pet-status-stamp'
import { TextLink } from '@/components/ui/text-link'
import type { YoungState } from '@/lib/litters/types'

type Props = {
  /** Ya traducida: «Cría 1, hembra». */
  line: string
  /** El sello de una en proceso o adoptada, ya traducido; disponible no lleva. */
  stamp: { state: YoungState; label: string } | null
  /** Sus solicitudes, con «2 solicitudes nuevas» o «Ver solicitudes»; null si nadie la pidió. */
  inbox: { href: string; label: string } | null
  /** A quién se entregó una adoptada (#67). */
  handover: React.ComponentProps<typeof HandoverLine>['texts'] | null
  /** El seguimiento de su adopción, debajo de a quién se la dio (#69). */
  followUp?: React.ReactNode
  /** Sus acciones (`YoungStatusActions`), detrás de «Acciones». */
  actions: React.ReactNode
}

// Una cría de la camada en «Mis animales» (FR-026, research R9): su nombre y su sello, a quién se
// entregó si está adoptada, el camino a sus solicitudes y sus acciones en una hoja, como un animal en
// `MyPetActions`. Sin precarga en sus solicitudes: abrirlas las da por vistas.
export function YoungRow({ line, stamp, inbox, handover, followUp, actions }: Props) {
  return (
    <li className="flex flex-col items-start gap-1 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm break-words text-ink">{line}</span>
        {stamp === null ? null : <PetStatusStamp state={stamp.state} label={stamp.label} />}
      </div>
      {handover === null ? null : <HandoverLine texts={handover} />}
      {followUp}
      {inbox === null ? null : (
        <TextLink href={inbox.href} prefetch={false} weight="medium">
          {inbox.label}
        </TextLink>
      )}
      {actions}
    </li>
  )
}
