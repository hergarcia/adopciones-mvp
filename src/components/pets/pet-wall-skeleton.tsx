import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { petWall } from './pet-wall'
import { WALL_PHOTO_FRAME } from './wall-photo-frame'

const CARDS = ['a', 'b', 'c', 'd']

type Props = {
  /** `card`: el nombre y la zona; `actions` suma cuándo vence y las acciones de «Mis animales». */
  lines: 'card' | 'actions'
  className?: string
}

// La forma de la pared mientras llega: cuatro cards 4:5 con sus renglones.
export function PetWallSkeleton({ lines, className }: Props) {
  return (
    <div className={cn(petWall({ columns: 'wall' }), className)}>
      {CARDS.map((card) => (
        <div key={card} className="flex flex-col gap-2 p-1">
          <Skeleton className={cn(WALL_PHOTO_FRAME, 'w-full')} />
          <Skeleton className="mt-1 h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          {lines === 'actions' ? (
            <>
              <Skeleton className="mt-2 h-4 w-3/5" />
              <Skeleton className="mt-1 h-5 w-2/5" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-3/5" />
            </>
          ) : null}
        </div>
      ))}
    </div>
  )
}
