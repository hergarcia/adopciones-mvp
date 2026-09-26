import { Skeleton } from '@/components/ui/skeleton'
import { DocumentFrame } from '@/components/verification/document-frame'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La misma grilla y el mismo orden que ReviewRequestView: desde 1024, arriba las dos imágenes 4:3 y
// abajo los datos y la tirita.
export default function Loading() {
  return (
    <PageShell width="full">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-10">
        <div className="lg:row-start-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-3 h-24 w-64" />
        </div>
        <div className="grid gap-6 border-t-2 border-line pt-6 lg:col-span-2 lg:row-start-1 lg:grid-cols-2 lg:gap-x-10 lg:border-t-0 lg:pt-0">
          <ImageSkeleton />
          <ImageSkeleton />
        </div>
        <div className="flex flex-col gap-6 lg:col-start-2 lg:row-start-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
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
