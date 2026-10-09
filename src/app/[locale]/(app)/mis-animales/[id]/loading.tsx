import { FollowUpPhotosSkeleton } from '@/components/follow-ups/follow-up-photos'
import { PetWorkLayout } from '@/components/pets/pet-work-layout'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma del panel: la vuelta, la foto chica al lado del nombre y cuándo vence, las acciones y el
// lugar de las fotos del seguimiento.
export default function Loading() {
  return (
    <PageShell width="full">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-11 w-28" />
        <PetWorkLayout
          photo="small"
          head={
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-40" />
            </div>
          }
          picture={<Skeleton className={WALL_PHOTO_FRAME} />}
        >
          <div className="flex max-w-[var(--measure)] flex-col gap-8">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-14 w-full md:w-48" />
              <Skeleton className="h-11 w-40" />
              <Skeleton className="h-11 w-48" />
            </div>
            <FollowUpPhotosSkeleton />
          </div>
        </PetWorkLayout>
      </div>
    </PageShell>
  )
}
