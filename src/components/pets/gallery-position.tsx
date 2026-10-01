'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  /** El id de la lista de fotos que sigue. */
  galleryId: string
  /** «Foto 2 de 3» por cada foto, ya traducido y en orden. */
  labels: string[]
}

// Los puntos de posición de la galería, que también llevan a su foto: con un mouse sin rueda de
// costado, en la pantalla ancha, son la única manera de pasar de la portada (docs/10
// §`GalleryPosition`). Cuadrados, que lo único redondo es la chapita; el cuadrado mide 8 px y el
// botón 44, el piso táctil. Siguen la foto a la vista con `IntersectionObserver` y se dibujan recién
// al hidratar: sin ejecutar nada no podrían llevar a ningún lado. El renglón está reservado desde el
// servidor, así que aparecer no mueve nada.
export function GalleryPosition({ galleryId, labels }: Props) {
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

  // Cada foto ocupa el ancho de la tira: la n-ésima empieza en n anchos. El desplazamiento suave lo
  // pone la tira, y se apaga con `prefers-reduced-motion`.
  function show(index: number) {
    const list = document.getElementById(galleryId)
    list?.scrollTo({ left: index * list.clientWidth })
  }

  return (
    <div className="flex h-11 justify-center">
      {current === null
        ? null
        : labels.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              aria-current={index === current || undefined}
              aria-controls={galleryId}
              onClick={() => show(index)}
              className="group/dot flex size-11 items-center justify-center focus-visible:-outline-offset-4"
            >
              <span
                className={cn(
                  'size-2 border-2 border-ink transition-[background-color,translate] duration-[var(--dur-fast)] group-active/dot:translate-y-px',
                  index === current ? 'bg-ink' : 'bg-canvas group-hover/dot:bg-ink-muted',
                )}
              />
            </button>
          ))}
    </div>
  )
}
