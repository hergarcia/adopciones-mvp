import { paperStrip } from '@/components/ui/paper-strip'
import { cn } from '@/lib/cn'
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

// El aviso de un guardado que no llegó, pegado arriba del botón de guardar: la misma tira de papel
// que el `Toast` de error, con su banda de ceibo, pero quieta dentro del formulario y sin sombra,
// porque no flota sobre nada (docs/10 §Componentes). No tiene botón propio: dice qué pasó y manda a
// la tirita por su nombre, que guardar y reintentar son la misma acción (docs/10 §Principios 6).
// Un reintento que falla igual la hace entrar de nuevo: sin conexión el botón no llega a mostrarse
// ocupado, y sin ese cambio el toque no contestaría nada (docs/10 §Principios 4).
export function SaveFailedNotice({ reason, attempt, texts, loss }: Props) {
  return (
    <div
      key={attempt}
      className={cn(
        paperStrip({ band: 'error' }),
        'animate-[fade-in_var(--dur-base)_var(--ease-out)]',
      )}
    >
      <p role="alert">{texts[messageFor(reason, loss)]}</p>
    </div>
  )
}
