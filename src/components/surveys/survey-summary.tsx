type Props = {
  /** El ancla de la sección. */
  id: string
  /** Ya traducidos: la pregunta del momento, sus cuentas y el vacío. */
  texts: { question: string; counts: string; empty: string }
  /** Sin respuestas, las cuentas y la frase del vacío en lugar de las barras y los textos. */
  hasAnswers: boolean
  bars: React.ReactNode
  answers: React.ReactNode
}

// Un momento en Encuestas (plan §Diseño Encuestas): su pregunta, cuántas se ofrecieron, se
// respondieron y se cerraron, las barras de cada opción y lo que escribieron. Separado del siguiente
// por un divisor, sin card: es un renglón más del buzón abierto.
export function SurveySummary({ id, texts, hasAnswers, bars, answers }: Props) {
  return (
    <section
      aria-labelledby={id}
      className="flex max-w-[var(--measure)] flex-col gap-4 border-t-2 border-line pt-8"
    >
      <div className="flex flex-col gap-2">
        <h2 id={id} className="text-lg font-bold text-ink">
          {texts.question}
        </h2>
        <p className="text-sm text-ink-muted">{texts.counts}</p>
      </div>
      {hasAnswers ? (
        <>
          {bars}
          {answers}
        </>
      ) : (
        <p className="text-base text-ink-muted">{texts.empty}</p>
      )}
    </section>
  )
}
