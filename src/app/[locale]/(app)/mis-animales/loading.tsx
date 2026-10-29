import { PetWallSkeleton } from '@/components/pets/pet-wall-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de la pared: el título, la tirita y cuatro cards 4:5 con su nombre, su zona, cuándo
// vence, «Ver ficha», «Compartir» y «Más acciones».
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-6 h-14 w-full max-w-[var(--measure)]" />
      <PetWallSkeleton lines="actions" className="mt-8" />
    </PageShell>
  )
}
