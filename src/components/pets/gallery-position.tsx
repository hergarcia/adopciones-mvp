'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  /** El id de la lista de fotos que sigue. */
  galleryId: string
  total: number
}

// Los puntos de posición de la galería: cuadrados, que lo único redondo es la chapita (docs/10
// §Antipatrones). Siguen la foto a la vista con `IntersectionObserver`. Se dibujan recién al
// hidratar: sin ejecutar nada quedarían clavados en la primera. El renglón está reservado desde el
// servidor, así que aparecer no mueve nada. Decorativos: cada foto ya dice «Foto 2 de 3» en su `alt`.
export function GalleryPosition({ galleryId, total }: Props) {
  const [current, setCurrent] = useState<number | null>(null)

  useEffect(() => {
    const items = Array.from(document.getElementById(galleryId)?.children ?? [])
    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries.find((entry) => entry.isIntersecting)
        if (seen !== undefined) setCurrent(items.indexOf(seen.target))
      },
      { threshold: 0.6 },
    )
    for (const item of items) observer.observe(item)
    return () => observer.disconnect()
  }, [galleryId])

  return (
    <div aria-hidden className="mt-3 flex h-2 justify-center gap-2">
      {current === null
        ? null
        : Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cn(
                'size-2 border-2 border-ink transition-colors duration-[var(--dur-fast)]',
                index === current ? 'bg-ink' : 'bg-canvas',
              )}
            />
          ))}
    </div>
  )
}
