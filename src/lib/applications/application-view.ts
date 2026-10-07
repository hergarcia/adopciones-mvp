import { petPath } from '@/lib/pets/paths'
import type { ApplicationStatus, ApplicationSummary, CloseReason } from './types'

export type ApplicationTone = 'ink' | 'muted' | 'warning'

export type ApplicationView = {
  status: ApplicationStatus
  tone: ApplicationTone
  /** El motivo de una cerrada, en una línea (FR-071); la base lo deja nulo en las demás. */
  reason: CloseReason | null
  /** Una activa cuyo animal hoy no está a la vista: «no está disponible por ahora» (FR-060). */
  unavailable: boolean
  /** A la ficha, solo mientras la base dice que se puede mostrar el animal (FR-065). */
  href: string | null
}

// El estado en palabras de una solicitud (research R6): el sello de tinta mientras espera, mate
// cocido si el animal no está a la vista por ahora (algo espera) y gris cuando ya no cuenta. No
// disponible se deriva al leer, así desaparece solo cuando el animal vuelve a la vista.
export function applicationView(
  application: Pick<ApplicationSummary, 'status' | 'closeReason' | 'code' | 'petOnView'>,
): ApplicationView {
  const unavailable = application.status === 'sent' && !application.petOnView
  return {
    status: application.status,
    tone: unavailable ? 'warning' : application.status === 'sent' ? 'ink' : 'muted',
    reason: application.closeReason,
    unavailable,
    href: application.code === null ? null : petPath(application.code),
  }
}

/** Las activas, para «N de 3». */
export function activeCount(applications: { status: ApplicationStatus }[]): number {
  return applications.filter((application) => application.status === 'sent').length
}
