import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

export default function Loading() {
  return (
    <PageShell>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-6 w-48" />
      <Skeleton className="mt-2 h-11 w-40" />
      <Skeleton className="mt-8 h-14 w-full" />
      <Skeleton className="mt-6 h-14 w-full" />
      <Skeleton className="mt-10 h-10 w-full" />
      <Skeleton className="mt-2 h-11 w-52" />
    </PageShell>
  )
}
