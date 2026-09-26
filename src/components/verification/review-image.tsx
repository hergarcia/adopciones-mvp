'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorText } from '@/components/ui/error-text'
import { Skeleton } from '@/components/ui/skeleton'
import { useImageStatus } from '@/hooks/use-image-status'
import type { IdentityPhotoKind } from '@/lib/verification/identity'
import { useReview } from './review-watcher'

type Props = {
  kind: IdentityPhotoKind
  src: string
  texts: { title: string; alt: string; failed: string; retry: string }
}

// Una imagen del pedido, con un `img` nativo: la optimización de Next la cachearía en el servidor, y
// no tiene que quedar en ningún lado (FR-019). El hueco es un `Skeleton` 4:3 hasta que carga; si no
// carga, se dice en su lugar y se deja volver a pedirla.
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
        // eslint-disable-next-line next/no-img-element
        <img
          src={url}
          alt={texts.alt}
          className="aspect-[4/3] w-full border-2 border-ink bg-surface object-contain"
        />
      ) : status === 'loading' ? (
        <Skeleton className="aspect-[4/3] w-full" />
      ) : (
        <div className="flex aspect-[4/3] w-full flex-col items-start justify-center gap-2 border-2 border-dashed border-line bg-surface p-4">
          <ErrorText announce>{texts.failed}</ErrorText>
          <Button variant="ghost" onClick={() => setAttempt((n) => n + 1)}>
            {texts.retry}
          </Button>
        </div>
      )}
    </figure>
  )
}
