import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de la lista: el título, la cuenta y dos reportes con su motivo, sus renglones y sus
// acciones.
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-2 mb-6 h-5 w-32" />
      {[0, 1].map((item) => (
        <div
          key={item}
          className="flex max-w-[var(--measure)] flex-col gap-2 border-t-2 border-line py-8"
        >
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-11 w-52" />
        </div>
      ))}
    </PageShell>
  )
}
