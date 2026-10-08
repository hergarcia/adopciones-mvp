import { MY_PETS_PATH, myPetPath } from '@/lib/pets/paths'
import { INBOX_PATH, myApplicationPath, publisherApplicationPath } from './paths'
import type { NoticeKind } from './types'

export type NoticeEmail = {
  /** A quién se le escribe: el publicador o quien solicitó. */
  audience: 'publisher' | 'applicant'
  /** Adónde lleva el botón. */
  path: string
}

const TO_PUBLISHER: readonly NoticeKind[] = [
  'new_application',
  'question_answered',
  'adoption_declined',
  'follow_up_answered',
]

const PUBLISHER_PATH: Partial<Record<NoticeKind, string>> = {
  new_application: INBOX_PATH,
  // «Yo no adopté» lleva a Mis animales, donde el animal dice que la persona no lo adoptó (FR-052).
  adoption_declined: MY_PETS_PATH,
}

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
    path: PUBLISHER_PATH[kind] ?? publisherApplicationPath(applicationId),
  }
}

// El correo del compromiso va a las dos (historia #67, contracts §Correos): cada una a su pantalla de
// esa solicitud, Mi solicitud quien adoptó y Una solicitud quien lo dio.
export function commitmentEmail(side: 'publisher' | 'adopter', applicationId: string): NoticeEmail {
  return side === 'publisher'
    ? { audience: 'publisher', path: publisherApplicationPath(applicationId) }
    : { audience: 'applicant', path: myApplicationPath(applicationId) }
}

// «Ana contó cómo va Tobi» lleva a la pantalla del animal, donde están las fotos, el texto y el sello
// (historia #69, US2-AS2): la lista de Mis animales solo muestra el sello y abre la edición.
export function followUpAnsweredEmail(petId: string | null): NoticeEmail {
  return { audience: 'publisher', path: petId === null ? MY_PETS_PATH : myPetPath(petId) }
}
