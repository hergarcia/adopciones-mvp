import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { LISTING_PATH, PUBLISH_PATH } from '@/lib/pets/paths'

type Props = {
  filtered: boolean
  hydrated: boolean
  onClear: () => void
  texts: { empty: string; emptyAction: string; emptyFiltered: string; filters: { clear: string } }
}

// Los dos vacíos del listado: sin filtros invita a publicar, que es lo único que llena la pared; con
// filtros, a sacarlos (US3-AS10, US3-AS11). Sin ejecutar nada, sacarlos es un enlace.
export function ListingEmpty({ filtered, hydrated, onClear, texts }: Props) {
  if (!filtered) {
    return (
      <EmptyState
        title={texts.empty}
        action={
          <LinkButton href={PUBLISH_PATH} variant="secondary">
            {texts.emptyAction}
          </LinkButton>
        }
      />
    )
  }
  return (
    <EmptyState
      title={texts.emptyFiltered}
      action={
        hydrated ? (
          <Button variant="secondary" onClick={onClear}>
            {texts.filters.clear}
          </Button>
        ) : (
          <LinkButton href={LISTING_PATH} variant="secondary">
            {texts.filters.clear}
          </LinkButton>
        )
      }
    />
  )
}
