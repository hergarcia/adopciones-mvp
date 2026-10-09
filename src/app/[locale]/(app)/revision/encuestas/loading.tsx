import { SURVEY_SUMMARY_LAYOUT } from '@/components/surveys/survey-summary'
import { Skeleton } from '@/components/ui/skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

// La forma de Encuestas: el título y tres momentos con su pregunta, sus cuentas, las tres barras y
// una respuesta libre; desde 1024, las respuestas al lado, como en `SurveySummary`.
export default function Loading() {
  return (
    <PageShell width="full">
      <Skeleton className="mb-6 h-9 w-48" />
      <div className="flex flex-col gap-8">
        {[0, 1, 2].map((moment) => (
          <div key={moment} className={SURVEY_SUMMARY_LAYOUT}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            </div>
            <div className="flex max-w-[var(--measure)] flex-col gap-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  )
}
