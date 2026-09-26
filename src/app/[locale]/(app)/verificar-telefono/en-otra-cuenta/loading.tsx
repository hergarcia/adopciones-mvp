import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

export default function Loading() {
  return (
    <PageShell>
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-3 h-6 w-full" />
      <Skeleton className="mt-8 h-11 w-52" />
      <Skeleton className="mt-6 h-11 w-56" />
      <Skeleton className="mt-2 h-5 w-60" />
      <Skeleton className="mt-6 h-11 w-72" />
      <Skeleton className="mt-2 h-5 w-64" />
    </PageShell>
  )
}
