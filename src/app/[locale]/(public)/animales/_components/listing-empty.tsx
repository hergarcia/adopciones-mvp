import { ClearFiltersAction } from '@/components/pets/clear-filters-action'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { PUBLISH_PATH } from '@/lib/pets/paths'

type Props = {
  filtered: boolean
  hydrated: boolean
  onClear: () => void
  /** «Avisame cuando haya uno así» (`AlertOffer`), la acción principal del vacío. */
  offer: React.ReactNode
  texts: { empty: string; emptyAction: string; emptyFiltered: string; filters: { clear: string } }
}

// Los dos vacíos del listado: sin filtros invita a publicar, que es lo único que llena la pared; con
// filtros, a sacarlos (US3-AS10, US3-AS11). Sin ejecutar nada, sacarlos es un enlace. En los dos, lo
// primero es que avisen cuando haya uno así (historia #265).
export function ListingEmpty({ filtered, hydrated, onClear, offer, texts }: Props) {
  if (!filtered) {
    return (
      <EmptyState
        title={texts.empty}
        action={
          <EmptyActions>
            {offer}
            <LinkButton href={PUBLISH_PATH} variant="secondary">
              {texts.emptyAction}
            </LinkButton>
          </EmptyActions>
        }
      />
    )
  }
  return (
    <EmptyState
      title={texts.emptyFiltered}
      action={
        <EmptyActions>
          {offer}
          <ClearFiltersAction
            label={texts.filters.clear}
            hydrated={hydrated}
            onClear={onClear}
            variant="secondary"
          />
        </EmptyActions>
      }
    />
  )
}

// Una debajo de la otra en el teléfono; desde 1024, lado a lado y centradas.
function EmptyActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start">{children}</div>
  )
}
