import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de la pantalla: el título, desde cuándo y tres renglones del motivo y la ayuda.
export default function Loading() {
  return (
    <PageShell>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-4 h-5 w-32" />
      <Skeleton className="mt-4 h-6 w-full" />
      <Skeleton className="mt-2 h-6 w-full" />
      <Skeleton className="mt-4 h-6 w-3/4" />
    </PageShell>
  )
}
