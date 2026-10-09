import { QuestionSkeleton } from '@/components/questions/question-skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

export default function Loading() {
  return (
    <PageShell width="full">
      <QuestionSkeleton />
    </PageShell>
  )
}
