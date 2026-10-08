type Item = { id: string; question: string; answer: string | null }

type Props = {
  /** Ya traducido: «Lo que le preguntaste» o «Lo que te preguntaron». */
  title: string
  /** En el orden en que se hicieron (FR-033). */
  items: Item[]
  /** Ya traducido: lo que se lee bajo una sin contestar, «Todavía no contestó.». */
  unanswered: string
  /** En lugar de esa línea, bajo la pendiente: el formulario para contestarla. */
  pending?: React.ReactNode
}

// Las preguntas del publicador con su respuesta debajo, con sangría y el borde de papel a la izquierda
// como una nota al margen (plan §Diseño). Lo usan las dos puntas; quien solicitó contesta en el lugar
// de la respuesta que falta.
export function QuestionThread({ title, items, unanswered, pending }: Props) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-ink">{title}</h2>
      <ol className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 border-b-2 border-line pb-4">
            <p className="text-base break-words whitespace-pre-line text-ink">{item.question}</p>
            {item.answer !== null ? (
              <p className="border-l-2 border-line pl-4 text-base break-words whitespace-pre-line text-ink">
                {item.answer}
              </p>
            ) : pending === undefined ? (
              <p className="border-l-2 border-line pl-4 text-sm text-ink-muted">{unanswered}</p>
            ) : (
              <div className="border-l-2 border-line pl-4">{pending}</div>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
