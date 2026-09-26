import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import type { NoticeReason } from '@/lib/profile/save-failure'
import type { SaveFailedTexts } from './profile-form-types'

type Props = {
  reason: NoticeReason
  texts: SaveFailedTexts
  onRetry: () => void
  retryDisabled: boolean
  signInHref: string
  /** Solo el alta tiene borrador: sobrevive a salir a entrar de nuevo (FR-008). */
  hasDraft: boolean
  /** La foto elegida no va en el borrador (FR-015). */
  photoPicked: boolean
}

type Message = keyof Omit<SaveFailedTexts, 'retry' | 'signIn'>

function messageFor(reason: NoticeReason, hasDraft: boolean, photoPicked: boolean): Message {
  if (reason === 'offline') return 'offline'
  if (reason === 'no_response') return 'noResponse'
  if (!hasDraft) return 'session'
  return photoPicked ? 'sessionDraftPhoto' : 'sessionDraft'
}

// El aviso de un guardado que no llegó, pegado arriba del botón de guardar: la misma tira de papel
// que el `Toast` de error, con su banda de ceibo, pero quieta dentro del formulario y sin sombra,
// porque no flota sobre nada (docs/10 §Componentes).
//
// En el alta, «Entrar de nuevo» no pregunta antes de salir: el borrador espera a la vuelta (FR-008)
// y el aviso ya dijo qué se pierde, así que el diálogo de «lo que escribiste se pierde» mentiría.
export function SaveFailedNotice({
  reason,
  texts,
  onRetry,
  retryDisabled,
  signInHref,
  hasDraft,
  photoPicked,
}: Props) {
  return (
    <div
      role="alert"
      data-keeps-work={hasDraft ? '' : undefined}
      className="flex animate-[fade-in_var(--dur-base)_var(--ease-out)] flex-col items-start gap-2 border-2 border-l-8 border-ink border-l-accent bg-canvas p-4"
    >
      <p className="text-base text-ink">{texts[messageFor(reason, hasDraft, photoPicked)]}</p>
      {reason === 'session' ? (
        <LinkButton href={signInHref} variant="ghost" size="sm">
          {texts.signIn}
        </LinkButton>
      ) : (
        <Button variant="ghost" size="sm" onClick={onRetry} disabled={retryDisabled}>
          {texts.retry}
        </Button>
      )}
    </div>
  )
}
