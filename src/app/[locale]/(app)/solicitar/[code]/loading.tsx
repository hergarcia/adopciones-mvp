import { PetWorkLayout } from '@/components/pets/pet-work-layout'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// Con la forma del cuestionario: el nombre al lado de la foto, el paso y una pregunta.
export default function Loading() {
  return (
    <PageShell width="full">
      <PetWorkLayout
        photo="small"
        head={
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>
        }
        picture={<Skeleton className={WALL_PHOTO_FRAME} />}
      >
        <div className="flex max-w-[var(--measure)] flex-col gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="mt-4 h-14 w-full md:w-40" />
        </div>
      </PetWorkLayout>
    </PageShell>
  )
}
