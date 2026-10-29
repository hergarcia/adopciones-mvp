import { Skeleton } from '@/components/ui/skeleton'
import { SingleTaskLayout } from '@/app/[locale]/_components/single-task-layout'

export default function Loading() {
  return (
    <SingleTaskLayout
      presentation={
        <>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-3 h-6 w-48" />
          <Skeleton className="mt-2 h-11 w-40" />
        </>
      }
      task={
        <>
          <Skeleton className="mt-8 h-14 w-full" />
          <Skeleton className="mt-6 h-14 w-full" />
          <Skeleton className="mt-10 h-10 w-full" />
          <Skeleton className="mt-2 h-11 w-52" />
        </>
      }
    />
  )
}
