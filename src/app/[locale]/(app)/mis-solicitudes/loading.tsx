import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const ROWS = [0, 1, 2]

// Con la forma de la carpeta: el título, el contador y tres filas.
export default function Loading() {
  return (
    <PageShell className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex flex-col">
        {ROWS.map((row) => (
          <div key={row} className="flex items-start gap-4 border-b-2 border-line py-3">
            <Skeleton className="aspect-[4/5] w-14" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
