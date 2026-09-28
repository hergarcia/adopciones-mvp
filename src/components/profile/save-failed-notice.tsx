import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import type { LeavingLoss } from '@/lib/profile/leaving-loss'
import type { NoticeReason } from '@/lib/profile/save-failure'
import type { SaveFailedTexts } from './profile-form-types'

type Props = {
  reason: NoticeReason
  /** Cambia con cada fallo: la tira se vuelve a montar, entra de nuevo y se anuncia otra vez
   *  (FR-002, FR-005). */
  attempt: number
  texts: SaveFailedTexts
  /** Lo que se pierde al salir a entrar de nuevo: el aviso de sesión cerrada lo dice antes
   *  (FR-008, FR-015, FR-017). */
  loss: LeavingLoss
}

type Message = keyof Omit<SaveFailedTexts, 'signIn'>

const SESSION_MESSAGE: Record<LeavingLoss, Message> = {
  nothing: 'sessionDraft',
  photo: 'sessionDraftPhoto',
  changes: 'session',
}

function messageFor(reason: NoticeReason, loss: LeavingLoss): Message {
  if (reason === 'offline') return 'offline'
  if (reason === 'no_response') return 'noResponse'
  return SESSION_MESSAGE[loss]
}

// El aviso de un guardado que no llegó en el perfil: elige qué decir y lo pega en `SaveFailedStrip`.
// Con la sesión vencida, lo que dice depende de qué se pierde al salir a entrar de nuevo.
export function SaveFailedNotice({ reason, attempt, texts, loss }: Props) {
  return <SaveFailedStrip message={texts[messageFor(reason, loss)]} attempt={attempt} />
}
