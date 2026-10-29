import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const ROWS = [0, 1, 2]

// Con la forma de la lista: el título, la bajada y tres avisos de dos renglones.
export default function Loading() {
  return (
    <PageShell>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 mb-6 h-12 w-full" />
      <div className="flex flex-col border-t-2 border-line">
        {ROWS.map((row) => (
          <div key={row} className="flex flex-col gap-2 border-b-2 border-line py-4">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </PageShell>
  )
}
