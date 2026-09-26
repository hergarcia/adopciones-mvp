'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { checkReviewRequest } from '@/actions/review'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/ui/link-button'
import type { IdentityPhotoKind } from '@/lib/verification/identity'
import type { ReviewState } from '@/lib/verification/review-state'
import { REVIEW_POLL_MS } from '@/lib/verification/rules'

export type ReviewClosedTexts = Record<Exclude<ReviewState, 'open'>, string> & {
  /** El nombre del pedido: el `h1` que se queda cuando la vista del pedido se desmonta. */
  title: string
  back: string
}

type ImageStatus = 'loading' | 'ready' | 'failed'

type Review = {
  /** Pregunta ya, sin esperar la próxima vuelta: después de un «ya no se puede resolver». */
  recheck: () => void
  report: (kind: IdentityPhotoKind, status: ImageStatus) => void
  /** Las dos imágenes cargaron: sin verlas, no se aprueba (§Pantallas). */
  imagesReady: boolean
}

const ReviewContext = createContext<Review | null>(null)

export function useReview(): Review {
  const review = useContext(ReviewContext)
  if (review === null) throw new Error('useReview fuera de ReviewWatcher')
  return review
}

type Props = {
  requestId: string
  /** El vencimiento del pedido, en ISO: distingue «venció» de «ya no está» (FR-021). */
  expiresAt: string
  texts: ReviewClosedTexts
  backHref: string
  children: React.ReactNode
}

// Mientras quien administra tiene un pedido abierto, pregunta cada 10 segundos si sigue abierto. Si
// se cerró por otro camino, desmonta las imágenes y las acciones y dice qué pasó (FR-021): a más
// tardar 30 segundos después, sin tocar nada.
export function ReviewWatcher({ requestId, expiresAt, texts, backHref, children }: Props) {
  const [state, setState] = useState<ReviewState>('open')
  const [images, setImages] = useState<Record<IdentityPhotoKind, ImageStatus>>({
    front: 'loading',
    selfie: 'loading',
  })

  const recheck = useCallback(() => {
    void checkReviewRequest(requestId, expiresAt)
      .then((result) => {
        if (result.ok) setState(result.data.state)
      })
      .catch(() => undefined)
  }, [requestId, expiresAt])

  useEffect(() => {
    if (state !== 'open') return undefined
    const timer = setInterval(recheck, REVIEW_POLL_MS)
    return () => clearInterval(timer)
  }, [state, recheck])

  const report = useCallback((kind: IdentityPhotoKind, status: ImageStatus) => {
    setImages((current) => (current[kind] === status ? current : { ...current, [kind]: status }))
  }, [])

  const review = useMemo(
    () => ({
      recheck,
      report,
      imagesReady: images.front === 'ready' && images.selfie === 'ready',
    }),
    [recheck, report, images],
  )

  if (state !== 'open') {
    return (
      <output className="block">
        <h1 className="afiche text-center text-2xl text-ink">{texts.title}</h1>
        <EmptyState
          title={texts[state]}
          action={<LinkButton href={backHref}>{texts.back}</LinkButton>}
        />
      </output>
    )
  }
  return <ReviewContext value={review}>{children}</ReviewContext>
}
