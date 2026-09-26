import { useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
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
  attempt,
  texts,
  onRetry,
  retryDisabled,
  signInHref,
  hasDraft,
  photoPicked,
}: Props) {
  const { retryRef, markRetrying } = useRetryKeepsFocus(retryDisabled)

  return (
    <div
      data-keeps-work={hasDraft ? '' : undefined}
      className={cn(
        paperStrip({ band: 'error' }),
        'flex animate-[fade-in_var(--dur-base)_var(--ease-out)] flex-col items-start gap-2',
      )}
    >
      <p key={attempt} role="alert">
        {texts[messageFor(reason, hasDraft, photoPicked)]}
      </p>
      {reason === 'session' ? (
        <LinkButton href={signInHref} variant="ghost" size="sm">
          {texts.signIn}
        </LinkButton>
      ) : (
        <Button
          ref={retryRef}
          variant="ghost"
          size="sm"
          onClick={() => {
            markRetrying()
            onRetry()
          }}
          disabled={retryDisabled}
        >
          {texts.retry}
        </Button>
      )}
    </div>
  )
}

// Mientras el intento corre, «Reintentar» está deshabilitado y el navegador le saca el foco. Si el
// intento vuelve a fallar, el foco vuelve al botón: quien usa el teclado no tiene que recorrer todo
// el formulario para intentar otra vez (docs/10 §Piso de accesibilidad).
function useRetryKeepsFocus(disabled: boolean) {
  const retryRef = useRef<HTMLButtonElement>(null)
  const retryingRef = useRef(false)

  useEffect(() => {
    if (disabled || !retryingRef.current) return
    retryingRef.current = false
    const focused = document.activeElement
    if (focused === null || focused === document.body) retryRef.current?.focus()
  }, [disabled])

  const markRetrying = useCallback(() => {
    retryingRef.current = true
  }, [])

  return { retryRef, markRetrying }
}
