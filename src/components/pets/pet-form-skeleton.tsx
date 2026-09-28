import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { PET_FORM_COLUMNS, PET_PHOTO_GRID, PET_PHOTOS_WIDTH } from './pet-form-layout'
import { EMPTY_INVITATION_FRAME, WALL_PHOTO_FRAME } from './wall-photo-frame'

const ROWS = ['a', 'b', 'c', 'd']
const COLUMNS = ['left', 'right']

// La forma del formulario mientras llega, con sus mismos anchos: el título, las fotos y los primeros
// campos de cada columna.
export function PetFormSkeleton({ photos }: { photos: number }) {
  const tiles = Array.from({ length: Math.max(photos, 1) }, (_, index) => index)
  return (
    <>
      <Skeleton className="h-8 w-56" />
      <div className={cn('mt-6', PET_PHOTOS_WIDTH, PET_PHOTO_GRID)}>
        {tiles.map((tile) => (
          <Skeleton
            key={tile}
            className={
              photos === 0 ? cn('col-span-full', EMPTY_INVITATION_FRAME) : WALL_PHOTO_FRAME
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
