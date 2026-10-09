import { ShowMoreLink } from '@/components/forms/show-more-link'

type Props = {
  /** De la más nueva a la más vieja: el texto entre comillas y el día con la opción, ya armados. */
  answers: { id: string; quote: string; meta: string }[]
  /** Ya traducidos. */
  texts: { title: string; label: string; empty: string; more: string }
  /** La misma pantalla con un tramo más de este momento; null si no queda ninguna. */
  moreHref: string | null
}

// Las respuestas libres de un momento en Encuestas (FR-042): el texto en lectura, el día y la opción
// que lo acompañó debajo, sin el nombre de nadie (FR-043).
export function SurveyAnswerList({ answers, texts, moreHref }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-base font-medium text-ink">{texts.title}</h3>
      {answers.length === 0 ? (
        <p className="text-sm text-ink-muted">{texts.empty}</p>
      ) : (
        <ul aria-label={texts.label} className="flex flex-col gap-4">
          {answers.map((answer) => (
            <li key={answer.id} id={answer.id} className="scroll-mt-4">
              <p className="text-base break-words whitespace-pre-line text-ink">{answer.quote}</p>
              <p className="text-sm text-ink-muted">{answer.meta}</p>
            </li>
          ))}
        </ul>
      )}
      {moreHref === null ? null : <ShowMoreLink href={moreHref} label={texts.more} />}
    </section>
  )
}
