'use client'

import { createContext, use, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'

const DismissContext = createContext<(() => void) | null>(null)

type FrameProps = {
  children: React.ReactNode
  /** El título de la pantalla: al cerrarse la nota, el foco va ahí y no a un botón que ya no está. */
  focusId: string
}

// La nota de la invitación, a la vista o cerrada (historia #281, R10). La nota la dibuja el servidor;
// acá vive solo el estado, así la hoja cliente es la más chica.
export function IdentityInviteFrame({ children, focusId }: FrameProps) {
  const [dismissed, setDismissed] = useState(false)
  const dismiss = useCallback(() => {
    setDismissed(true)
    document.getElementById(focusId)?.focus()
  }, [focusId])
  if (dismissed) return null
  return <DismissContext value={dismiss}>{children}</DismissContext>
}

export function IdentityInviteNotNow({ label }: { label: string }) {
  const dismiss = use(DismissContext)
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="self-start sm:self-auto"
      onClick={dismiss ?? undefined}
    >
      {label}
    </Button>
  )
}
