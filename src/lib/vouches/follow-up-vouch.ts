import type { VouchStanding } from './types'

export type FollowUpVouch = { kind: 'none' } | { kind: 'invite' } | { kind: 'vouching' }

const NONE: FollowUpVouch = { kind: 'none' }

export type FollowUpVouchInput = {
  /** El seguimiento como lo ve quien dio el animal; nulo si no hay. */
  followUp: { status: 'requested' | 'answered' | 'closed'; hidden: boolean } | null
  /** La adopción de esa solicitud; nula si no hay. */
  adoption: { endedAt: string | null; declinedAt: string | null; contactCut: boolean } | null
  viewerLevelTwo: boolean
  /** Nulo si su perfil no se ve: suspendida, borrada o sin completar. */
  adopter: { levelTwo: boolean } | null
  standing: VouchStanding
}

// La invitación a avalar a quien adoptó, debajo de su seguimiento (historia #261). Solo con las fotos
// ya mandadas y la adopción en pie. Cuando no se puede avalar no hay nada, ni el motivo: decir por qué
// le contaría a quien dio el animal una quita, un bloqueo o una suspensión que #12 y #13 no le
// muestran. «Ya la avalás» queda solo con el aval contando; uno en pausa se ve como hoy, en el perfil.
// `give_vouch` repite las reglas en la base, que es donde valen.
export function followUpVouch({
  followUp,
  adoption,
  viewerLevelTwo,
  adopter,
  standing,
}: FollowUpVouchInput): FollowUpVouch {
  if (followUp === null || followUp.status !== 'answered' || followUp.hidden) return NONE
  if (adoption === null || adoption.endedAt !== null || adoption.declinedAt !== null) return NONE
  if (adoption.contactCut || adopter === null) return NONE
  if (standing.viewerBlockedTarget || standing.targetBlockedViewer) return NONE
  if (!viewerLevelTwo || !adopter.levelTwo) return NONE
  if (standing.viewerVouches) return { kind: 'vouching' }
  if (standing.targetVouchesViewer || standing.blockedByTarget) return NONE
  return { kind: 'invite' }
}
