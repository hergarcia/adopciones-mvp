import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de la lista: el título y dos cuentas con su nombre, el motivo, quién y «Reactivar».
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="mb-6 h-9 w-64" />
      {[0, 1].map((item) => (
        <div
          key={item}
          className="flex max-w-[var(--measure)] flex-col gap-2 border-t-2 border-line py-8"
        >
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="mt-2 h-11 w-36" />
        </div>
      ))}
    </PageShell>
  )
}
