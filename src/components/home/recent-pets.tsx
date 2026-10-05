import { PetWall } from '@/components/pets/pet-wall'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import { TextLink } from '@/components/ui/text-link'
import { LISTING_PATH, PUBLISH_PATH } from '@/lib/pets/paths'
import type { ListedCardView } from '@/lib/pets/types'
import { RecentPetsFailed } from './recent-pets-failed'

export type RecentPetsTexts = {
  title: string
  all: string
  empty: string
  emptyAction: string
  failed: string
  failedAction: string
}

type Props = {
  /** Los primeros del listado, o `null` si no se pudieron traer. */
  cards: ListedCardView[] | null
  texts: RecentPetsTexts
}

// «Ver todos» va una sola vez en el DOM, después de la pared: desde 768 la grilla lo sube al lado
// del título. Sin animales no va: el listado también estaría vacío, y en el error sería la misma
// acción dos veces (plan §Los tres estados).
export function RecentPets({ cards, texts }: Props) {
  const hasCards = cards !== null && cards.length > 0
  return (
    <section
      aria-labelledby="recent-pets-title"
      className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end"
    >
      <h2 id="recent-pets-title" className="afiche text-xl text-ink md:row-start-1">
        {texts.title}
      </h2>
      <div className="md:col-span-2 md:row-start-2">
        {cards === null ? (
          <RecentPetsFailed texts={texts} />
        ) : hasCards ? (
          <PetWall cards={cards} columns="wall" prefetch={false} />
        ) : (
          <EmptyState
            title={texts.empty}
            action={
              <LinkButton href={PUBLISH_PATH} variant="secondary" prefetch={false}>
                {texts.emptyAction}
              </LinkButton>
            }
          />
        )}
      </div>
      {hasCards ? (
        <TextLink
          href={LISTING_PATH}
          weight="medium"
          prefetch={false}
          className="md:col-start-2 md:row-start-1"
        >
          {texts.all}
        </TextLink>
      ) : null}
    </section>
  )
}
