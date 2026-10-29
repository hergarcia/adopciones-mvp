'use client'

import { Button } from '@/components/ui/button'
import { useAfterOpen } from '@/hooks/use-after-open'
import type { ShareOrigin } from '@/lib/analytics/events'
import type { ToastPlacement } from './share-button'

/** Ya traducidos, con el texto entero que se copia. */
export type GroupPostTexts = {
  action: string
  text: string
  copied: string
  manualTitle: string
  manualBody: string
  textLabel: string
  close: string
}

export type GroupPostButtonProps = {
  from: Extract<ShareOrigin, `${string}_group_text`>
  texts: GroupPostTexts
  size?: 'sm' | 'md'
} & ToastPlacement

const loadLive = () => import('./group-post-button-live')

// «Copiar texto para el grupo» (historia #248), con la cáscara de «Compartir»: el mismo botón,
// invisible en su lugar, hasta que llega la parte viva después de abrir.
export function GroupPostButton(props: GroupPostButtonProps) {
  const live = useAfterOpen(loadLive)
  if (live !== null) return <live.GroupPostButtonLive {...props} />

  return (
    <Button
      variant="ghost"
      size={props.size ?? 'md'}
      aria-hidden
      tabIndex={-1}
      className="invisible"
    >
      {props.texts.action}
    </Button>
  )
}
