import { Skeleton } from '@/components/ui/skeleton'
import { SingleTaskLayout } from '@/app/[locale]/_components/single-task-layout'

export default function Loading() {
  return (
    <SingleTaskLayout
      presentation={
        <>
          <Skeleton className="h-9 w-72" />
          <Skeleton className="mt-6 h-12 w-full" />
          <Skeleton className="mt-4 h-12 w-full" />
          <Skeleton className="mt-4 h-12 w-full" />
        </>
      }
      task={
        <>
          <Skeleton className="mt-6 h-5 w-60" />
          <Skeleton className="mt-4 h-14 w-full" />
          <Skeleton className="mt-4 h-11 w-24" />
        </>
      }
    />
  )
}
