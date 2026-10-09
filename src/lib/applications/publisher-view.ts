import type { ApplicationTone } from './application-view'
import type { PetApplicationRow, PublisherClose } from './types'

export type PublisherStamp =
  | 'new'
  | 'waiting'
  | 'waiting_answer'
  | 'accepted'
  | 'rejected'
  | 'closed'
  | 'handed_over'
  | 'handed_over_ended'

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
  handed_over: 'primary',
  handed_over_ended: 'muted',
}

/** La adopción de la elegida, cuando se la leyó: en curso, o terminada al volver a publicar. */
export type PublisherAdoption = 'ongoing' | 'ended'

type Input = Pick<PetApplicationRow, 'status' | 'publisherClose' | 'isNew' | 'waitingQuestion'> & {
  adoption?: PublisherAdoption | null
}

function stampOf(application: Input): PublisherStamp {
  if (application.status === 'sent') {
    if (application.waitingQuestion) return 'waiting_answer'
    return application.isNew ? 'new' : 'waiting'
  }
  if (application.status === 'accepted' || application.status === 'rejected') {
    return application.status
  }
  if (application.publisherClose === 'handed_over' && application.adoption) {
    return application.adoption === 'ended' ? 'handed_over_ended' : 'handed_over'
  }
  return 'closed'
}

// El estado de una solicitud del lado del publicador (research R10). Retirada, el bloqueo de quien
// solicitó y su suspensión llegan de la base como el mismo `gone`, y acá se ven con un solo sello y
// una sola línea: el publicador no sabe cuál fue (FR-042, SC-008). La elegida, con su adopción a
// mano, lleva su propio sello en yerba —el final de un rescate no es una cerrada— y el sello ya dice
// por qué, sin la línea (historia #67).
export function publisherApplicationView(application: Input): PublisherApplicationView {
  const stamp = stampOf(application)
  return {
    stamp,
    tone: TONES[stamp],
    close: stamp === 'closed' ? (application.publisherClose ?? 'gone') : null,
    waiting: application.status === 'sent',
  }
}
