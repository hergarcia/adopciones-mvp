'use client'

import { createContext, use, useCallback, useState } from 'react'
import { Toast, ToastProvider } from '@/components/ui/toast'

type Notice = { message: string; key: number }

const AnnounceContext = createContext<(message: string) => void>(() => undefined)

/** Para la decisión de cada ítem de una lista: el aviso vive acá porque el ítem sale de la lista. */
export function useAnnounce() {
  return use(AnnounceContext)
}

type Props = {
  /** Ya traducidos, de `common.toast`. */
  texts: { label: string; region: string; close: string }
  children: React.ReactNode
}

// El aviso de lo que se hizo, por encima de una lista de trabajo: lo resuelto sale de la lista al
// recargarse, y su aviso no puede irse con ella (Publicaciones por revisar, Reportes).
export function AnnounceNotices({ texts, children }: Props) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const announce = useCallback((message: string) => setNotice({ message, key: Date.now() }), [])

  return (
    <ToastProvider label={texts.label} regionLabel={texts.region}>
      <AnnounceContext value={announce}>{children}</AnnounceContext>
      {notice ? (
        <Toast
          key={notice.key}
          open
          onOpenChange={(next) => (next ? undefined : setNotice(null))}
          message={notice.message}
          variant="success"
          closeLabel={texts.close}
        />
      ) : null}
    </ToastProvider>
  )
}
