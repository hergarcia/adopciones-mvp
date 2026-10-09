import type { ActionResult } from '@/actions/result'
import { ShowMoreLink } from '@/components/forms/show-more-link'
import { WorkQueue } from '@/components/forms/work-queue'
import { DeleteFeedbackDialog, type DeleteFeedbackTexts } from './delete-feedback-dialog'
import { FeedbackEntry } from './feedback-entry'

export type FeedbackListTexts = {
  label: string
  empty: string
  more: string
  delete: DeleteFeedbackTexts
}

type Props = {
  /** De la más nueva a la más vieja, con el renglón del día y la pantalla ya armado. */
  entries: { id: string; body: string; meta: React.ReactNode }[]
  texts: FeedbackListTexts
  /** La misma pantalla con un tramo más; null si no queda ninguna. */
  moreHref: string | null
  remove: (input: { id: string }) => Promise<ActionResult<null>>
}

// Opiniones (US3): las notas una debajo de la otra, como la mesa de quien administra, sin nada que
// diga quién las mandó (FR-043).
export function FeedbackList({ entries, texts, moreHref, remove }: Props) {
  return (
    <>
      <WorkQueue
        items={entries.map((entry) => ({
          key: entry.id,
          node: (
            <FeedbackEntry
              id={entry.id}
              body={entry.body}
              meta={entry.meta}
              action={<DeleteFeedbackDialog id={entry.id} texts={texts.delete} remove={remove} />}
            />
          ),
        }))}
        texts={{ label: texts.label, empty: texts.empty }}
      />
      {moreHref === null ? null : <ShowMoreLink href={moreHref} label={texts.more} />}
    </>
  )
}
