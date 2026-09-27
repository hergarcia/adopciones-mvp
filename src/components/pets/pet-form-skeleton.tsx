import { Skeleton } from '@/components/ui/skeleton'

const ROWS = ['a', 'b', 'c', 'd']

// La forma del formulario mientras llega: el título, las fotos y los primeros campos.
export function PetFormSkeleton({ photos }: { photos: number }) {
  const tiles = Array.from({ length: Math.max(photos, 1) }, (_, index) => index)
  return (
    <>
      <Skeleton className="h-8 w-56" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Skeleton
            key={tile}
            className={photos === 0 ? 'col-span-2 aspect-square' : 'aspect-square'}
          />
        ))}
      </div>
      <Skeleton className="mt-8 h-6 w-32" />
      {ROWS.map((row) => (
        <Skeleton key={row} className="mt-6 h-11 w-full" />
      ))}
    </>
  )
}
