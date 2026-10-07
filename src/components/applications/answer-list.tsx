import { cn } from '@/lib/cn'

type Props = {
  /** Ya traducido: «Lo que contestaste». */
  title: string
  /** Pregunta y respuesta en palabras, en el orden del cuestionario, solo las contestadas. */
  items: { id: string; question: string; answer: string }[]
  /** Lo que se puede hacer con cada respuesta, por id, al lado de ella: «Cambiar» en el repaso. */
  actions?: Record<string, React.ReactNode>
  /** `two`: dos columnas desde 1024, donde las respuestas tienen la hoja entera al lado de la foto. */
  columns?: 'one' | 'two'
}

// Lo que contestó, pregunta por pregunta (FR-072): la pregunta chica y apagada, la respuesta como la
// escribió.
export function AnswerList({ title, items, actions, columns = 'one' }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      <dl className={cn('grid gap-4', columns === 'two' && 'lg:grid-cols-2 lg:gap-x-12')}>
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-1 border-b-2 border-line pb-4">
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
