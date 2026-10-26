import { PetWorkLayout } from '@/components/pets/pet-work-layout'
import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma del panel de la camada: la vuelta, la foto chica al lado del nombre y el recuento, los
// enlaces y una fila por cría.
export default function Loading() {
  return (
    <PageShell width="full">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-11 w-28" />
        <PetWorkLayout
          photo="small"
          head={
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-36" />
            </div>
          }
          picture={<Skeleton className={WALL_PHOTO_FRAME} />}
        >
          <div className="flex max-w-[var(--measure)] flex-col gap-8">
            <Skeleton className="h-11 w-64" />
            <div className="flex flex-col gap-4">
              <Skeleton className="h-7 w-32" />
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </PetWorkLayout>
      </div>
    </PageShell>
  )
}
