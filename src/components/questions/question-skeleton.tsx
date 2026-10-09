import { Skeleton } from '@/components/ui/skeleton'

// La forma de una página mientras carga, en la columna de lectura: el título en dos renglones, la
// respuesta en tres y una sección.
export function QuestionSkeleton() {
  return (
    <div className="flex max-w-[var(--measure)] flex-col">
      <Skeleton className="h-17 w-full" />
      <Skeleton className="mt-4 h-20 w-full" />
      <Skeleton className="mt-10 h-8 w-1/2" />
      <Skeleton className="mt-4 h-18 w-full" />
      <Skeleton className="mt-4 h-18 w-full" />
    </div>
  )
}
