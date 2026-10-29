import { useId } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TextLink } from '@/components/ui/text-link'
import { cn } from '@/lib/cn'
import type { ListedCardView } from '@/lib/pets/types'
import { PetCard } from './pet-card'
import { PetPhoto } from './pet-photo'
import { WALL_PHOTO_FRAME } from './wall-photo-frame'

// Una debajo de otra en el teléfono y las tres en un renglón desde 768, a lo ancho de la columna de
// Mi solicitud.
const ROW = 'grid grid-cols-1 gap-8 md:grid-cols-3'
const SIZES = '(min-width: 1024px) 280px, (min-width: 768px) 30vw, 90vw'

type Props = {
  /** Hasta tres tarjetas del listado, ya armadas, que abren la ficha con la marca del sugerido. */
  cards: ListedCardView[]
  listingHref: string
  /** Ya traducidos: el título con la especie y el enlace al listado filtrado. */
  texts: { title: string; toListing: string }
}

// Otros animales para pedir después de no ser elegido (historia #259), con la tarjeta del listado y
// el camino al listado de esa especie en su departamento. Sin prefetch: abrir la ficha o el listado
// se cuenta como una visita.
export function SuggestedPets({ cards, listingHref, texts }: Props) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="flex flex-col items-start gap-6">
      <h2 id={titleId} className="text-lg font-bold text-ink">
        {texts.title}
      </h2>
      <ul className={cn(ROW, 'w-full')}>
        {cards.map((card, index) => (
          <li key={card.key}>
            <PetCard
              view={card}
              index={index}
              eager={false}
              sizes={SIZES}
              prefetch={false}
              photo={PetPhoto}
            />
          </li>
        ))}
      </ul>
      <TextLink href={listingHref} prefetch={false}>
        {texts.toListing}
      </TextLink>
    </section>
  )
}

const PLACES = ['a', 'b', 'c']

/** Mientras llegan: el título y tres tarjetas en esqueleto, en el mismo renglón. */
export function SuggestedPetsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-7 w-56" />
      <div className={ROW}>
        {PLACES.map((place) => (
          <div key={place} className="flex flex-col gap-2 p-1">
            <Skeleton className={cn(WALL_PHOTO_FRAME, 'w-full')} />
            <Skeleton className="mt-1 h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
