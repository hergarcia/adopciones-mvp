import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const CARDS = ['a', 'b', 'c', 'd']

// La forma de la pared: el título, la tirita y cuatro cards 4:5 con su nombre y su zona.
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-6 h-14 w-full max-w-[var(--measure)]" />
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {CARDS.map((card) => (
          <div key={card} className="flex flex-col gap-2 p-1">
            <Skeleton className="aspect-[4/5] w-full" />
            <Skeleton className="mt-1 h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </PageShell>
  )
}
