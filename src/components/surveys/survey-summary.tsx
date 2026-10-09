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

/** El renglón de un momento, que comparte el `loading` de Encuestas para dibujar su forma. */
export const SURVEY_SUMMARY_LAYOUT =
  'flex max-w-[var(--measure)] flex-col gap-4 border-t-2 border-line pt-8 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-x-12'

// Un momento en Encuestas (plan §Diseño Encuestas): su pregunta, cuántas se ofrecieron, se
// respondieron y se cerraron, las barras de cada opción y lo que escribieron. Separado del siguiente
// por un divisor, sin card: es un renglón más del buzón abierto. Desde 1024, la pregunta con sus
// cuentas y barras a la izquierda y lo que escribieron a la derecha, en la medida de lectura: en una
// columna de 640 quedaba un tercio de la hoja vacío a lo largo de toda la página (docs/10 §Pantallas
// anchas).
export function SurveySummary({ id, texts, hasAnswers, bars, answers }: Props) {
  return (
    <section aria-labelledby={id} className={SURVEY_SUMMARY_LAYOUT}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 id={id} className="text-lg font-bold text-ink">
            {texts.question}
          </h2>
          <p className="text-sm text-ink-muted">{texts.counts}</p>
        </div>
        {hasAnswers ? bars : null}
      </div>
      <div className="max-w-[var(--measure)]">
        {hasAnswers ? answers : <p className="text-base text-ink-muted">{texts.empty}</p>}
      </div>
    </section>
  )
}
