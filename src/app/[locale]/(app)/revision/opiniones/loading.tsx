import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de Opiniones: el título y tres opiniones de dos renglones con su día y «Borrar».
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="mb-6 h-9 w-48" />
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="flex max-w-[var(--measure)] flex-col gap-2 border-t-2 border-line py-8"
        >
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-11 w-24" />
          </div>
        </div>
      ))}
    </PageShell>
  )
}
