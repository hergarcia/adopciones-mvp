import type { ApplicationTone } from './application-view'
import type { PetApplicationRow, PublisherClose } from './types'

export type PublisherStamp =
  'new' | 'waiting' | 'waiting_answer' | 'accepted' | 'rejected' | 'closed'

export type PublisherApplicationView = {
  stamp: PublisherStamp
  tone: ApplicationTone
  /** Por qué se cerró, en una línea; nulo si no está cerrada (FR-042, FR-043). */
  close: PublisherClose | null
  /** Mientras espera respuesta se cuentan los días (FR-004). */
  waiting: boolean
}

const TONES: Record<PublisherStamp, ApplicationTone> = {
  new: 'ink',
  waiting: 'ink',
  waiting_answer: 'warning',
  accepted: 'primary',
  rejected: 'muted',
  closed: 'muted',
}

type Input = Pick<PetApplicationRow, 'status' | 'publisherClose' | 'isNew' | 'waitingQuestion'>

function stampOf(application: Input): PublisherStamp {
  if (application.status === 'sent') {
    if (application.waitingQuestion) return 'waiting_answer'
    return application.isNew ? 'new' : 'waiting'
  }
  if (application.status === 'accepted' || application.status === 'rejected') {
    return application.status
  }
  return 'closed'
}

// El estado de una solicitud del lado del publicador (research R10). Retirada, el bloqueo de quien
// solicitó y su suspensión llegan de la base como el mismo `gone`, y acá se ven con un solo sello y
// una sola línea: el publicador no sabe cuál fue (FR-042, SC-008).
export function publisherApplicationView(application: Input): PublisherApplicationView {
  const stamp = stampOf(application)
  return {
    stamp,
    tone: TONES[stamp],
    close: stamp === 'closed' ? (application.publisherClose ?? 'gone') : null,
    waiting: application.status === 'sent',
  }
}
