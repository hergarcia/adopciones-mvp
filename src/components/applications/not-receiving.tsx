import { HeadedEmptyState } from '@/components/ui/headed-empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { LISTING_PATH } from '@/lib/pets/paths'

type Props = {
  /** Ya traducidos. Nunca dicen por qué: la bloqueada no se entera (FR-063). */
  texts: { title: string; body: string; toListing: string }
}

// Un animal que no recibe solicitudes, o no por ahora: un solo camino, a los que sí.
export function NotReceiving({ texts }: Props) {
  return (
    <HeadedEmptyState
      title={texts.title}
      body={texts.body}
      action={
        <LinkButton href={LISTING_PATH} variant="secondary">
          {texts.toListing}
        </LinkButton>
      }
    />
  )
}
