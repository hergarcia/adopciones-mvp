import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const ROWS = [0, 1, 2]

// Con la forma de la lista, no un spinner genérico (docs/10 §Componentes).
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="flex max-w-[var(--measure)] flex-col">
        {ROWS.map((row) => (
          <div key={row} className="flex items-start gap-4 py-3">
            <Skeleton className="size-12" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
