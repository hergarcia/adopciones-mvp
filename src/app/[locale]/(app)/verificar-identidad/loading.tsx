import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma del primer paso: el título, la bajada, las dos secciones del consentimiento y la tirita.
export default function Loading() {
  return (
    <PageShell>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-3 h-5 w-full" />
      <Skeleton className="mt-8 h-6 w-40" />
      <Skeleton className="mt-2 h-12 w-full" />
      <Skeleton className="mt-6 h-6 w-48" />
      <Skeleton className="mt-3 h-64 w-full" />
      <Skeleton className="mt-10 h-14 w-full" />
    </PageShell>
  )
}
