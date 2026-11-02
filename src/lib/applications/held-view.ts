import { uruguayDay } from '@/lib/verification/identity-status'
import { activeCount, type ApplicationTone } from './application-view'
import type { ApplicationStatus, HeldApplication, HeldLapseReason } from './types'

/** El sello de una que se dejó escrita: espera la identidad, o no salió (historia #289, R11). */
export type HeldStamp = 'waiting_identity' | 'not_sent'

export type HeldView = {
  stamp: HeldStamp
  tone: ApplicationTone
  /** Por qué no salió, con la clave de siempre cuando existe (FR-029); nulo mientras espera. */
  reason: HeldLapseReason | null
  /** El día en que se escribió y el último del plazo, en el calendario de Uruguay. */
  writtenDay: string
  lastDay: string
}

// Tinta mientras espera, como una que espera respuesta; gris cuando ya no salió, como una cerrada.
export function heldApplicationView(
  held: Pick<HeldApplication, 'status' | 'lapseReason' | 'writtenAt' | 'expiresAt'>,
): HeldView {
  const waiting = held.status === 'waiting'
  return {
    stamp: waiting ? 'waiting_identity' : 'not_sent',
    tone: waiting ? 'ink' : 'muted',
    reason: waiting ? null : held.lapseReason,
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
