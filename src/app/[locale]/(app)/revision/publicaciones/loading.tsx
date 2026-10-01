import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de la lista: el título, la cuenta y dos publicaciones con el lugar de sus fotos.
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-2 mb-6 h-5 w-24" />
      {[0, 1].map((item) => (
        <div
          key={item}
          className="flex max-w-[var(--measure)] flex-col gap-6 border-t-2 border-line py-8"
        >
          <Skeleton className="h-7 w-48" />
          <Skeleton className="-mx-gutter aspect-[4/5] md:mx-0" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-3/5" />
        </div>
      ))}
    </PageShell>
  )
}
