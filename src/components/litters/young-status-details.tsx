import { HandoverLine } from '@/components/adoptions/handover-line'
import { PetStatusStamp } from '@/components/pets/pet-status-stamp'
import { TextLink } from '@/components/ui/text-link'
import type { YoungState } from '@/lib/litters/types'

export type YoungStatusDetailsProps = {
  /** El renglón al lado del sello: «Canela, hembra» en la pared, «Hembra» en el panel. */
  line: React.ReactNode
  /** El sello de una en proceso o adoptada, ya traducido; disponible no lleva. */
  stamp: { state: YoungState; label: string } | null
  /** Sus solicitudes, con «2 solicitudes nuevas» o «Ver solicitudes»; null si nadie la pidió. */
  inbox: { href: string; label: string } | null
  /** A quién se entregó una adoptada (#67). */
  handover: React.ComponentProps<typeof HandoverLine>['texts'] | null
  /** El seguimiento de su adopción, debajo de a quién se la dio (#69). */
  followUp?: React.ReactNode
}

// Sin precarga en sus solicitudes: abrirlas las da por vistas.
export function YoungStatusDetails({
  line,
  stamp,
  inbox,
  handover,
  followUp,
}: YoungStatusDetailsProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {line}
        {stamp === null ? null : <PetStatusStamp state={stamp.state} label={stamp.label} />}
      </div>
      {handover === null ? null : <HandoverLine texts={handover} />}
      {followUp}
      {inbox === null ? null : (
        <TextLink href={inbox.href} prefetch={false} weight="medium">
          {inbox.label}
        </TextLink>
      )}
    </>
  )
}
