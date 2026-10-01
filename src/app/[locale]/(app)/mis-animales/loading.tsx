import { petWall } from '@/components/pets/pet-wall'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const CARDS = ['a', 'b', 'c', 'd']

// La forma de la pared: el título, la tirita y cuatro cards 4:5 con su nombre, su zona, «Ver ficha»,
// «Compartir» y «Más acciones».
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-6 h-14 w-full max-w-[var(--measure)]" />
      <div className={cn('mt-8', petWall({ columns: 'wall' }))}>
        {CARDS.map((card) => (
          <div key={card} className="flex flex-col gap-2 p-1">
            <Skeleton className={cn(WALL_PHOTO_FRAME, 'w-full')} />
            <Skeleton className="mt-1 h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-2 h-5 w-2/5" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-3/5" />
          </div>
        ))}
      </div>
    </PageShell>
  )
}
