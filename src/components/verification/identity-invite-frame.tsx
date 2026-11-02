'use client'

import { createContext, startTransition, use, useActionState, useCallback, useState } from 'react'
import { dismissIdentityInvite } from '@/actions/identity-invite'
import { Button } from '@/components/ui/button'

const HideContext = createContext<(() => void) | null>(null)

type FrameProps = {
  children: React.ReactNode
  /** El título de la pantalla: al cerrarse la nota, el foco va ahí y no a un botón que ya no está. */
  focusId: string
}

// La nota la dibuja el servidor; acá vive solo si se cerró, así la hoja cliente es la más chica.
export function IdentityInviteFrame({ children, focusId }: FrameProps) {
  const [dismissed, setDismissed] = useState(false)
  const hide = useCallback(() => {
    setDismissed(true)
    document.getElementById(focusId)?.focus()
  }, [focusId])
  if (dismissed) return null
  return <HideContext value={hide}>{children}</HideContext>
}

// Sin JavaScript, el formulario postea a la acción por `useActionState` y la página vuelve sin la
// nota. Con JavaScript ese despacho no corre nunca (onSubmit cancela el envío): la acción se llama
// aparte y con catch, porque un rechazo dentro de `useActionState` se tira al error.tsx de la
// pantalla, y la nota tiene que irse igual y sin aviso (FR-016).
export function IdentityInviteNotNow({ label }: { label: string }) {
  const hide = use(HideContext)
  const [, post] = useActionState(dismissIdentityInvite, null)
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    hide?.()
    startTransition(() => {
      void dismissIdentityInvite().catch(() => null)
    })
  }
  return (
    <form action={post} onSubmit={onSubmit} className="self-start sm:self-auto">
      <Button type="submit" variant="ghost" size="sm">
        {label}
      </Button>
    </form>
  )
}
