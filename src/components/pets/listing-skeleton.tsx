import { Skeleton } from '@/components/ui/skeleton'
import { PetWallSkeleton } from './pet-wall-skeleton'

const STRIPS = ['species', 'size', 'age', 'sex']

// El listado mientras llega (historia #302), con la forma de `ListingController`: el total, los
// filtros (en el teléfono, la tira de chips que se desliza y el renglón de los demás; desde 1024,
// todo en renglones) y la pared con cuatro cards. Nunca el vacío: todavía no se sabe si hay.
export function ListingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-40" />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 border-b-2 border-line pb-6 lg:flex-row lg:flex-wrap lg:gap-x-12 lg:gap-y-5">
          <div className="-mr-gutter flex gap-8 overflow-hidden md:-mr-gutter-wide lg:contents">
            {STRIPS.map((strip) => (
              <Skeleton key={strip} className="h-15 w-72 shrink-0" />
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3 lg:contents">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-12 w-44" />
            <Skeleton className="h-11 w-72" />
          </div>
        </div>
        <PetWallSkeleton lines="card" />
      </div>
    </div>
  )
}
