import { Skeleton } from '@/components/ui/skeleton'

const ROWS = ['a', 'b', 'c', 'd']

// La forma del formulario mientras llega, con sus mismos anchos: el título, las fotos y los primeros
// campos.
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
      <div className="max-w-[var(--measure)]">
        <Skeleton className="mt-8 h-6 w-32" />
        {ROWS.map((row) => (
          <Skeleton key={row} className="mt-6 h-11 w-full" />
        ))}
      </div>
    </>
  )
}
