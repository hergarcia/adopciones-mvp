import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de Encuestas: el título y tres momentos con su pregunta, sus cuentas, las tres barras y
// una respuesta libre.
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="mb-6 h-9 w-48" />
      <div className="flex flex-col gap-8">
        {[0, 1, 2].map((moment) => (
          <div
            key={moment}
            className="flex max-w-[var(--measure)] flex-col gap-4 border-t-2 border-line pt-8"
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </PageShell>
  )
}
