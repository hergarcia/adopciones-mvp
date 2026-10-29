import { SingleTaskColumns } from '@/components/forms/single-task-columns'
import { PageShell } from '@/app/[locale]/_components/page-shell'

type Props = {
  presentation: React.ReactNode
  task: React.ReactNode
}

export function SingleTaskLayout({ presentation, task }: Props) {
  return (
    <PageShell width="wide">
      <SingleTaskColumns presentation={presentation} task={task} />
    </PageShell>
  )
}
