'use client'

import { useState } from 'react'
import { SaveFailedStrip } from '@/components/forms/save-failed-strip'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import {
  usePetReview,
  type PetReviewFlow,
  type PetReviewOutcome,
  type PetReviewSettled,
} from '@/hooks/use-pet-review'
import type { PetStatusFailure } from '@/hooks/use-pet-status'
import { useAnnounceReview } from './pet-review-notices'
import { TakedownSheet, type TakedownSheetTexts } from './takedown-sheet'

export type PetReviewDecisionTexts = {
  reviewed: string
  /** Ya con el nombre: «Tobi quedó revisado». */
  done: Record<PetReviewOutcome, string>
  settled: Record<PetReviewSettled, string>
  /** Cada una nombra el botón que se tocó: «Marcar revisada» o «Dar de baja» de la hoja. */
  failures: Record<PetStatusFailure, Record<PetReviewOutcome, string>>
  takedown: TakedownSheetTexts
}

type Props = { petId: string; knownSince: string; texts: PetReviewDecisionTexts }

function Feedback({ flow, texts }: { flow: PetReviewFlow; texts: PetReviewDecisionTexts }) {
  if (flow.failure !== null) {
    return (
      <SaveFailedStrip
        message={texts.failures[flow.failure.kind][flow.failure.outcome]}
        attempt={flow.failure.attempt}
      />
    )
  }
  if (flow.refusal !== null) {
    return <ErrorText announce>{texts.takedown.errors[flow.refusal]}</ErrorText>
  }
  return null
}

// «Marcar revisada» y «Dar de baja», de a una: mientras una corre la otra espera y un segundo toque
// no hace nada. Al salir bien la publicación sale de la lista con su aviso; si otra persona ya la
// resolvió o se borró, sus acciones se reemplazan por eso (FR-026).
export function PetReviewDecision({ petId, knownSince, texts }: Props) {
  const announce = useAnnounceReview()
  const [sheetOpen, setSheetOpen] = useState(false)
  const flow = usePetReview({
    petId,
    knownSince,
    onDone: (outcome) => {
      setSheetOpen(false)
      announce(texts.done[outcome])
    },
  })

  if (flow.settled !== null) {
    return <p className="text-base text-ink-muted">{texts.settled[flow.settled]}</p>
  }

  const feedback = <Feedback flow={flow} texts={texts} />
  return (
    <div className="flex flex-col items-start gap-3">
      {sheetOpen ? null : feedback}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button
          variant="secondary"
          loading={flow.busy === 'reviewed'}
          disabled={flow.busy !== null && flow.busy !== 'reviewed'}
          onClick={() => void flow.run({ outcome: 'reviewed' })}
        >
          {texts.reviewed}
        </Button>
        <TakedownSheet
          petId={petId}
          knownSince={knownSince}
          open={sheetOpen}
          onOpenChange={(next) => (flow.busy === null ? setSheetOpen(next) : undefined)}
          busy={flow.busy === 'taken_down'}
          disabled={flow.busy !== null}
          feedback={sheetOpen ? feedback : null}
          onConfirm={(reason, note) => void flow.run({ outcome: 'taken_down', reason, note })}
          texts={texts.takedown}
        />
      </div>
    </div>
  )
}
