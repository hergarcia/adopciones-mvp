export type BrandSenseTexts = {
  title: string
  /** La acepción como la escribe el diccionario, entre comillas. */
  definition: string
  /** Lo que esa acepción quiere decir para el sitio. */
  reading: string
}

export type BrandSensesTexts = {
  intro: string
  senses: BrandSenseTexts[]
  source: string
}

export function BrandSenses({ texts }: { texts: BrandSensesTexts }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-ink">{texts.intro}</p>
      <dl className="flex flex-col border-t-2 border-ink">
        {texts.senses.map((sense) => (
          <div key={sense.title} className="flex flex-col gap-2 border-b-2 border-line py-4">
            <dt className="afiche text-lg text-ink">{sense.title}</dt>
            <dd className="flex flex-col gap-2">
              <span className="text-sm text-ink-muted">{sense.definition}</span>
              <span className="text-base text-ink">{sense.reading}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-ink-muted">{texts.source}</p>
    </div>
  )
}
