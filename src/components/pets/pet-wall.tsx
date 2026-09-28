import { cva } from 'class-variance-authority'
import type { ListedCardView } from '@/lib/pets/types'
import { PetCard } from './pet-card'

// Dos columnas, tres desde 768 y cuatro desde 1024 (docs/10 §Layout); al lado del poste de filtros,
// tres, porque la columna ocupa el lugar de la cuarta (research R12). El espacio entre fotos es
// `--space-8`: cada cinta sobresale su esquina, y con menos las de dos vecinas se tocan y las fotos
// se leen pegadas con la misma tira. La comparten los `loading` que dibujan la pared.
export const petWall = cva('grid grid-cols-2 gap-8 md:grid-cols-3', {
  variants: { columns: { wall: 'lg:grid-cols-4', 'beside-rail': 'lg:grid-cols-3' } },
})

const SIZES = {
  wall: '(min-width: 1024px) 240px, (min-width: 768px) 30vw, 45vw',
  'beside-rail': '(min-width: 1024px) 270px, (min-width: 768px) 30vw, 45vw',
}

type Props = {
  cards: ListedCardView[]
  columns: 'wall' | 'beside-rail'
  /** Lo que va debajo de cada card, en el mismo orden: las acciones de «Mis animales». */
  below?: React.ReactNode[]
  prefetch?: boolean
  /** Se tocó una card: el listado guarda lo cargado para reponerlo al volver atrás. */
  onCardOpen?: () => void
}

// La pared: las cards una al lado de la otra. Cada una lleva su ancla, `a-{n}`, para que «Ver más»
// sin ejecutar nada lleve al primero de los nuevos (FR-019).
export function PetWall({ cards, columns, below, prefetch, onCardOpen }: Props) {
  return (
    <ul className={petWall({ columns })}>
      {cards.map((card, index) => (
        <li key={card.key} id={`a-${index + 1}`} className="flex flex-col gap-1">
          <PetCard
            view={card}
            index={index}
            sizes={SIZES[columns]}
            prefetch={prefetch}
            onOpen={onCardOpen}
          />
          {below?.[index]}
        </li>
      ))}
    </ul>
  )
}
