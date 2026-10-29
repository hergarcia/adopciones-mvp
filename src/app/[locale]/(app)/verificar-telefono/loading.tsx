import { Skeleton } from '@/components/ui/skeleton'
import { SingleTaskLayout } from '@/app/[locale]/_components/single-task-layout'

export default function Loading() {
  return (
    <SingleTaskLayout
      presentation={
        <>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-3 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-3/4" />
        </>
      }
      task={
        <>
          <Skeleton className="mt-8 h-12 w-full" />
          <Skeleton className="mt-6 h-10 w-full" />
          <Skeleton className="mt-6 h-14 w-full" />
        </>
      }
    />
  )
}
