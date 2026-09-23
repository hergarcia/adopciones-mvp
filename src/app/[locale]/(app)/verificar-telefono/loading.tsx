import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// Con la forma de la pantalla: el título, la tarjeta del número y el renglón con su botón.
export default function Loading() {
  return (
    <PageShell>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-8 h-24 w-full" />
      <Skeleton className="mt-8 h-12 w-full" />
      <Skeleton className="mt-6 h-14 w-full" />
    </PageShell>
  )
}
