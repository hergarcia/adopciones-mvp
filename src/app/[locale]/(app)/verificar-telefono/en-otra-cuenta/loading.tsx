import { Skeleton } from '@/components/ui/skeleton'
import { SingleTaskLayout } from '@/app/[locale]/_components/single-task-layout'

export default function Loading() {
  return (
    <SingleTaskLayout
      presentation={
        <>
          <Skeleton className="h-9 w-72" />
          <Skeleton className="mt-3 h-6 w-full" />
        </>
      }
      task={
        <>
          <Skeleton className="mt-8 h-11 w-52" />
          <Skeleton className="mt-6 h-11 w-56" />
          <Skeleton className="mt-2 h-5 w-60" />
          <Skeleton className="mt-6 h-11 w-72" />
          <Skeleton className="mt-2 h-5 w-64" />
        </>
      }
    />
  )
}
