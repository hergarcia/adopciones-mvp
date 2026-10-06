import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const ANSWERS = [0, 1, 2, 3]

// Con la forma de Mi solicitud: el animal con su sello y las respuestas.
export default function Loading() {
  return (
    <PageShell className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Skeleton className="aspect-[4/5] w-16" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {ANSWERS.map((answer) => (
          <div key={answer} className="flex flex-col gap-1 border-b-2 border-line pb-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </PageShell>
  )
}
