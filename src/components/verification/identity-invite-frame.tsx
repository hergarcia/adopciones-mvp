'use client'

import { createContext, use, useActionState, useCallback, useMemo, useState } from 'react'
import { dismissIdentityInvite } from '@/actions/identity-invite'
import { Button } from '@/components/ui/button'

type Dismiss = { hide: () => void; save: (form: FormData) => void }

const DismissContext = createContext<Dismiss | null>(null)

type FrameProps = {
  children: React.ReactNode
  /** El título de la pantalla: al cerrarse la nota, el foco va ahí y no a un botón que ya no está. */
  focusId: string
}

// La nota de la invitación, a la vista o cerrada (historia #281, R10). La nota la dibuja el servidor;
// acá vive solo el estado, así la hoja cliente es la más chica. La acción vive en el marco, que sigue
// montado con la nota cerrada, y nadie lee lo que contesta: si no se guardó, la nota vuelve la
// próxima vez y no hay aviso (FR-015, FR-016).
export function IdentityInviteFrame({ children, focusId }: FrameProps) {
  const [dismissed, setDismissed] = useState(false)
  const [, save] = useActionState(dismissIdentityInvite, null)
  const hide = useCallback(() => {
    setDismissed(true)
    document.getElementById(focusId)?.focus()
  }, [focusId])
  const value = useMemo(() => ({ hide, save }), [hide, save])
  if (dismissed) return null
  return <DismissContext value={value}>{children}</DismissContext>
}

// Un formulario de verdad, así anda sin JavaScript: postea, la acción guarda y la página vuelve sin
// la nota. Con JavaScript, la nota se va al enviar y React llama la acción en una transición.
export function IdentityInviteNotNow({ label }: { label: string }) {
  const dismiss = use(DismissContext)
  return (
    <form action={dismiss?.save} onSubmit={dismiss?.hide} className="self-start sm:self-auto">
      <Button type="submit" variant="ghost" size="sm">
        {label}
      </Button>
    </form>
  )
}
