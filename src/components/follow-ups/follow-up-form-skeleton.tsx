import { PET_PHOTO_GRID, PET_PHOTOS_WIDTH } from '@/components/pets/pet-form-layout'
import { EMPTY_INVITATION_FRAME } from '@/components/pets/wall-photo-frame'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'

// Las fotos, el texto y «Contar cómo va» mientras llegan (historia #342), con el alto de cada uno: la
// invitación a la primera foto, la etiqueta con el recuadro de cuatro renglones y el botón grande.
export function FollowUpFormSkeleton() {
  return (
    <>
      <div className={cn(PET_PHOTOS_WIDTH, PET_PHOTO_GRID)}>
        <Skeleton className={cn('col-span-full', EMPTY_INVITATION_FRAME)} />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-31 w-full" />
      </div>
      <Skeleton className="h-14 w-full md:w-52" />
    </>
  )
}
