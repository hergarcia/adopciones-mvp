import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de la cola: el título, la cuenta y tres filas.
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-2 mb-6 h-6 w-32" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="mt-1 h-16 w-full" />
      <Skeleton className="mt-1 h-16 w-full" />
    </PageShell>
  )
}
