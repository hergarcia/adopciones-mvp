import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { PET_FORM_COLUMNS } from './pet-form-layout'

const ROWS = ['a', 'b', 'c', 'd']
const COLUMNS = ['left', 'right']

// La forma del formulario mientras llega, con sus mismos anchos: el título, las fotos y los primeros
// campos de cada columna.
export function PetFormSkeleton({ photos }: { photos: number }) {
  const tiles = Array.from({ length: Math.max(photos, 1) }, (_, index) => index)
  return (
    <>
      <Skeleton className="h-8 w-56" />
      <div className="mt-6 grid max-w-[var(--measure)] grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-none lg:grid-cols-5">
        {tiles.map((tile) => (
          <Skeleton
            key={tile}
            className={
              photos === 0
                ? 'col-span-full aspect-square sm:aspect-[3/2] lg:aspect-[5/2]'
                : 'aspect-square'
            }
          />
        ))}
      </div>
      <div className={cn('mt-8', PET_FORM_COLUMNS)}>
        {COLUMNS.map((column) => (
          <div key={column} className={column === 'right' ? 'hidden lg:block' : undefined}>
            <Skeleton className="h-6 w-32" />
            {ROWS.map((row) => (
              <Skeleton key={row} className="mt-6 h-11 w-full" />
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
