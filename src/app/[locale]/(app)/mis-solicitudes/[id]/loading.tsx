import { PetWorkLayout } from '@/components/pets/pet-work-layout'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const ANSWERS = [0, 1, 2, 3]

// Con la forma de Mi solicitud: el animal con su sello al lado de la foto y las respuestas.
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
        <div className="flex max-w-[var(--measure)] flex-col gap-4">
          {ANSWERS.map((answer) => (
            <div key={answer} className="flex flex-col gap-1 border-b-2 border-line pb-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </PetWorkLayout>
    </PageShell>
  )
}
