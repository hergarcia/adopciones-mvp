export type RescuerStepsTexts = { title: string; steps: readonly string[] }

// El número es dibujo: la `ol` ya le dice el orden a un lector de pantalla.
export function RescuerSteps({ texts }: { texts: RescuerStepsTexts }) {
  return (
    <section aria-labelledby="rescuer-steps-title">
      <h2 id="rescuer-steps-title" className="afiche text-xl text-ink">
        {texts.title}
      </h2>
      <ol className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-8">
        {texts.steps.map((step, index) => (
          <li key={step} className="flex max-w-[var(--measure)] gap-4">
            <span aria-hidden className="afiche w-6 shrink-0 text-2xl text-ink">
              {index + 1}
            </span>
            <p className="text-base text-ink">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
