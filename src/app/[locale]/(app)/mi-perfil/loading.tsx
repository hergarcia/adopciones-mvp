import { MyProfileLayout } from '@/components/profile/my-profile-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// Con la forma del contenido, no un spinner genérico (docs/10 §Componentes): los mismos grupos en el
// mismo orden, así nada salta de lugar al llegar los datos.
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
        primaryAction={<Skeleton className="h-14 w-full" />}
        publicProfile={
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-11 w-52" />
          </div>
        }
        lists={
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
        email={<Skeleton className="h-24 w-full" />}
        phone={<Skeleton className="h-24 w-full" />}
        identity={<Skeleton className="h-48 w-full" />}
        footer={
          <div className="mt-8 flex flex-col gap-2 border-t-2 border-line pt-6">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-40" />
          </div>
        }
      />
    </PageShell>
  )
}
