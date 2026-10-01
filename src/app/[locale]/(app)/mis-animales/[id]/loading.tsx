import { WALL_PHOTO_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma del panel: la vuelta, el nombre, la card 4:5 y la columna de acciones.
export default function Loading() {
  return (
    <PageShell width="full">
      <div className="flex max-w-[var(--measure)] flex-col gap-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className={cn(WALL_PHOTO_FRAME, 'w-full max-w-xs')} />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-11 w-40" />
        <Skeleton className="h-11 w-48" />
      </div>
    </PageShell>
  )
}
