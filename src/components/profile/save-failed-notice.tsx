import { paperStrip } from '@/components/ui/paper-strip'
import { cn } from '@/lib/cn'
import type { NoticeReason } from '@/lib/profile/save-failure'
import type { SaveFailedTexts } from './profile-form-types'

type Props = {
  reason: NoticeReason
  /** Cambia con cada fallo: el texto se vuelve a montar para que se anuncie otra vez (FR-002,
   *  FR-005). */
  attempt: number
  texts: SaveFailedTexts
  /** Solo el alta tiene borrador, y solo si el navegador deja guardarlo: sobrevive a salir a
   *  entrar de nuevo (FR-008, FR-017). */
  hasDraft: boolean
  /** La foto elegida no va en el borrador (FR-015). */
  photoPicked: boolean
}

type Message = keyof Omit<SaveFailedTexts, 'signIn'>

function messageFor(reason: NoticeReason, hasDraft: boolean, photoPicked: boolean): Message {
  if (reason === 'offline') return 'offline'
  if (reason === 'no_response') return 'noResponse'
  if (!hasDraft) return 'session'
  return photoPicked ? 'sessionDraftPhoto' : 'sessionDraft'
}

// El aviso de un guardado que no llegó, pegado arriba del botón de guardar: la misma tira de papel
// que el `Toast` de error, con su banda de ceibo, pero quieta dentro del formulario y sin sombra,
// porque no flota sobre nada (docs/10 §Componentes). No tiene botón propio: dice qué pasó y manda a
// la tirita por su nombre, que guardar y reintentar son la misma acción (docs/10 §Principios 6).
export function SaveFailedNotice({ reason, attempt, texts, hasDraft, photoPicked }: Props) {
  return (
    <div
      className={cn(
        paperStrip({ band: 'error' }),
        'animate-[fade-in_var(--dur-base)_var(--ease-out)]',
      )}
    >
      <p key={attempt} role="alert">
        {texts[messageFor(reason, hasDraft, photoPicked)]}
      </p>
    </div>
  )
}
