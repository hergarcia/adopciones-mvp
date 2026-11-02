'use client'

import { Button } from '@/components/ui/button'
import { useAfterOpen } from '@/hooks/use-after-open'
import type { ToastPlacement } from './share-button'

export type PosterButtonProps = {
  /** Ya traducidos; `title` es el de la ficha, «Luna en adopción». */
  texts: { action: string; failed: string; close: string; title: string }
  target: {
    /** La ruta que arma la imagen. */
    image: string
    /** El enlace de la ficha con la marca del cartel, que va al lado de la imagen. */
    link: string
    fileName: string
  }
} & ToastPlacement

const loadLive = () => import('./poster-button-live')

// «Guardar cartel» (historia #275), con la cáscara de «Compartir»: el mismo botón, invisible en su
// lugar, hasta que llega la parte viva después de abrir.
export function PosterButton(props: PosterButtonProps) {
  const live = useAfterOpen(loadLive)
  if (live !== null) return <live.PosterButtonLive {...props} />

  return (
    <Button variant="ghost" aria-hidden tabIndex={-1} className="invisible">
      {props.texts.action}
    </Button>
  )
}
