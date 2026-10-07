import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// Con la forma de Solicitud enviada: el animal pegado, centrado, el título y los dos caminos.
export default function Loading() {
  return (
    <PageShell width="full">
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="mb-2 w-48 md:w-56">
          <Skeleton className={WALL_PHOTO_FRAME} />
        </div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-11 w-52" />
        <Skeleton className="h-11 w-44" />
      </div>
    </PageShell>
  )
}
