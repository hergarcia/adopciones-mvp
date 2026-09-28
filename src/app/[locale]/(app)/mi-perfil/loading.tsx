import { MyProfileLayout } from '@/components/profile/my-profile-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// Con la forma del contenido, no un spinner genérico (docs/10 §Componentes).
export default function Loading() {
  return (
    <PageShell width="full">
      <MyProfileLayout
        summary={
          <div className="flex items-start gap-4">
            <Skeleton className="size-24" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        }
        publicProfile={
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-3 h-11 w-52" />
            <Skeleton className="mt-3 h-11 w-44" />
          </div>
        }
        email={<Skeleton className="h-24 w-full" />}
        phone={<Skeleton className="h-24 w-full" />}
        identity={<Skeleton className="h-48 w-full" />}
        footer={<Skeleton className="h-14 w-full" />}
      />
    </PageShell>
  )
}
