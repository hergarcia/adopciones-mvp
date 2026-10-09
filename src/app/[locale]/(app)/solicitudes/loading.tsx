import { petWall } from '@/components/pets/pet-wall'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const CARDS = [0, 1, 2, 3]

// Con la forma de Solicitudes: el título y la pared de animales con su renglón. Además, el límite
// del prefetch: traer la ruta por adelantado llega hasta acá y no la cuenta como abierta (R6).
export default function Loading() {
  return (
    <PageShell width="full" className="flex flex-col gap-8">
      <Skeleton className="h-8 w-48" />
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
