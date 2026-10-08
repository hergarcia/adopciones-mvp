import { AnswerListSkeleton } from '@/components/applications/answer-list'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// Con la forma de una solicitud: quién es, su estado y lo que contestó. Es también el límite del
// prefetch: traerla por adelantado no la da por abierta (R6).
export default function Loading() {
  return (
    <PageShell width="reading" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <div className="flex items-center gap-4">
          <Skeleton className="size-24" />
          <Skeleton className="size-14" />
        </div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-8 w-56" />
      <AnswerListSkeleton />
    </PageShell>
  )
}
