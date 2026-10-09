import { QuestionIndexSkeleton } from '@/components/questions/question-index-skeleton'
import { PageShell } from '@/app/[locale]/_components/page-shell'

export default function Loading() {
  return (
    <PageShell width="full">
      <QuestionIndexSkeleton />
    </PageShell>
  )
}
