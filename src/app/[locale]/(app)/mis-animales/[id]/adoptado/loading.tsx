import { PetWorkLayout } from '@/components/pets/pet-work-layout'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de «¿A quién se lo diste?»: la foto del animal, la vuelta y el título al lado, y tres
// renglones de personas.
export default function Loading() {
  return (
    <PageShell width="full">
      <PetWorkLayout
        photo="small"
        head={
          <div className="flex flex-col gap-4">
            <Skeleton className="h-11 w-28" />
            <Skeleton className="h-8 w-64" />
          </div>
        }
        picture={<Skeleton className={WALL_PHOTO_FRAME} />}
      >
        <div className="flex max-w-[var(--measure)] flex-col gap-2">
          <Skeleton className="h-4 w-48" />
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-16 w-full" />
          ))}
        </div>
      </PetWorkLayout>
    </PageShell>
  )
}
