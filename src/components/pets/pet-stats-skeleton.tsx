import { Skeleton } from '@/components/ui/skeleton'

const ROWS = ['opens', 'taps', 'stops', 'applications'] as const

export function PetStatsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="flex flex-col gap-3">
        {ROWS.map((row) => (
          <div key={row} className="flex items-baseline gap-2">
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-5 w-44" />
          </div>
        ))}
      </div>
      <Skeleton className="h-6 w-52" />
    </div>
  )
}
