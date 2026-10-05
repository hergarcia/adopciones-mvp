'use client'

import { useAfterOpen } from '@/hooks/use-after-open'

export type GalleryPositionProps = {
  /** El id de la lista de fotos que sigue. */
  galleryId: string
  /** «Foto 2 de 3» por cada foto, ya traducido y en orden. */
  labels: string[]
}

const loadLive = () => import('./gallery-position-live')

// Los puntos se dibujan recién cuando llegan, después de abrir (historia #95): sin ejecutar nada no
// podrían llevar a ningún lado. El renglón está reservado desde el servidor, así que aparecer no
// mueve nada.
export function GalleryPosition(props: GalleryPositionProps) {
  const live = useAfterOpen(loadLive)
  if (live !== null) return <live.GalleryPositionLive {...props} />
  return <div className="flex h-11 justify-center" />
}
