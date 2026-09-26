'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { useImageStatus } from '@/hooks/use-image-status'
import type { IdentityPhotoKind } from '@/lib/verification/identity'
import { DocumentFrame } from './document-frame'
import { useReview } from './review-watcher'

type Props = {
  kind: IdentityPhotoKind
  src: string
  texts: { title: string; alt: string; failed: string; retry: string }
}

// Una imagen del pedido: el marco cargando hasta que llega; si no llega, se dice en su lugar y se
// deja volver a pedirla.
export function ReviewImage({ kind, src, texts }: Props) {
  const [attempt, setAttempt] = useState(0)
  const url = attempt === 0 ? src : `${src}?intento=${attempt}`
  const status = useImageStatus(url)
  const { report } = useReview()

  useEffect(() => report(kind, status), [kind, status, report])

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-sm font-medium text-ink">{texts.title}</figcaption>
      {status === 'ready' ? (
        <DocumentFrame state="image" src={url} alt={texts.alt} />
      ) : status === 'loading' ? (
        <DocumentFrame state="loading" />
      ) : (
        <DocumentFrame state="slot" className="flex-col items-start justify-center gap-2">
          <ErrorText announce>{texts.failed}</ErrorText>
          <Button variant="ghost" onClick={() => setAttempt((n) => n + 1)}>
            {texts.retry}
          </Button>
        </DocumentFrame>
      )}
    </figure>
  )
}
