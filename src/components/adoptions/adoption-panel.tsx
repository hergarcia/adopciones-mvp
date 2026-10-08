import type { AdoptionView } from '@/lib/adoptions/adoption-view'
import type { CommitmentFailure } from '@/hooks/use-accept-commitment'
import { AcceptCommitmentButton } from './accept-commitment-button'
import { CommitmentDates } from './commitment-dates'
import { CommitmentText } from './commitment-text'

export type AdoptionPanelTexts = {
  /** «Adoptaste a Tobi». */
  title: string
  /** «Rocío te lo dio el 8 de octubre». */
  given: string
  /** «La adopción de Tobi terminó.», solo terminada. */
  ended: string | null
  commitmentTitle: string
  clauses: string[]
  note: string
  dates: { accepted: string[]; pending: string | null }
  accept: { accept: string; failures: Record<CommitmentFailure, string> }
}

type Props = {
  applicationId: string
  view: AdoptionView
  texts: AdoptionPanelTexts
}

// La adopción en Mi solicitud (plan §Mi solicitud): a quién se lo dio y cuándo, el compromiso con
// los tres nombres y el día en que aceptó cada una, y mientras está pendiente «Acepto el
// compromiso» (FR-012). Qué va lo decide `adoptionView`.
export function AdoptionPanel({ applicationId, view, texts }: Props) {
  return (
    <section aria-labelledby="adopcion" className="flex max-w-[var(--measure)] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="adopcion" className="text-lg font-medium text-ink">
          {texts.title}
        </h2>
        <p className="text-sm text-ink-muted">{texts.given}</p>
      </div>
      {texts.ended === null ? null : <p className="text-base text-ink">{texts.ended}</p>}
      {view.showsCommitment ? (
        <>
          <h3 className="text-base font-medium text-ink">{texts.commitmentTitle}</h3>
          <CommitmentText clauses={texts.clauses} note={texts.note} />
          <CommitmentDates
            accepted={texts.dates.accepted}
            pending={texts.dates.pending}
            urgent={view.canAccept}
          />
        </>
      ) : null}
      {view.canAccept ? (
        <AcceptCommitmentButton applicationId={applicationId} texts={texts.accept} />
      ) : null}
    </section>
  )
}
