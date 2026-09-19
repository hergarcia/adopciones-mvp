import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// Con la forma del contenido, no un spinner genérico (docs/10 §Componentes).
export default function Loading() {
  return (
    <PageShell>
      <div className="flex items-start gap-4">
        <Skeleton className="size-24" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <Skeleton className="mt-6 h-24 w-full" />
      <Skeleton className="mt-8 h-14 w-full" />
    </PageShell>
  )
}
