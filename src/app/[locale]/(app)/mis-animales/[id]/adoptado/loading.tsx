import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de «¿A quién se lo diste?»: la vuelta, el título y tres renglones de personas.
export default function Loading() {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-11 w-28" />
        <Skeleton className="h-8 w-64" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-48" />
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </PageShell>
  )
}
