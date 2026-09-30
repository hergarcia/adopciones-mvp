import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const ROWS = [0, 1, 2]

function ListShape() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-6 w-40" />
      {ROWS.map((row) => (
        <div key={row} className="flex items-start gap-4 py-4">
          <Skeleton className="size-12" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Con la forma de las dos listas, no un spinner genérico (docs/10 §Componentes).
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="h-8 w-48" />
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ListShape />
        <ListShape />
      </div>
    </PageShell>
  )
}
