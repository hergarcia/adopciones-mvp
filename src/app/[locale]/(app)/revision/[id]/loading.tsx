import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de un pedido: los datos, las dos imágenes 4:3 y la tirita.
export default function Loading() {
  return (
    <PageShell width="full">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-10">
        <div className="lg:col-start-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-3 h-24 w-64" />
        </div>
        <div className="flex flex-col gap-6 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="aspect-[4/3] w-full" />
        </div>
        <div className="lg:col-start-2">
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </PageShell>
  )
}
