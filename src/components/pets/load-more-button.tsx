import { Button } from '@/components/ui/button'
import { LinkButton } from '@/components/ui/link-button'
import type { LoadMoreState } from '@/lib/pets/listing-page'

type Props = {
  state: LoadMoreState
  /** Sin ejecutar nada: el listado desde el principio con 24 más, y el ancla al primero nuevo. */
  href: string
  loading: boolean
  onLoadMore: () => void
  /** Ya traducidos. */
  texts: { loadMore: string; cap: string }
}

// «Ver más» (FR-015, FR-019): lo que dibuja lo decide `loadMoreState`. Es `secondary`: el listado no
// tiene una acción principal, y la tirita no se gasta acá (docs/10 §Componentes).
export function LoadMoreButton({ state, href, loading, onLoadMore, texts }: Props) {
  if (state === 'none') return null
  if (state === 'cap') return <p className="text-sm text-ink-muted">{texts.cap}</p>
  if (state === 'link') {
    return (
      <LinkButton href={href} variant="secondary">
        {texts.loadMore}
      </LinkButton>
    )
  }
  return (
    <Button variant="secondary" loading={loading} onClick={onLoadMore}>
      {texts.loadMore}
    </Button>
  )
}
