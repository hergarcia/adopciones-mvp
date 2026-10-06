import { petWall } from '@/components/pets/pet-wall'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const CARDS = [0, 1, 2]

// Con la forma de Mis solicitudes: el título, el contador y la pared con tres.
export default function Loading() {
  return (
    <PageShell width="full" className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className={petWall({ columns: 'wall' })}>
        {CARDS.map((card) => (
          <div key={card} className="flex flex-col gap-2 p-1">
            <Skeleton className={WALL_PHOTO_FRAME} />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </PageShell>
  )
}
