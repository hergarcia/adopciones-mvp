'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { resolveIdentityRequest } from '@/actions/review'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { Sheet } from '@/components/ui/sheet'
import { REJECTION_REASONS, type RejectionReason } from '@/lib/verification/identity'
import { useReview } from './review-watcher'

export type ReviewDecisionTexts = {
  approve: string
  reject: string
  rejectTitle: string
  close: string
  reasons: Record<RejectionReason, string>
  /** Por clave de `review.errors`. */
  errors: Record<string, string>
}

type Props = {
  requestId: string
  texts: ReviewDecisionTexts
  /** A dónde va quien dejó de administrar. */
  profileHref: string
}

// «Aprobar» es la tirita; «Rechazar…» abre la hoja con los cuatro motivos, y tocar uno rechaza con
// ese motivo: la hoja es el paso de confirmación, sin texto libre (FR-016). Mientras se resuelve,
// todo queda ocupado y no admite un segundo toque (FR-022a).
export function ReviewDecision({ requestId, texts, profileHref }: Props) {
  const router = useRouter()
  const { imagesReady, recheck } = useReview()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [chosen, setChosen] = useState<RejectionReason | 'approve' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function resolve(choice: RejectionReason | 'approve') {
    setError(null)
    setChosen(choice)
    const input =
      choice === 'approve'
        ? { requestId, outcome: 'approve' }
        : { requestId, outcome: 'reject', reason: choice }
    startTransition(async () => {
      const result = await resolveIdentityRequest(input).catch(() => null)
      if (result?.ok) return router.push(result.data.next)
      const key = result?.error ?? 'review.errors.resolve_failed'
      setSheetOpen(false)
      if (key === 'review.errors.not_admin') return router.push(profileHref)
      if (key === 'review.errors.closed') recheck()
      setError(texts.errors[key] ?? texts.errors['review.errors.resolve_failed'] ?? null)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <ErrorText announce>{error}</ErrorText> : null}
      <Button
        variant="tirita"
        size="lg"
        onClick={() => resolve('approve')}
        disabled={!imagesReady || (pending && chosen !== 'approve')}
        loading={pending && chosen === 'approve'}
      >
        {texts.approve}
      </Button>
      <Sheet
        open={sheetOpen}
        onOpenChange={(next) => (pending ? undefined : setSheetOpen(next))}
        title={texts.rejectTitle}
        closeLabel={texts.close}
        trigger={
          <Button variant="secondary" className="self-start" disabled={pending}>
            {texts.reject}
          </Button>
        }
      >
        {REJECTION_REASONS.map((reason) => (
          <Button
            key={reason}
            variant="secondary"
            className="w-full"
            onClick={() => resolve(reason)}
            loading={pending && chosen === reason}
            disabled={pending && chosen !== reason}
          >
            {texts.reasons[reason]}
          </Button>
        ))}
      </Sheet>
    </div>
  )
}
