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
}

const MESSAGE: Record<NoticeReason, keyof SaveFailedTexts> = {
  offline: 'offline',
  no_response: 'noResponse',
  session: 'session',
}

// El aviso de un guardado que no llegó, pegado arriba del botón de guardar. Es un renglón del
// formulario y no un cartel: sin sombra ni cinta. El fondo es el de avisos de error y el texto va en
// tinta, porque el ceibo sobre ese fondo no llega a AA (docs/10 §Color).
export function SaveFailedNotice({ reason, texts, onRetry, retryDisabled, signInHref }: Props) {
  return (
    <div
      role="alert"
      className="flex animate-[fade-in_var(--dur-base)_var(--ease-out)] flex-col items-start gap-2 bg-accent-soft p-4"
    >
      <p className="text-base text-ink">{texts[MESSAGE[reason]]}</p>
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
