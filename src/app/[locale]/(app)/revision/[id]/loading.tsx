import { Skeleton } from '@/components/ui/skeleton'
import { DocumentFrame } from '@/components/verification/document-frame'
import { ReviewRequestLayout } from '@/components/verification/review-request-layout'
import { PageShell } from '@/app/[locale]/_components/page-shell'

export default function Loading() {
  return (
    <PageShell width="full">
      <ReviewRequestLayout
        details={
          <>
            <Skeleton className="h-9 w-56" />
            <Skeleton className="mt-3 h-24 w-64" />
          </>
        }
        images={
          <>
            <ImageSkeleton />
            <ImageSkeleton />
          </>
        }
        decision={
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        }
      />
    </PageShell>
  )
}

function ImageSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-5 w-40" />
      <DocumentFrame state="loading" />
    </div>
  )
}
