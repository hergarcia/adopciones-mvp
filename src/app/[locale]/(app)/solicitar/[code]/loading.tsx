import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

const QUESTIONS = [0, 1, 2, 3]

// Con la forma del cuestionario: el encabezado con la foto y cuatro renglones de pregunta.
export default function Loading() {
  return (
    <PageShell className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <Skeleton className="aspect-[4/5] w-16" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex flex-col gap-6">
        {QUESTIONS.map((question) => (
          <div key={question} className="flex flex-col gap-2 border-b-2 border-line pb-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
    </PageShell>
  )
}
