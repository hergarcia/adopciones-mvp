import { HandoverLine } from '@/components/adoptions/handover-line'
import { PetStatusStamp } from '@/components/pets/pet-status-stamp'
import { TextLink } from '@/components/ui/text-link'
import type { YoungState } from '@/lib/litters/types'

type Props = {
  name: string
  /** Ya traducido: «Hembra». */
  sex: string
  stamp: { state: YoungState; label: string } | null
  inbox: { href: string; label: string } | null
  handover: React.ComponentProps<typeof HandoverLine>['texts'] | null
  followUp?: React.ReactNode
  /** Sus acciones a la vista (`YoungStatusActions` en `row`). */
  actions: React.ReactNode
}

// Una cría en el panel de su camada (plan §Panel de la camada): todo a la vista, sin hoja, como un
// animal en su pantalla. A quién se entregó y su seguimiento, si está adoptada (FR-032).
export function YoungPanelRow({ name, sex, stamp, inbox, handover, followUp, actions }: Props) {
  return (
    <li className="flex flex-col items-start gap-3 border-2 border-line p-4">
      <div className="flex flex-col items-start gap-1">
        <h3 className="afiche text-lg break-words text-ink">{name}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm text-ink-muted">{sex}</span>
          {stamp === null ? null : <PetStatusStamp state={stamp.state} label={stamp.label} />}
        </div>
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
