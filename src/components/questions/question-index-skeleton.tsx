import { Skeleton } from '@/components/ui/skeleton'

const GROUPS = ['giver', 'adopter', 'everyone'] as const

// La forma del índice mientras carga: el título, la bajada y los tres grupos con dos preguntas de dos
// renglones, en tres columnas desde 1024 como el índice.
export function QuestionIndexSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-2/3 max-w-[var(--measure)]" />
      <Skeleton className="mt-2 h-6 w-full max-w-[var(--measure)]" />
      <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-0 lg:divide-x-2 lg:divide-line">
        {GROUPS.map((group) => (
          <div key={group} className="flex flex-col lg:px-8 lg:first:pl-0 lg:last:pr-0">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="mt-3 h-14 w-full" />
            <Skeleton className="mt-4 h-14 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
