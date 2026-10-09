import type { AdoptionView } from '@/lib/adoptions/adoption-view'
import type { CommitmentFailure } from '@/hooks/use-accept-commitment'
import { AcceptCommitmentButton } from './accept-commitment-button'
import { CommitmentDates } from './commitment-dates'
import { CommitmentText } from './commitment-text'
import { DeclineAdoptionDialog, type DeclineAdoptionTexts } from './decline-adoption-dialog'

export type AdoptionPanelTexts = {
  /** «Rocío te lo dio el 8 de octubre». */
  given: string
  /** «La adopción de Tobi terminó.», solo terminada. */
  ended: string | null
  commitmentTitle: string
  clauses: string[]
  note: string
  dates: { accepted: string[]; pending: string | null }
  accept: { accept: string; failures: Record<CommitmentFailure, string> }
  decline: DeclineAdoptionTexts
}

type Props = {
  applicationId: string
  view: AdoptionView
  texts: AdoptionPanelTexts
}

// La adopción en Mi solicitud (plan §Mi solicitud), bajo el sello «Adoptaste», que ya dice qué pasó:
// quién se lo dio y cuándo, el compromiso con los tres nombres y el día en que aceptó cada una, y
// mientras está pendiente «Acepto el compromiso» y «Yo no adopté» (FR-012, FR-020). Qué va lo
// decide `adoptionView`.
export function AdoptionPanel({ applicationId, view, texts }: Props) {
  return (
    <section aria-labelledby="adopcion" className="flex max-w-[var(--measure)] flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="adopcion" className="text-lg font-medium text-ink">
          {texts.commitmentTitle}
        </h2>
        <p className="text-sm text-ink-muted">{texts.given}</p>
      </div>
      {texts.ended === null ? null : <p className="text-base text-ink">{texts.ended}</p>}
      {view.showsCommitment ? (
        <>
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
      {view.canDecline ? (
        <div>
          <DeclineAdoptionDialog applicationId={applicationId} texts={texts.decline} />
        </div>
      ) : null}
    </section>
  )
}
