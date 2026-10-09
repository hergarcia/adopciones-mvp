import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de la ficha: la cabecera con el disco y dos líneas, y tres partes de dos renglones.
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="mb-4 h-11 w-48" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="flex items-start gap-4">
          <Skeleton className="size-24 shrink-0" />
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>
        <div className="flex flex-col gap-10">
          {[0, 1, 2].map((part) => (
            <div key={part} className="flex flex-col gap-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-6 w-full max-w-[var(--measure)]" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
