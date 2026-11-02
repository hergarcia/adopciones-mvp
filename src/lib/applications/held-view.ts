import { uruguayDay } from '@/lib/verification/identity-status'
import { activeCount, type ApplicationTone } from './application-view'
import type { ApplicationStatus, HeldApplication, HeldLapseReason } from './types'

/**
 * El sello de una que se dejó escrita: espera la identidad, espera que el animal vuelva a recibir,
 * o no salió (historia #289, R11).
 */
export type HeldStamp = 'waiting_identity' | 'unavailable' | 'not_sent'

/**
 * La línea que dice cuándo sale: cuando el animal vuelva a recibir, hasta el último día (FR-014), o
 * si manda las fotos de nuevo antes de ese día, con el camino a verificar la identidad (FR-013).
 */
export type HeldLine = 'unavailable' | 'deadline'

export type HeldView = {
  stamp: HeldStamp
  tone: ApplicationTone
  /**
   * Por qué no salió, con la clave de siempre cuando existe (FR-029); la base lo deja nulo mientras
   * espera.
   */
  reason: HeldLapseReason | null
  line: HeldLine | null
  /** El día en que se escribió y el último del plazo, en el calendario de Uruguay. */
  writtenDay: string
  lastDay: string
}

function heldStamp(held: Pick<HeldApplication, 'status' | 'receiving' | 'levelTwo'>): {
  stamp: HeldStamp
  tone: ApplicationTone
} {
  if (held.status === 'lapsed') return { stamp: 'not_sent', tone: 'muted' }
  if (held.levelTwo && held.receiving !== 'yes') return { stamp: 'unavailable', tone: 'warning' }
  return { stamp: 'waiting_identity', tone: 'ink' }
}

function heldLine(stamp: HeldStamp, held: Pick<HeldApplication, 'needsRequest'>): HeldLine | null {
  if (stamp === 'unavailable') return 'unavailable'
  return stamp === 'waiting_identity' && held.needsRequest ? 'deadline' : null
}

// Tinta mientras espera la identidad, como una que espera respuesta; mate cocido cuando la identidad
// ya está y el animal no recibe por ahora, como una activa cuyo animal no está a la vista; gris
// cuando ya no salió, como una cerrada.
export function heldApplicationView(
  held: Pick<
    HeldApplication,
    'status' | 'lapseReason' | 'writtenAt' | 'expiresAt' | 'receiving' | 'levelTwo' | 'needsRequest'
  >,
): HeldView {
  const { stamp, tone } = heldStamp(held)
  return {
    stamp,
    tone,
    reason: held.lapseReason,
    line: heldLine(stamp, held),
    writtenDay: uruguayDay(new Date(held.writtenAt)),
    lastDay: uruguayDay(new Date(held.expiresAt)),
  }
}

/** Las que ocupan lugar para «N de 3»: las activas y las que esperan la identidad (FR-010, FR-012). */
export function activeWithHeld(
  applications: { status: ApplicationStatus }[],
  held: Pick<HeldApplication, 'status'>[],
): number {
  return activeCount(applications) + held.filter((one) => one.status === 'waiting').length
}
