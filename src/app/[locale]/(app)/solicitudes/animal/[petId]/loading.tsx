import { ApplicationCardSkeleton } from '@/components/applications/application-card'
import { PetWorkLayout } from '@/components/pets/pet-work-layout'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const ROWS = [0, 1, 2]

// Con la forma de las solicitudes de un animal: la foto con el título al lado y tres renglones de la
// carpeta. Es también el límite del prefetch (R6).
export default function Loading() {
  return (
    <PageShell width="full">
      <PetWorkLayout
        photo="small"
        head={
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
        }
        picture={<Skeleton className={WALL_PHOTO_FRAME} />}
      >
        <div className="flex max-w-[var(--measure)] flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <ul>
            {ROWS.map((row) => (
              <ApplicationCardSkeleton key={row} />
            ))}
          </ul>
        </div>
      </PetWorkLayout>
    </PageShell>
  )
}
