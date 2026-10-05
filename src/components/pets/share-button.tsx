'use client'

import { Button } from '@/components/ui/button'
import { useAfterOpen } from '@/hooks/use-after-open'
import type { ShareOrigin } from '@/lib/analytics/events'

export type ShareTexts = {
  action: string
  /** «Luna en adopción»: el título de lo que se comparte. */
  title: string
  copied: string
  manualTitle: string
  manualBody: string
  linkLabel: string
  close: string
}

export type ShareButtonProps = {
  code: string
  from: ShareOrigin
  texts: ShareTexts
  variant?: 'secondary' | 'ghost'
  size?: 'sm' | 'md'
} & (
  | { region?: 'page' }
  /** Sin `ToastProvider` en la página: el botón trae el suyo, con sus etiquetas ya traducidas. */
  | { region: 'own'; toast: { label: string; region: string } }
)

const loadLive = () => import('./share-button-live')

// La cáscara de «Compartir»: el mismo botón que sale del servidor, invisible y ocupando su lugar,
// hasta que llega la parte viva después de abrir (historia #95, research R3). Sin ejecutar nada no
// aparece; al aparecer no mueve nada; y nunca hay un «Compartir» a la vista que no pueda avisar.
export function ShareButton(props: ShareButtonProps) {
  const live = useAfterOpen(loadLive)
  if (live !== null) return <live.ShareButtonLive {...props} />

  return (
    <Button
      variant={props.variant ?? 'secondary'}
      size={props.size ?? 'md'}
      aria-hidden
      tabIndex={-1}
      className="invisible"
    >
      {props.texts.action}
    </Button>
  )
}
