import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// Con la forma del formulario y no la del resumen: un esqueleto que anuncia otra pantalla es
// peor que ninguno (docs/10 §Componentes, `Skeleton`).
export default function Loading() {
  return (
    <PageShell>
      <Skeleton className="h-8 w-48" />
      <div className="mt-8 flex items-center gap-4">
        <Skeleton className="size-24" />
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="mt-6 flex flex-col gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-11 w-64" />
      </div>
      <Skeleton className="mt-6 h-14 w-full" />
    </PageShell>
  )
}
