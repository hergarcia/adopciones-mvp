type Props = {
  /** Ya traducido: «Lo que contestaste». */
  title: string
  /** Pregunta y respuesta en palabras, en el orden del cuestionario, solo las contestadas. */
  items: { id: string; question: string; answer: string }[]
}

// Lo que contestó, pregunta por pregunta (FR-072): la pregunta chica y apagada, la respuesta como la
// escribió.
export function AnswerList({ title, items }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      <dl className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-1 border-b-2 border-line pb-4">
            <dt className="text-sm text-ink-muted">{item.question}</dt>
            <dd className="text-base break-words whitespace-pre-line text-ink">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
