import { petPath } from '@/lib/pets/paths'
import type { ApplicationStatus, ApplicationSummary, CloseReason } from './types'

export type ApplicationView = {
  status: ApplicationStatus
  tone: 'ink' | 'muted'
  /** El motivo de una cerrada, en una línea (FR-071); la base lo deja nulo en las demás. */
  reason: CloseReason | null
  /** A la ficha, solo mientras la base dice que se puede mostrar el animal (FR-065). */
  href: string | null
}

// El estado en palabras de una solicitud (research R6): el sello de tinta mientras espera, gris
// cuando ya no cuenta.
export function applicationView(
  application: Pick<ApplicationSummary, 'status' | 'closeReason' | 'code'>,
): ApplicationView {
  return {
    status: application.status,
    tone: application.status === 'sent' ? 'ink' : 'muted',
    reason: application.closeReason,
    href: application.code === null ? null : petPath(application.code),
  }
}

/** Las activas, para «N de 3». */
export function activeCount(applications: { status: ApplicationStatus }[]): number {
  return applications.filter((application) => application.status === 'sent').length
}
