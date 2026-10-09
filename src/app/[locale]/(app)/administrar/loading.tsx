import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de Administrar: el título, la frase, tres renglones de dos líneas, la búsqueda y las
// entradas.
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-2 h-6 w-64" />
      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="border-t-2 border-line">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex flex-col gap-2 border-b-2 border-line py-6">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-6 w-full max-w-[var(--measure)]" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((entry) => (
              <Skeleton key={entry} className="h-11 w-72" />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
