import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// Con la forma de «Escribir el código», no la de la tarjeta de verificar: el título, a qué número
// se mandó, el renglón grande y la tirita.
export default function Loading() {
  return (
    <PageShell>
      <Skeleton className="h-9 w-56" />
      <Skeleton className="mt-3 h-6 w-48" />
      <Skeleton className="mt-8 h-14 w-full" />
      <Skeleton className="mt-6 h-14 w-full" />
    </PageShell>
  )
}
