import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'

type Props = {
  /** La ficha de la camada. */
  href: string
  /** Ya traducidos. */
  texts: { title: string; body: string; toLitter: string }
}

// La cría que se quería pedir ya no está publicada (FR-032): lo dice, y la salida es la ficha de su
// camada, donde siguen las otras.
export function YoungGone({ href, texts }: Props) {
  return (
    <HeadedEmptyState
      title={texts.title}
      body={texts.body}
      action={
        <LinkButton href={href} variant="secondary">
          {texts.toLitter}
        </LinkButton>
      }
    />
  )
}
