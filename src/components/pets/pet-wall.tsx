import { cva } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import type { ListedCardView } from '@/lib/pets/types'
import { PetCard } from './pet-card'
import type { PhotoComponent } from './pet-photo-view'

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
  /**
   * Lo que va debajo de la fila de una card, a todo el ancho de la pared, en el mismo orden: la
   * encuesta de «Mis animales» sobre el animal que se dio (historia #71). Nulo, nada.
   */
  beneathRow?: React.ReactNode[]
  prefetch?: boolean
  /**
   * `PetPhoto`, o `PetPhotoView` en la portada: importar `PetPhoto` suma su código a la página
   * aunque no se dibuje, y en la portada pasaba el presupuesto de 150 KB.
   */
  photo: PhotoComponent
  /** Cuántas cargan de entrada, la primera fila. En la portada 0: la pared va debajo de la frase. */
  eagerCount?: number
  /** Se tocó una card: el listado guarda lo cargado para reponerlo al volver atrás. */
  onCardOpen?: () => void
}

// La pared: las cards una al lado de la otra. Cada una lleva su ancla, `a-{n}`, para que «Ver más»
// sin ejecutar nada lleve al primero de los nuevos (FR-019). Lo de `beneathRow` va en el DOM justo
// después de su card y, con el relleno denso de la grilla, a lo ancho debajo de la fila de esa card
// en cualquier cantidad de columnas: las cards que siguen completan la fila en vez de dejarle
// huecos.
export function PetWall({
  cards,
  columns,
  below,
  beneathRow,
  prefetch,
  photo,
  eagerCount = 4,
  onCardOpen,
}: Props) {
  return (
    <ul
      className={cn(
        petWall({ columns }),
        beneathRow?.some(Boolean) === true && 'grid-flow-row-dense',
      )}
    >
      {cards.map((card, index) => [
        <li key={card.key} id={`a-${index + 1}`} className="flex flex-col gap-1">
          <PetCard
            view={card}
            index={index}
            eager={index < eagerCount}
            sizes={SIZES[columns]}
            prefetch={prefetch}
            photo={photo}
            onOpen={onCardOpen}
          />
          {below?.[index]}
        </li>,
        beneathRow?.[index] ? (
          <li key={`${card.key}-fila`} className="col-span-full">
            {beneathRow[index]}
          </li>
        ) : null,
      ])}
    </ul>
  )
}
