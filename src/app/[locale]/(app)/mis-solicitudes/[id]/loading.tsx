import { AnswerListSkeleton } from '@/components/applications/answer-list'
import { FollowUpPhotosSkeleton } from '@/components/follow-ups/follow-up-photos'
import { PetWorkLayout } from '@/components/pets/pet-work-layout'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// Con la forma de Mi solicitud: el animal con su sello al lado de la foto y las respuestas a lo
// ancho, en dos columnas desde 1024 como la pantalla; antes, el lugar de las fotos del seguimiento.
export default function Loading() {
  return (
    <PageShell width="full">
      <PetWorkLayout
        photo="small"
        head={
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        }
        picture={<Skeleton className={WALL_PHOTO_FRAME} />}
      >
        <div className="flex flex-col gap-8">
          <FollowUpPhotosSkeleton />
          <AnswerListSkeleton columns="two" />
        </div>
      </PetWorkLayout>
    </PageShell>
  )
}
