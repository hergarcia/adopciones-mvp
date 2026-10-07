import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'

type Columns = 'one' | 'two'

type Props = {
  /** Ya traducido: «Lo que contestaste». */
  title: string
  /** Pregunta y respuesta en palabras, en el orden del cuestionario, solo las contestadas. */
  items: { id: string; question: string; answer: string }[]
  /** Lo que se puede hacer con cada respuesta, por id, al lado de ella: «Cambiar» en el repaso. */
  actions?: Record<string, React.ReactNode>
  /** `two`: dos columnas desde 1024, donde las respuestas tienen la hoja entera al lado de la foto. */
  columns?: Columns
}

const SECTION = 'flex flex-col gap-4'
const ANSWER_ROW = 'flex flex-col gap-1 border-b-2 border-line pb-4'
const SKELETON_ROWS = ['a', 'b', 'c', 'd']

function answerGrid(columns: Columns) {
  return cn('grid gap-4', columns === 'two' && 'lg:grid-cols-2 lg:gap-x-12')
}

// Lo que contestó, pregunta por pregunta (FR-072): la pregunta chica y apagada, la respuesta como la
// escribió.
export function AnswerList({ title, items, actions, columns = 'one' }: Props) {
  return (
    <section className={SECTION}>
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      <dl className={answerGrid(columns)}>
        {items.map((item) => (
          <div key={item.id} className={ANSWER_ROW}>
            <dt className="text-sm text-ink-muted">{item.question}</dt>
            <dd className="flex items-baseline justify-between gap-4">
              <span className="min-w-0 text-base break-words whitespace-pre-line text-ink">
                {item.answer}
              </span>
              {actions?.[item.id]}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function AnswerListSkeleton({ columns = 'one' }: { columns?: Columns }) {
  return (
    <div className={SECTION}>
      <Skeleton className="h-7 w-48" />
      <div className={answerGrid(columns)}>
        {SKELETON_ROWS.map((row) => (
          <div key={row} className={ANSWER_ROW}>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
