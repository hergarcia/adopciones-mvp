import { INBOX_PATH, myApplicationPath, publisherApplicationPath } from './paths'
import type { NoticeKind } from './types'

export type NoticeEmail = {
  /** A quién se le escribe: el publicador o quien solicitó. */
  audience: 'publisher' | 'applicant'
  /** Adónde lleva el botón. */
  path: string
}

const TO_PUBLISHER: readonly NoticeKind[] = ['new_application', 'question_answered']

// Cada correo de una solicitud lleva a la pantalla donde se actúa (contracts §Correos): la nueva, a
// Solicitudes —puede haber más de una sin abrir—; la respuesta a una pregunta, a esa solicitud; lo
// de quien solicitó, a Mi solicitud. Nada más que eso: el texto sale de `emails.applications.<kind>`
// con el nombre del animal (FR-063).
export function noticeEmail(kind: NoticeKind, applicationId: string): NoticeEmail {
  if (!TO_PUBLISHER.includes(kind)) {
    return { audience: 'applicant', path: myApplicationPath(applicationId) }
  }
  return {
    audience: 'publisher',
    path: kind === 'new_application' ? INBOX_PATH : publisherApplicationPath(applicationId),
  }
}
